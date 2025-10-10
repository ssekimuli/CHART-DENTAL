
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parse } from "date-fns";
import { useMemo } from "react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Appointment, Employee, Patient, AppointmentStatus } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";


const formSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient."}),
  doctorId: z.string({ required_error: "Please select a doctor."}),
  treatment: z.string().min(2, "Treatment must be at least 2 characters."),
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Please use HH:MM AM/PM format."),
  status: z.enum(["Scheduled", "Completed", "Cancelled", "Waiting", "In Session", "On Hold"]),
  tokenNumber: z.string(),
});

type AppointmentFormProps = {
    appointment?: Appointment;
    patients: Patient[];
    doctors: Employee[];
    appointments: Appointment[];
    onSave: (data: Omit<Appointment, 'id' | 'branchId'>) => void;
    onOpenChange: (open: boolean) => void;
};

// Generate time slots from 9 AM to 5 PM in 30-minute intervals
const generateTimeSlots = () => {
    const slots = [];
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0); // 9:00 AM
    const endTime = new Date();
    endTime.setHours(17, 0, 0, 0); // 5:00 PM

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
        slots.push(format(currentTime, "hh:mm a"));
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
};

const allTimeSlots = generateTimeSlots();

const generateToken = (patientName: string, doctorName: string) => {
    const patientInitials = patientName.split(' ').map(n => n[0]).join('');
    const doctorInitials = doctorName.split(' ').map(n => n[0]).join('');
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `${patientInitials}${doctorInitials}${randomNumber}`;
}

export function AppointmentForm({ appointment, patients, doctors, appointments, onSave, onOpenChange }: AppointmentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: appointment?.patientId ?? "",
        doctorId: appointment?.doctorId ?? "",
        treatment: appointment?.treatment ?? "",
        date: appointment ? parse(appointment.date, "yyyy-MM-dd", new Date()) : new Date(),
        time: appointment?.time ?? "",
        status: appointment?.status ?? 'Scheduled',
        tokenNumber: appointment?.tokenNumber,
    },
  });

  const selectedDoctorId = form.watch("doctorId");
  const selectedPatientId = form.watch("patientId");
  const selectedDate = form.watch("date");

  const availableSlots = useMemo(() => {
    if (!selectedDoctorId || !selectedDate) {
      return allTimeSlots;
    }

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const bookedTimes = appointments
      .filter(a => a.doctorId === selectedDoctorId && a.date === formattedDate && a.id !== appointment?.id)
      .map(a => a.time);
      
    return allTimeSlots.filter(slot => !bookedTimes.includes(slot));
  }, [selectedDoctorId, selectedDate, appointments, appointment]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const patient = patients.find(p => p.id === values.patientId);
    if (!patient) return;
    const doctor = doctors.find(d => d.id === values.doctorId);
    if (!doctor) return;


    onSave({
        ...values,
        patientName: patient.name,
        doctorName: doctor.name,
        date: format(values.date, "yyyy-MM-dd"),
        tokenNumber: values.tokenNumber || generateToken(patient.name, doctor.name),
    });
  }

  const appointmentStatuses: AppointmentStatus[] = ["Scheduled", "Waiting", "In Session", "On Hold", "Completed", "Cancelled"];

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{appointment ? 'Edit Appointment' : 'Create Appointment'}</DialogTitle>
                <DialogDescription>
                    Fill out the details for the appointment.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6">
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
                        name="doctorId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Doctor</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={doctors.map(d => ({ value: d.id, label: d.name }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a doctor"
                                    searchPlaceholder="Search doctors..."
                                    emptyMessage="No doctor found."
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

                    {selectedDoctorId && selectedDate && (
                        <div>
                            <FormLabel>Available Slots</FormLabel>
                            <div className="mt-2 grid grid-cols-4 gap-2">
                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                    <Button
                                        type="button"
                                        key={slot}
                                        variant="outline"
                                        size="sm"
                                        className={cn("text-xs", form.getValues("time") === slot && "bg-primary text-primary-foreground")}
                                        onClick={() => form.setValue("time", slot, { shouldValidate: true })}
                                    >
                                        {slot}
                                    </Button>
                                )) : (
                                    <div className="col-span-4 text-center text-sm text-muted-foreground p-4 border rounded-md">
                                        No available slots for this doctor on the selected date.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value as AppointmentStatus)} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {appointmentStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tokenNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Token Number</FormLabel>
                                <FormControl>
                                    <Input disabled {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>


                     <DialogFooter className="sticky bottom-0 bg-background pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Appointment</Button>
                    </DialogFooter>
                </form>
            </Form>
            </div>
        </DialogContent>
    </Dialog>
  );
}
