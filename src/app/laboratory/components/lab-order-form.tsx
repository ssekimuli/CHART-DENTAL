
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

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
import type { LaboratoryOrder, Patient } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";


const formSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient."}),
  lab: z.string().min(2, "Lab name must be at least 2 characters."),
  item: z.string().min(2, "Item description must be at least 2 characters."),
  tooth: z.coerce.number().optional(),
  status: z.enum(['Sent', 'Received', 'Completed', 'Cancelled']),
  sentDate: z.date({ required_error: "A sent date is required." }),
  dueDate: z.date({ required_error: "A due date is required." }),
});

type LabOrderFormProps = {
    patients: Patient[];
    onSave: (data: Omit<LaboratoryOrder, 'id' | 'patientName' | 'branchId'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function LabOrderForm({ patients, onSave, onOpenChange }: LabOrderFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        sentDate: new Date(),
        status: 'Sent',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
        ...values,
        sentDate: format(values.sentDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
                <DialogTitle>Create Lab Order</DialogTitle>
                <DialogDescription>
                    Fill out the details for the new lab order.
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
                                    onChange={field.onChange}
                                    placeholder="Select a patient"
                                    searchPlaceholder="Search patients..."
                                    emptyMessage="No patient found."
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="lab"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Laboratory</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Precision Dental Labs" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="item"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                <FormLabel>Item</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Zirconia Crown" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tooth"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tooth #</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Optional" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
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
                                        <SelectItem value="Sent">Sent</SelectItem>
                                        <SelectItem value="Received">Received</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sentDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Sent Date</FormLabel>
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
                        <Button type="submit">Save Order</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
