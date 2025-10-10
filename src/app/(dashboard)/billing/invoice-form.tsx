

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Invoice, Patient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, Treatment } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, X, Check, Trash2, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTreatments, getPatientById } from "@/lib/api";


const formSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient."}),
  issueDate: z.date({
    required_error: "An issue date is required.",
  }),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  status: z.enum(['Paid', 'Pending', 'Overdue']),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer']).optional(),
  otherCharges: z.array(z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0, "Amount must be zero or more."),
  })).optional(),
});

type InvoiceFormProps = {
    invoice?: Invoice;
    patients: Patient[];
    onSave: (data: Omit<Invoice, 'id' | 'patientName' | 'branchId' | 'amount' | 'paidAmount' | 'treatmentIds'>, treatments: InvoiceTreatment[]) => void;
    onOpenChange: (open: boolean) => void;
};

export function InvoiceForm({ invoice, patients, onSave, onOpenChange }: InvoiceFormProps) {
  const [selectedTreatments, setSelectedTreatments] = useState<InvoiceTreatment[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: invoice?.patientId ?? "",
        issueDate: invoice ? parseISO(invoice.issueDate) : new Date(),
        dueDate: invoice ? parseISO(invoice.dueDate) : undefined,
        status: invoice?.status ?? 'Pending',
        paymentMethod: invoice?.paymentMethod,
        otherCharges: invoice?.otherCharges ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "otherCharges",
  });

  const patientId = form.watch('patientId');
  const otherCharges = form.watch('otherCharges') || [];
  
  useEffect(() => {
    if (invoice) {
        setSelectedTreatments(invoice.treatments);
    }
  }, [invoice]);

  useEffect(() => {
    const fetchPatientTreatments = async () => {
        if (patientId) {
            const patientData = await getPatientById(patientId);
            if (patientData) {
                const unbilledTreatments = patientData.treatmentPlans.filter(
                    t => t.status === 'Completed' && !t.invoiceId
                );
                setAvailableTreatments(unbilledTreatments);
            }
        } else {
            setAvailableTreatments([]);
        }
    };
    fetchPatientTreatments();
  }, [patientId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
        ...values,
        otherCharges: values.otherCharges || [],
        treatments: selectedTreatments,
        issueDate: format(values.issueDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    }, selectedTreatments);
  }

  const handleTreatmentToggle = (treatment: InvoiceTreatment) => {
    setSelectedTreatments(prev => 
        prev.some(t => t.procedure === treatment.procedure)
            ? prev.filter(t => t.procedure !== treatment.procedure)
            : [...prev, treatment]
    );
  }
  
  const handleTreatmentSelect = (procedure: string) => {
    const treatment = availableTreatments.find(t => t.procedure === procedure);
    if (treatment) {
        handleTreatmentToggle({ procedure: treatment.procedure, cost: treatment.cost });
    }
  }

  const subTotal = useMemo(() => {
    return selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
  }, [selectedTreatments]);

  const otherChargesTotal = useMemo(() => {
    return otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  }, [otherCharges]);

  const totalAmount = useMemo(() => {
    return subTotal + otherChargesTotal;
  }, [subTotal, otherChargesTotal]);

  const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Insurance', 'Bank Transfer'];

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogDescriptionComponent>
                   {invoice ? 'Update the details for the invoice.' : 'Select a patient and add treatments to the invoice.'}
                </DialogDescriptionComponent>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
                        <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Patient</FormLabel>
                                <FormControl>
                                    <Combobox
                                        options={patients.map(p => ({ value: p.id, label: p.name }))}
                                        value={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                            setSelectedTreatments([]);
                                        }}
                                        placeholder="Select a patient"
                                        searchPlaceholder="Search patients..."
                                        emptyMessage="No patient found."
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        
                        <FormItem>
                            <FormLabel>Treatments to Include</FormLabel>
                            <FormControl>
                                <div className="rounded-md border h-48 overflow-y-auto">
                                    <Command>
                                        <CommandInput placeholder="Search treatments..." />
                                        <CommandList>
                                            <CommandEmpty>No available treatments found for this patient.</CommandEmpty>
                                            <CommandGroup>
                                                {availableTreatments.map(treatment => (
                                                    <CommandItem
                                                        key={treatment.id}
                                                        value={treatment.procedure}
                                                        onSelect={() => handleTreatmentSelect(treatment.procedure)}
                                                        className="flex justify-between items-center cursor-pointer"
                                                        disabled={!patientId}
                                                    >
                                                    <div>
                                                            <span>{treatment.procedure} {treatment.tooth ? `(#${treatment.tooth})` : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                            <span className="font-mono">${treatment.cost.toFixed(2)}</span>
                                                            {selectedTreatments.some(t => t.procedure === treatment.procedure) && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </div>
                            </FormControl>
                             <FormDescription>
                               Select from the list of completed, unbilled treatments for this patient.
                            </FormDescription>
                        </FormItem>
                        

                        {selectedTreatments.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Selected Treatments for Invoice</p>
                                <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Procedure</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {selectedTreatments.map(treatment => (
                                        <TableRow key={treatment.procedure}>
                                            <TableCell>{treatment.procedure}</TableCell>
                                            <TableCell className="text-right">${treatment.cost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTreatmentToggle(treatment)}>
                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <FormLabel>Other Charges</FormLabel>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`otherCharges.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl>
                                                    <Input placeholder="Charge description" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`otherCharges.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} className="w-28" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: "", amount: 0 })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Other Charge
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {paymentMethods.map(method => (
                                                <SelectItem key={method} value={method}>{method}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <div className="rounded-md border p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal (Treatments)</span>
                                <span>${subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal (Other Charges)</span>
                                <span>${otherChargesTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                                <span>Total Amount</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Issue Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-6 px-6 pb-6 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={selectedTreatments.length === 0 && otherChargesTotal <= 0}>{invoice ? 'Save Changes' : 'Create Invoice'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </div>
        </DialogContent>
    </Dialog>
  );
}

