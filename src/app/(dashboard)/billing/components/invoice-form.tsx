
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Invoice, Patient, Treatment } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, X, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";


const formSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient."}),
  issueDate: z.date({
    required_error: "An issue date is required.",
  }),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  status: z.enum(['Paid', 'Pending', 'Overdue']),
});

type InvoiceFormProps = {
    invoice?: Invoice;
    patients: Patient[];
    onSave: (data: Omit<Invoice, 'id' | 'patientName' | 'branchId' | 'amount'>, treatments: Treatment[]) => void;
    onOpenChange: (open: boolean) => void;
};

export function InvoiceForm({ invoice, patients, onSave, onOpenChange }: InvoiceFormProps) {
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: invoice?.patientId ?? "",
        issueDate: invoice ? parseISO(invoice.issueDate) : new Date(),
        dueDate: invoice ? parseISO(invoice.dueDate) : undefined,
        status: invoice?.status ?? 'Pending'
    },
  });

  const patientId = form.watch('patientId');

  const availableTreatments = useMemo(() => {
    if (!patientId) return [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return [];
    return patient.treatmentPlans.filter(t => t.status === 'Completed' && (!t.invoiceId || (invoice && invoice.treatmentIds.includes(t.id))));
  }, [patientId, patients, invoice]);

  useEffect(() => {
    if (invoice && patientId) {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const invoiceTreatments = patient.treatmentPlans.filter(t => invoice.treatmentIds.includes(t.id));
            setSelectedTreatments(invoiceTreatments);
        }
    } else {
        setSelectedTreatments([]);
    }
  }, [invoice, patientId, patients]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
        ...values,
        treatmentIds: selectedTreatments.map(t => t.id),
        issueDate: format(values.issueDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    }, selectedTreatments);
  }

  const handleTreatmentToggle = (treatment: Treatment) => {
    setSelectedTreatments(prev => 
        prev.some(t => t.id === treatment.id)
            ? prev.filter(t => t.id !== treatment.id)
            : [...prev, treatment]
    );
  }

  const handleTreatmentSelect = (treatmentId: string) => {
    const treatment = availableTreatments.find(t => t.id === treatmentId);
    if (treatment) {
        handleTreatmentToggle(treatment);
    }
  }

  const totalAmount = useMemo(() => {
    return selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
  }, [selectedTreatments]);

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogDescription>
                   {invoice ? 'Update the details for the invoice.' : 'Fill out the details for the new invoice.'}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    
                    {patientId && (
                        <FormItem>
                            <FormLabel>Treatments to Include</FormLabel>
                            <div className="rounded-md border">
                                <Command>
                                    <CommandInput placeholder="Search treatments..." />
                                    <CommandList>
                                        <CommandEmpty>No treatments found for this patient.</CommandEmpty>
                                        <CommandGroup>
                                            {availableTreatments.map(treatment => (
                                                <CommandItem
                                                    key={treatment.id}
                                                    value={treatment.id}
                                                    onSelect={handleTreatmentSelect}
                                                    className="flex justify-between items-center cursor-pointer"
                                                >
                                                   <div>
                                                        <span>{treatment.procedure} {treatment.tooth ? `(#${treatment.tooth})` : ''}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">{treatment.date}</span>
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                        <span className="font-mono">${treatment.cost.toFixed(2)}</span>
                                                        {selectedTreatments.some(t => t.id === treatment.id) && <Check className="h-4 w-4 text-primary" />}
                                                   </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
                        </FormItem>
                    )}

                    {selectedTreatments.length > 0 && (
                        <div>
                             <p className="text-sm font-medium mb-2">Selected Treatments</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedTreatments.map(treatment => (
                                    <Badge key={treatment.id} variant="secondary" className="flex items-center gap-1">
                                        {treatment.procedure}
                                        <button type="button" onClick={() => handleTreatmentToggle(treatment)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>Total Amount</FormLabel>
                            <Input disabled value={`$${totalAmount.toFixed(2)}`} />
                        </FormItem>
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
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={selectedTreatments.length === 0}>{invoice ? 'Save Changes' : 'Create Invoice'}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

    
