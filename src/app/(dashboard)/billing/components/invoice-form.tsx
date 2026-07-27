

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
import type { Invoice, Patient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, Treatment, Medicine, InvoiceMedicine } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, X, Check, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTreatments, getPatientById, getMedicines } from "@/lib/api";
import { useCurrency } from "@/hooks/use-currency";


const formSchema = z.object({
  patientId: z.string().optional(),
  issueDate: z.date({
    required_error: "An issue date is required.",
  }),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  status: z.enum(['Paid', 'Pending', 'Overdue']),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer', 'Refund']).optional(),
  otherCharges: z.array(z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0, "Amount must be zero or more."),
  })).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  tax: z.coerce.number().min(0).max(100).optional(),
  insuranceCoverage: z.coerce.number().min(0).optional(),
});

type InvoiceFormProps = {
    invoice?: Invoice;
    patients: Patient[];
    onSave: (data: Omit<Invoice, 'id' | 'patientName' | 'branchId' | 'amount' | 'paidAmount' >, treatments: InvoiceTreatment[]) => void;
    onOpenChange: (open: boolean) => void;
};

export function InvoiceForm({ invoice, patients, onSave, onOpenChange }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedTreatments, setSelectedTreatments] = useState<InvoiceTreatment[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<SystemTreatment[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<InvoiceMedicine[]>([]);
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const { formatCurrency } = useCurrency();
  
  useEffect(() => {
    const fetchData = async () => {
        const tData = await getTreatments();
        setAvailableTreatments(tData);
        
        const mData = await getMedicines();
        setAvailableMedicines(mData);
    }
    fetchData();
  }, [])
  
  const parseDateSafe = (value?: string | Date) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        return parseISO(value);
      } catch {
        return new Date();
      }
    }
    return new Date();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: invoice?.patientId != null ? String(invoice.patientId) : "",
        issueDate: invoice ? parseDateSafe(invoice.issueDate) : new Date(),
        dueDate: invoice ? parseDateSafe(invoice.dueDate) : new Date(),
        status: invoice?.status ?? 'Pending',
        paymentMethod: invoice?.paymentMethod,
        otherCharges: invoice?.otherCharges ?? [],
        discount: invoice?.discount ?? 0,
        tax: invoice?.tax ?? 0,
        insuranceCoverage: invoice?.insuranceCoverage ?? 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "otherCharges",
  });

  const patientId = form.watch('patientId');
  const otherCharges = form.watch('otherCharges') || [];
  const watchDiscount = form.watch('discount') || 0;
  const watchTax = form.watch('tax') || 0;
  const watchInsurance = form.watch('insuranceCoverage') || 0;
  
  useEffect(() => {
    if (invoice) {
        setSelectedTreatments(invoice.treatments.map(t => ({
          procedureId: t.procedureId ?? Math.random(),
          procedure: t.procedure,
          cost: Number(t.cost) || 0,
          tooth: t.tooth,
        })));
        
        setSelectedMedicines(invoice.medicines || []);
    } else if (patientId) {
        // When creating a new invoice for a patient, auto-select their unbilled treatments.
        const fetchPatientTreatments = async () => {
            const patientData = await getPatientById(patientId);
            if (patientData) {
                const unbilled = patientData.treatmentPlans
                    .filter(t => t.status === 'Completed' && !t.invoiceId)
                    .map(t => ({ procedureId: t.procedureId, procedure: t.procedure, cost: Number(t.cost) || 0, tooth: t.tooth }));
                setSelectedTreatments(unbilled);
            }
        };
        fetchPatientTreatments();
        setSelectedMedicines([]);
    } else {
        setSelectedTreatments([]);
        setSelectedMedicines([]);
    }
  }, [invoice, patientId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    onSave({
        ...values,
        patientId: values.patientId || '',
        otherCharges: values.otherCharges || [],
        treatments: selectedTreatments,
        medicines: selectedMedicines,
        issueDate: format(values.issueDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    }, selectedTreatments);
      } finally {
      setIsSubmitting(false);
    }
  }

  const handleTreatmentToggle = (treatment: InvoiceTreatment) => {
    setSelectedTreatments(prev => 
        prev.some(t => Number(t.procedureId) === Number(treatment.procedureId))
            ? prev.filter(t => Number(t.procedureId) !== Number(treatment.procedureId))
            : [...prev, treatment]
    );
  }
  
  // This function is for the CommandItem onSelect
  const handleTreatmentSelect = (procedureId: string | number) => {
    const treatment = availableTreatments.find(t => Number(t.id) === Number(procedureId));
    if (treatment) {
        handleTreatmentToggle({ procedureId: Number(treatment.id), procedure: treatment.procedure, cost: treatment.cost });
    }
  }

  const handleMedicineSelect = (medicineId: number) => {
    const med = availableMedicines.find(m => m.id === medicineId);
    if (!med || !med.units || med.units.length === 0) return;
    
    setSelectedMedicines(prev => {
        if (prev.some(m => m.medicine_id === medicineId)) {
            return prev.filter(m => m.medicine_id !== medicineId);
        }
        const defaultUnit = med.units[0];
        return [...prev, {
            id: Math.random(), // temp id
            invoice_id: 0,
            medicine_id: med.id,
            medicine_unit_id: defaultUnit.id,
            quantity: 1,
            price: defaultUnit.price,
            medicine: med,
            unit: defaultUnit,
        }];
    });
  };

  const subTotal = useMemo(() => {
    return selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
  }, [selectedTreatments]);

  const otherChargesTotal = useMemo(() => {
    return otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  }, [otherCharges]);

  const medicinesTotal = useMemo(() => {
    return selectedMedicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
  }, [selectedMedicines]);

  const totalAmount = useMemo(() => {
    const sub = subTotal + otherChargesTotal + medicinesTotal;
    const afterDiscount = sub - (sub * (watchDiscount / 100));
    const finalAmount = afterDiscount + (afterDiscount * (watchTax / 100));
    return finalAmount;
  }, [subTotal, otherChargesTotal, medicinesTotal, watchDiscount, watchTax]);

  const balance = useMemo(() => {
     let b = totalAmount;
     if (invoice) {
        b = totalAmount - invoice.paidAmount;
     }
     b = b - watchInsurance;
     return Math.max(b, 0);
  }, [totalAmount, invoice, watchInsurance]);

  const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Insurance', 'Bank Transfer', 'Refund'];

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
                                        options={patients.map(p => ({ value: String(p.id), label: p.first_name + ' ' + p.last_name }))}
                                        value={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
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
                            <FormLabel>Treatments</FormLabel>
                            <FormControl>
                                <div className="rounded-md border h-48 overflow-y-auto">
                                    <Command>
                                        <CommandInput placeholder="Search treatments to add..." />
                                        <CommandList>
                                            <CommandEmpty>No treatments found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableTreatments.map(treatment => (
                                                    <CommandItem
                                                        key={treatment.id}
                                                        value={treatment.procedure}
                                                        onSelect={() => handleTreatmentSelect(treatment.id)}
                                                        className="flex justify-between items-center cursor-pointer"
                                                    >
                                                    <div>
                                                            <span>{treatment.procedure}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                            <span className="font-mono">{formatCurrency(treatment.cost)}</span>
                                                            {selectedTreatments.some(t => Number(t.procedureId) === Number(treatment.id)) && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </div>
                            </FormControl>
                            <FormDescription>
                               Search and select treatments to add to the invoice. Completed, unbilled treatments for the selected patient are added automatically.
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
                                    {selectedTreatments.map((treatment) => (
                                        <TableRow key={String(treatment.procedureId)}>
                                            <TableCell>{treatment.procedure} {treatment.tooth ? `(#${treatment.tooth})` : ''}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(treatment.cost)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTreatmentToggle(treatment)} title="Remove treatment">
                                                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </div>
                        )}
                        
                        <FormItem>
                            <FormLabel>Prescribed Medicines</FormLabel>
                            <FormControl>
                                <div className="rounded-md border h-48 overflow-y-auto">
                                    <Command>
                                        <CommandInput placeholder="Search medicines to add..." />
                                        <CommandList>
                                            <CommandEmpty>No medicines found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableMedicines.map(med => (
                                                    <CommandItem
                                                        key={med.id}
                                                        value={med.name}
                                                        onSelect={() => handleMedicineSelect(med.id)}
                                                        className="flex justify-between items-center cursor-pointer"
                                                    >
                                                    <div>
                                                            <span>{med.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                            {selectedMedicines.some(m => m.medicine_id === med.id) && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </div>
                            </FormControl>
                            <FormDescription>
                               Search and select medicines to add to the invoice.
                            </FormDescription>
                        </FormItem>

                        {selectedMedicines.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Selected Medicines for Invoice</p>
                                <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {selectedMedicines.map((medItem, index) => {
                                        const med = availableMedicines.find(m => m.id === medItem.medicine_id) || medItem.medicine;
                                        return (
                                        <TableRow key={medItem.id}>
                                            <TableCell>{med?.name}</TableCell>
                                            <TableCell>
                                                <Select value={String(medItem.medicine_unit_id)} onValueChange={(val) => {
                                                    const unitId = Number(val);
                                                    const unit = med?.units.find(u => u.id === unitId);
                                                    setSelectedMedicines(prev => {
                                                        const next = [...prev];
                                                        next[index].medicine_unit_id = unitId;
                                                        if (unit) next[index].price = unit.price;
                                                        return next;
                                                    });
                                                }}>
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {med?.units?.map(u => (
                                                            <SelectItem key={u.id} value={String(u.id)}>{u.unit_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" min="1" value={medItem.quantity} onChange={(e) => {
                                                    const qty = Number(e.target.value) || 1;
                                                    setSelectedMedicines(prev => {
                                                        const next = [...prev];
                                                        next[index].quantity = qty;
                                                        return next;
                                                    });
                                                }} className="w-20" />
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(medItem.price * medItem.quantity)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                    setSelectedMedicines(prev => prev.filter((_, i) => i !== index));
                                                }} title="Remove medicine">
                                                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )})}
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
                        
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insuranceCoverage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Coverage (Amount)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                 <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal (Other Charges)</span>
                                <span>{formatCurrency(otherChargesTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal (Medicines)</span>
                                <span>{formatCurrency(medicinesTotal)}</span>
                            </div>
                            {watchDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({watchDiscount}%)</span>
                                    <span>-{formatCurrency((subTotal + otherChargesTotal + medicinesTotal) * (watchDiscount / 100))}</span>
                                </div>
                            )}
                            {watchTax > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Tax ({watchTax}%)</span>
                                    <span>+{formatCurrency(((subTotal + otherChargesTotal + medicinesTotal) - ((subTotal + otherChargesTotal + medicinesTotal) * (watchDiscount / 100))) * (watchTax / 100))}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                                <span>Total Amount</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                            {watchInsurance > 0 && (
                                <div className="flex justify-between text-sm text-blue-600">
                                    <span>Insurance Coverage</span>
                                    <span>-{formatCurrency(watchInsurance)}</span>
                                </div>
                            )}
                            {invoice && invoice.paidAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Already Paid</span>
                                    <span>-{formatCurrency(invoice.paidAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-xl border-t pt-2 mt-2">
                                <span>Balance Due</span>
                                <span>{formatCurrency(balance)}</span>
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
                            <Button type="submit"  disabled={selectedTreatments.length === 0 && otherChargesTotal <= 0 && !invoice || isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {invoice ? 'Save Changes' : 'Create Invoice'}
      </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </div>
        </DialogContent>
    </Dialog>
  );
}
