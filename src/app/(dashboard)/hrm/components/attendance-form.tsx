"use client";

import { useState } from "react";
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
import type { AttendanceRecord, AttendanceStatus, Employee } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";


const formSchema = z.object({
  employeeId: z.string({ required_error: "Please select an employee."}),
  date: z.date({ required_error: "A date is required." }),
  status: z.enum(['Present', 'Absent', 'On Leave']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});

type AttendanceFormProps = {
    employees: Employee[];
    onSave: (data: Omit<AttendanceRecord, 'id' | 'employeeName'>) => void;
    onOpenChange: (open: boolean) => void;
    selectedDate?: Date;
};

export function AttendanceForm({ employees, onSave, onOpenChange, selectedDate }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        date: selectedDate ?? new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    const employee = employees.find(e => e.id === values.employeeId);
    if (!employee) return;
    
    onSave({
        employeeId: values.employeeId,
        date: format(values.date, "yyyy-MM-dd"),
        status: values.status,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        branchId: employee.branchId,
    });
      } finally {
      setIsSubmitting(false);
    }
  }

  const statuses: AttendanceStatus[] = ['Present', 'Absent', 'On Leave'];
  const status = form.watch('status');

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
                <DialogDescription>
                    Fill out the details to mark an employee's attendance.
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
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
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
                                    {statuses.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    {status === 'Present' && (
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="checkIn"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Check-in Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="checkOut"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Check-out Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}


                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Attendance
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
