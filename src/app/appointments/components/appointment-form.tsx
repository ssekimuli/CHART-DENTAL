
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parse } from "date-fns";

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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Appointment, Patient } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";


const formSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient."}),
  treatment: z.string().min(2, "Treatment must be at least 2 characters."),
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s(AM|PM)$/, "Please use HH:MM AM/PM format."),
});

type AppointmentFormProps = {
    appointment?: Appointment;
    patients: Patient[];
    onSave: (data: Omit<Appointment, 'id' | 'branchId'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function AppointmentForm({ appointment, patients, onSave, onOpenChange }: AppointmentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: appointment?.patientId ?? "",
        treatment: appointment?.treatment ?? "",
        date: appointment ? parse(appointment.date, "yyyy-MM-dd", new Date()) : new Date(),
        time: appointment?.time ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const patient = patients.find(p => p.id === values.patientId);
    if (!patient) return;

    onSave({
        ...values,
        patientName: patient.name,
        status: appointment?.status ?? 'Scheduled',
        date: format(values.date, "yyyy-MM-dd"),
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{appointment ? 'Edit Appointment' : 'Create Appointment'}</DialogTitle>
                <DialogDescription>
                    Fill out the details for the appointment.
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
                        name="treatment"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Treatment</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Routine Check-up" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
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
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 10:30 AM" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Appointment</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
