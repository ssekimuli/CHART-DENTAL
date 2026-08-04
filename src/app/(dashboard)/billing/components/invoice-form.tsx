

"use client";
import { useToast } from "@/hooks/use-toast";

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
    asModal?: boolean;
};

export function InvoiceForm({ invoice, patients, onSave, onOpenChange, asModal = true }: InvoiceFormProps) {
  const { toast } = useToast();
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
        await onSave({
        ...values,
        patientId: values.patientId || '',
        otherCharges: values.otherCharges || [],
        treatments: selectedTreatments,
        medicines: selectedMedicines,
        issueDate: format(values.issueDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    }, selectedTreatments);
      } catch (error: any) {
        console.error(error);
        toast({
            title: "Error",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
        });
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
    return otherCharges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
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

  const formContent = (
    <div className={asModal ? "flex-grow overflow-y-auto pr-6 -mr-6 custom-scrollbar" : ""}>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={asModal ? "space-y-6 pr-1" : "space-y-8"}>
                
                {/* Patient Information Section */}
                <div className="space-y-4 rounded-xl border bg-card text-card-foreground shadow-sm p-5 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <h3 className="font-semibold text-lg tracking-tight">Patient Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-sm font-medium">Select Patient</FormLabel>
                                    <FormControl>
                                        <Combobox
                                            options={patients.map(p => ({ value: String(p.id), label: p.first_name + ' ' + p.last_name }))}
                                            value={field.value}
                                            onChange={(value) => field.onChange(value)}
                                            placeholder="Select a patient..."
                                            searchPlaceholder="Search patients..."
                                            emptyMessage="No patient found."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm font-medium">Issue Date</FormLabel>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <FormControl>
                                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                                        <FormLabel className="text-sm font-medium">Due Date</FormLabel>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <FormControl>
                                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                          </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Treatments & Procedures Section */}
                <div className="space-y-4 rounded-xl border bg-card text-card-foreground shadow-sm p-5 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <h3 className="font-semibold text-lg tracking-tight">Clinical Items</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 pt-2">
                        {/* Treatments */}
                        <div className="space-y-4">
                            <FormItem>
                                <FormLabel className="text-sm font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
                                    Add Treatments
                                </FormLabel>
                                
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal bg-background/50 h-10">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                                Search and select treatments...
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command className="bg-transparent">

                                            <CommandInput placeholder="Search procedures to add..." className="border-none focus:ring-0" />
                                            <CommandList className="max-h-40 overflow-y-auto custom-scrollbar">
                                                <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">No treatments found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableTreatments.map(treatment => (
                                                        <CommandItem
                                                            key={treatment.id}
                                                            value={treatment.procedure}
                                                            onSelect={() => handleTreatmentSelect(treatment.id)}
                                                            className="flex justify-between items-center cursor-pointer py-2 px-3 hover:bg-muted/50 transition-colors"
                                                        >
                                                        <div>
                                                                <span className="font-medium">{treatment.procedure}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                                <span className="font-mono text-muted-foreground">{formatCurrency(treatment.cost)}</span>
                                                                {selectedTreatments.some(t => Number(t.procedureId) === Number(treatment.id)) && <Check className="h-4 w-4 text-primary" />}
                                                        </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                            </FormItem>

                            {selectedTreatments.length > 0 && (
                                <div className="rounded-lg border bg-background/40 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-medium text-xs uppercase tracking-wider">Procedure</TableHead>
                                                <TableHead className="text-right font-medium text-xs uppercase tracking-wider">Cost</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {selectedTreatments.map((treatment) => (
                                            <TableRow key={String(treatment.procedureId)} className="group">
                                                <TableCell className="font-medium">{treatment.procedure} {treatment.tooth ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2">Tooth #{treatment.tooth}</span> : ''}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(treatment.cost)}</TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleTreatmentToggle(treatment)} title="Remove treatment">
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        {/* Medicines */}
                        <div className="space-y-4">
                            <FormItem>
                                <FormLabel className="text-sm font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M10.5 20.5 7 24l-3-3 3.5-3.5"/><path d="m20.5 10.5-3.5 3.5-7-7 3.5-3.5 7 7Z"/><path d="m10 10 4 4"/></svg>
                                    Add Medicines
                                </FormLabel>
                                
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal bg-background/50 h-10">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                                Search and select medicines...
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command className="bg-transparent">

                                            <CommandInput placeholder="Search medicines to add..." className="border-none focus:ring-0" />
                                            <CommandList className="max-h-40 overflow-y-auto custom-scrollbar">
                                                <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">No medicines found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableMedicines.map(med => (
                                                        <CommandItem
                                                            key={med.id}
                                                            value={med.name}
                                                            onSelect={() => handleMedicineSelect(med.id)}
                                                            className="flex justify-between items-center cursor-pointer py-2 px-3 hover:bg-muted/50 transition-colors"
                                                        >
                                                        <div>
                                                                <span className="font-medium">{med.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                                {selectedMedicines.some(m => m.medicine_id === med.id) && <Check className="h-4 w-4 text-primary" />}
                                                        </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                            </FormItem>

                            {selectedMedicines.length > 0 && (
                                <div className="rounded-lg border bg-background/40 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-medium text-xs uppercase tracking-wider">Medicine</TableHead>
                                                <TableHead className="font-medium text-xs uppercase tracking-wider">Unit</TableHead>
                                                <TableHead className="font-medium text-xs uppercase tracking-wider">Qty</TableHead>
                                                <TableHead className="text-right font-medium text-xs uppercase tracking-wider">Price</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {selectedMedicines.map((medItem, index) => {
                                            const med = availableMedicines.find(m => m.id === medItem.medicine_id) || medItem.medicine;
                                            return (
                                            <TableRow key={medItem.id} className="group">
                                                <TableCell className="font-medium">{med?.name}</TableCell>
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
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {med?.units?.map(u => (
                                                                <SelectItem key={u.id} value={String(u.id)} className="text-xs">{u.unit_name}</SelectItem>
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
                                                    }} className="w-16 h-8 text-xs font-mono" />
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(medItem.price * medItem.quantity)}</TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                                        setSelectedMedicines(prev => prev.filter((_, i) => i !== index));
                                                    }} title="Remove medicine">
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Charges Section */}
                <div className="space-y-4 rounded-xl border bg-card text-card-foreground shadow-sm p-5 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <h3 className="font-semibold text-lg tracking-tight">Other Charges & Taxes</h3>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ description: "", amount: 0 })}
                            className="h-8 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/20"
                        >
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                            Add Charge
                        </Button>
                    </div>
                    
                    <div className="pt-2 space-y-4">
                        {fields.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                No additional charges added
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-3 p-3 bg-muted/20 rounded-lg border group transition-colors hover:bg-muted/40">
                                        <FormField
                                            control={form.control}
                                            name={`otherCharges.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow space-y-1">
                                                    <FormLabel className="text-xs text-muted-foreground">Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="E.g., Consultation Fee" className="h-9 bg-background" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`otherCharges.${index}.amount`}
                                            render={({ field }) => (
                                                <FormItem className="w-32 space-y-1">
                                                    <FormLabel className="text-xs text-muted-foreground">Amount</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" className="h-9 bg-background font-mono" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs text-muted-foreground">Discount (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" max="100" className="h-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tax"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs text-muted-foreground">Tax (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" max="100" className="h-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insuranceCoverage"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs text-muted-foreground">Insurance Coverage</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" className="h-9 font-mono" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Totals Summary Section */}
                <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 text-card-foreground shadow-sm overflow-hidden">
                    <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg> Treatments Subtotal</span>
                            <span className="font-mono font-medium">{formatCurrency(subTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 7 24l-3-3 3.5-3.5"/><path d="m20.5 10.5-3.5 3.5-7-7 3.5-3.5 7 7Z"/><path d="m10 10 4 4"/></svg> Medicines Subtotal</span>
                            <span className="font-mono font-medium">{formatCurrency(medicinesTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Other Charges Subtotal</span>
                            <span className="font-mono font-medium">{formatCurrency(otherChargesTotal)}</span>
                        </div>
                        
                        {(watchDiscount > 0 || watchTax > 0) && (
                            <div className="pt-3 pb-1 border-t border-dashed space-y-2">
                                {watchDiscount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                                        <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> Discount ({watchDiscount}%)</span>
                                        <span className="font-mono">-{formatCurrency((subTotal + otherChargesTotal + medicinesTotal) * (watchDiscount / 100))}</span>
                                    </div>
                                )}
                                {watchTax > 0 && (
                                    <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                                        <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16.01" y1="10" y2="10"/><line x1="12" x2="12.01" y1="10" y2="10"/><line x1="8" x2="8.01" y1="10" y2="10"/><line x1="16" x2="16.01" y1="14" y2="14"/><line x1="12" x2="12.01" y1="14" y2="14"/><line x1="8" x2="8.01" y1="14" y2="14"/><line x1="16" x2="16.01" y1="18" y2="18"/><line x1="12" x2="12.01" y1="18" y2="18"/><line x1="8" x2="8.01" y1="18" y2="18"/></svg> Tax ({watchTax}%)</span>
                                        <span className="font-mono">+{formatCurrency(((subTotal + otherChargesTotal + medicinesTotal) - ((subTotal + otherChargesTotal + medicinesTotal) * (watchDiscount / 100))) * (watchTax / 100))}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="pt-3 border-t flex justify-between items-center">
                            <span className="font-medium text-muted-foreground">Total Amount</span>
                            <span className="font-mono font-semibold text-xl tracking-tight">{formatCurrency(totalAmount)}</span>
                        </div>
                        
                        {(watchInsurance > 0 || (invoice && invoice.paidAmount > 0)) && (
                            <div className="pt-3 pb-1 border-t border-dashed space-y-2">
                                {watchInsurance > 0 && (
                                    <div className="flex justify-between items-center text-sm text-blue-600 dark:text-blue-400">
                                        <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Insurance Coverage</span>
                                        <span className="font-mono">-{formatCurrency(watchInsurance)}</span>
                                    </div>
                                )}
                                {invoice && invoice.paidAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Already Paid</span>
                                        <span className="font-mono">-{formatCurrency(invoice.paidAmount)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-primary/5 dark:bg-primary/10 p-5 border-t flex justify-between items-center">
                        <span className="font-semibold text-lg text-primary">Balance Due</span>
                        <span className="font-mono font-bold text-3xl text-primary tracking-tight">{formatCurrency(balance)}</span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={cn("flex justify-end gap-3 pt-4", asModal ? "sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-6 px-6 pb-6 border-t z-10" : "")}>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-24">Cancel</Button>
                    <Button type="submit" disabled={selectedTreatments.length === 0 && otherChargesTotal <= 0 && !invoice || isSubmitting} className="min-w-[140px] shadow-md">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        {invoice ? 'Save Changes' : 'Create Invoice'}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
  if (!asModal) {
      return formContent;
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogDescriptionComponent>
                   {invoice ? 'Update the details for the invoice.' : 'Select a patient and add treatments to the invoice.'}
                </DialogDescriptionComponent>
            </DialogHeader>
            {formContent}
        </DialogContent>
    </Dialog>
  );
}
