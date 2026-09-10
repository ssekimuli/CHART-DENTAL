
"use client";
import { useToast } from "@/hooks/use-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, parse, subYears } from "date-fns";
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

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import * as countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);
const countryObj = countries.getNames("en", { select: "official" });
const countryList = Object.entries(countryObj).map(([code, name]) => ({
  value: name,
  label: name,
})).sort((a, b) => a.label.localeCompare(b.label));

const formSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  phone: z.string().min(1, "Phone is required").regex(/^\+/, "Must start with country code (+)"),
  nationality: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().min(1, "Date of birth or age is required"),
  lastVisit: z.date().optional().nullable(),
  nextVisit: z.date().optional().nullable(),
  status: z.enum(['Active', 'Inactive']),
  history: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  useAge: z.boolean().default(false),
});

type PatientFormProps = {
    patient?: Patient;
    onSave: (data: BasePatient) => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
    asModal?: boolean;
};

export function PatientForm({ patient, onSave, onOpenChange, asModal = true }: PatientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAge, setUseAge] = useState(false);

  const calculateDateOfBirth = (age: number): string => {
    const today = new Date();
    const dateOfBirth = subYears(today, age);
    return format(dateOfBirth, "yyyy-MM-dd");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        first_name: patient?.first_name ?? "",
        last_name: patient?.last_name ?? "",
        email: patient?.email ?? "",
        phone: patient?.phone ?? "",
        nationality: patient?.nationality ?? "",
        address: patient?.address ?? "",
        gender: patient?.gender,
        dateOfBirth: patient?.dateOfBirth ? format(parseISO(patient.dateOfBirth), "dd-MM-yyyy") : "",
        lastVisit: patient?.lastVisit ? parseISO(patient.lastVisit) : undefined,
        nextVisit: patient?.nextVisit ? parseISO(patient.nextVisit) : undefined,
        status: patient?.status ?? 'Active',
        history: patient?.history ?? "",
        avatar: patient?.avatar ?? "",
        useAge: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        let dateOfBirthFormatted: string;

        if (values.useAge) {
          const age = parseInt(values.dateOfBirth);
          if (isNaN(age) || age < 0 || age > 150) {
            toast({
              title: "Invalid Age",
              description: "Please enter a valid age between 0 and 150",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          dateOfBirthFormatted = calculateDateOfBirth(age);
        } else {
          if (!/^\d{2}-\d{2}-\d{4}$/.test(values.dateOfBirth)) {
            toast({
              title: "Invalid Date Format",
              description: "Date must be in DD-MM-YYYY format",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          dateOfBirthFormatted = format(parse(values.dateOfBirth, "dd-MM-yyyy", new Date()), "yyyy-MM-dd");
        }

        await onSave({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            nationality: values.nationality,
            address: values.address,
            gender: values.gender,
            status: values.status,
            dateOfBirth: dateOfBirthFormatted,
            age: values.useAge ? parseInt(values.dateOfBirth) : undefined,
            lastVisit: values.lastVisit ? format(values.lastVisit, "yyyy-MM-dd") : undefined,
            nextVisit: values.nextVisit ? format(values.nextVisit, "yyyy-MM-dd") : undefined,
            history: values.history,
            branchId: patient?.branchId ?? "",
            avatar: values.avatar || `https://picsum.photos/seed/p${Math.random()}/200/200`,
        });
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
                                <div className="flex items-center justify-between">
                                  <FormLabel>{useAge ? "Age (Years)" : "Date of Birth"}</FormLabel>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUseAge(!useAge);
                                      form.setValue("useAge", !useAge);
                                      form.setValue("dateOfBirth", "");
                                    }}
                                    className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  >
                                    {useAge ? "Use Date" : "Use Age"}
                                  </button>
                                </div>
                                <FormControl>
                                    <Input
                                      placeholder={useAge ? "e.g., 30" : "DD-MM-YYYY"}
                                      {...field}
                                      type={useAge ? "number" : "text"}
                                      min={useAge ? "0" : undefined}
                                      max={useAge ? "150" : undefined}
                                    />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {useAge
                                    ? "Enter patient age in years"
                                    : "Enter in DD-MM-YYYY format (e.g., 15-06-1990)"}
                                </p>
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
                                    <PhoneInput
                                        international
                                        defaultCountry="UG"
                                        placeholder="Enter phone number"
                                        value={field.value as any}
                                        onChange={field.onChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 [&>input]:bg-transparent [&>input]:border-none [&>input]:outline-none [&>input]:ml-2"
                                    />
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
                            name="nationality"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nationality</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select nationality" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {countryList.map((country) => (
                                            <SelectItem key={country.value} value={country.value}>
                                                {country.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            name="lastVisit"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Last Visit Date (Optional)</FormLabel>
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
                                        fromYear={new Date().getFullYear() - 10}
                                        toYear={new Date().getFullYear()}
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
                            name="nextVisit"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Next Visit Target Date (Optional)</FormLabel>
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
