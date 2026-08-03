"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, subDays } from "date-fns";

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
import type { Payroll, Employee } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";


const formSchema = z.object({
  employeeId: z.string({ required_error: "Please select an employee."}),
  grossPay: z.coerce.number().positive("Gross pay must be a positive number."),
  deductions: z.coerce.number().min(0, "Deductions cannot be negative."),
  payDate: z.date({ required_error: "A pay date is required." }),
});

type PayrollFormProps = {
    payroll?: Payroll;
    employees: Employee[];
    onSave: (data: Omit<Payroll, 'id' | 'employeeName' | 'branchId'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function PayrollForm({ payroll, employees, onSave, onOpenChange }: PayrollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        employeeId: payroll?.employeeId ? String(payroll.employeeId) : undefined,
        grossPay: payroll?.grossPay,
        deductions: payroll?.deductions,
        payDate: payroll ? parseISO(payroll.payDate) : new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    const payDate = values.payDate;
    const periodStart = subDays(payDate, 14);
    
    onSave({
        employeeId: values.employeeId,
        grossPay: values.grossPay,
        deductions: values.deductions,
        netPay: values.grossPay - values.deductions,
        payDate: format(payDate, "yyyy-MM-dd"),
        payPeriod: payroll?.payPeriod || `${format(periodStart, "yyyy-MM-dd")} to ${format(payDate, "yyyy-MM-dd")}`,
        status: payroll?.status || 'Pending',
    });
      } finally {
      setIsSubmitting(false);
    }
  }

  const isEditing = !!payroll;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Payroll Record" : "Run Payroll"}</DialogTitle>
                <DialogDescription>
                    {isEditing ? `Update payroll for ${payroll.employeeName}.` : "Fill out the details to process payroll for an employee."}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Employee</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={employees.map(e => ({ value: e.id.toString(), label: e.name }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select an employee"
                                    searchPlaceholder="Search employees..."
                                    emptyMessage="No employee found."
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="grossPay"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gross Pay</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 2500.00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="deductions"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Deductions</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 500.00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="payDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Pay Date</FormLabel>
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

                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Save Changes" : "Process Payroll"}
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
