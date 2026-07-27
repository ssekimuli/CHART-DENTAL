
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, parse } from "date-fns";
import { useState } from "react";

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
import type { Patient, BasePatient } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format").min(10, "Required"),
  nextVisit: z.date().optional().nullable(),
  status: z.enum(['Active', 'Inactive']),
  history: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

type PatientFormProps = {
    patient?: Patient;
    onSave: (data: BasePatient) => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
    asModal?: boolean;
};

export function PatientForm({ patient, onSave, onOpenChange, asModal = true }: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        first_name: patient?.first_name ?? "",
        last_name: patient?.last_name ?? "",
        email: patient?.email ?? "",
        phone: patient?.phone ?? "",
        address: patient?.address ?? "",
        gender: patient?.gender,
        dateOfBirth: patient?.dateOfBirth ? format(parseISO(patient.dateOfBirth), "dd-MM-yyyy") : "",
        nextVisit: patient?.nextVisit ? parseISO(patient.nextVisit) : undefined,
        status: patient?.status ?? 'Active',
        history: patient?.history ?? "",
        avatar: patient?.avatar ?? "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await onSave({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            address: values.address,
            gender: values.gender,
            status: values.status,
            dateOfBirth: format(parse(values.dateOfBirth, "dd-MM-yyyy", new Date()), "yyyy-MM-dd"),
            nextVisit: values.nextVisit ? format(values.nextVisit, "yyyy-MM-dd") : undefined,
            history: values.history,
            branchId: patient?.branchId ?? "",
            avatar: values.avatar || `https://picsum.photos/seed/p${Math.random()}/200/200`,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const formContent = (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., John" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input placeholder="DD-MM-YYYY" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., +256700123456" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., john.doe@example.com" {...field} />
                                </FormControl>
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
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nextVisit"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Next Visit Target Date</FormLabel>
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
                                        selected={field.value || undefined}
                                        onSelect={field.onChange}
                                        captionLayout="dropdown-buttons"
                                        fromYear={new Date().getFullYear()}
                                        toYear={new Date().getFullYear() + 5}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-3">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Kampala, Uganda" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <FormField
                        control={form.control}
                        name="history"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Medical/Dental History</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Enter patient history..."
                                className="resize-none"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {patient ? "Save Changes" : "Create Patient"}
                        </Button>
                    </div>
                </form>
            </Form>
  );

  if (!asModal) {
      return formContent;
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
                <DialogTitle>{patient ? "Edit Patient" : "Add Patient"}</DialogTitle>
                <DialogDescription>
                    Fill out the details for the patient.
                </DialogDescription>
            </DialogHeader>
            {formContent}
        </DialogContent>
    </Dialog>
  );
}
