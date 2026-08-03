"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { StaffAdvance, Employee } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


const formSchema = z.object({
  employeeId: z.string({ required_error: "Please select an employee."}),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  reason: z.string().min(1, "A reason is required."),
});

type AdvanceFormProps = {
    employees: Employee[];
    onSave: (data: Omit<StaffAdvance, 'id' | 'employeeName' | 'status'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function AdvanceForm({ employees, onSave, onOpenChange }: AdvanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    const employee = employees.find(e => e.id === values.employeeId);
    if (!employee) return;
    
    onSave({
        ...values,
        branchId: employee.branchId,
        date: format(new Date(), "yyyy-MM-dd"),
    });
      } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>New Staff Advance</DialogTitle>
                <DialogDescription>
                    Fill out the details for the salary advance request.
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
                                    options={employees.map(e => ({ value: e.id, label: e.name }))}
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
                    
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 500" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Enter reason for advance..."
                                className="resize-none"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />


                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Request
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
