

"use client";
import { useToast } from "@/hooks/use-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

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
import type { Employee, EmployeeRole, Branch } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { getBranches, getRolesList } from "@/lib/api";
import { useBranch } from "@/context/branch-context";


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().min(7, "Please enter a valid phone number.").optional().or(z.literal('')),
  role: z.string({ required_error: "Role is required."}),
  status: z.enum(['Active', 'On Leave', 'Blocked']),
  salary: z.coerce.number().positive("Salary must be a positive number.").optional(),
  monthlySalary: z.coerce.number().optional(),
  hire_date: z.date({
    required_error: "A hire date is required.",
  }),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  branchId: z.string({ required_error: "Branch is required."}),
});

type EmployeeFormProps = {
    employee?: Employee;
    onSave: (data: Omit<Employee, 'id' | 'branchId'> & { branchId: string | number }) => void;
    onOpenChange: (open: boolean) => void;
};

export function EmployeeForm({ employee, onSave, onOpenChange }: EmployeeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { selectedBranch } = useBranch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: employee?.name ?? "",
        email: employee?.email ?? "",
        phone: employee?.phone ?? "",
        role: employee?.role,
        status: employee?.status ?? 'Active',
        salary: Number(employee?.salary),
        monthlySalary: employee ? Number(employee.salary) / 12 : undefined,
        hire_date: employee ? parseISO(employee.hire_date) : undefined,
        gender: employee?.gender,
        avatar: employee?.avatar ?? "",
        branchId: employee ? String(employee.branchId) : String(selectedBranch || ""),
    },
  });

  useEffect(() => {
    if (employee) {
      const roleId = roles.length > 0 
          ? (roles.find(r => r.name === employee.role || String(r.id) === String(employee.role))?.id || employee.role)
          : employee.role;
          
      const capitalizedGender = employee.gender 
          ? (employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1).toLowerCase()) as any
          : undefined;

      form.reset({
        name: employee.name ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        role: roleId,
        status: employee.status ?? 'Active',
        salary: Number(employee.salary),
        monthlySalary: Number(employee.salary) / 12,
        hire_date: employee.hire_date ? parseISO(employee.hire_date) : undefined as any,
        gender: capitalizedGender,
        avatar: employee.avatar ?? "",
        branchId: String(employee.branchId),
      });
    }
  }, [employee, form, roles]);

  useEffect(() => {
    const fetchRoles = async () => {
        const rolesData = await getRolesList();
        setRoles(rolesData);
    };
    const fetchBranches = async () => {
        const branchesData = await getBranches();
        setBranches(branchesData);
    }
    fetchRoles();
    fetchBranches();
  }, []);

  const annualSalary = form.watch("salary");
  const monthlySalary = form.watch("monthlySalary");

  useEffect(() => {
    if (annualSalary === undefined || annualSalary === null) return;
    const newMonthly = parseFloat((annualSalary / 12).toFixed(2));
    if (annualSalary && (!monthlySalary || newMonthly !== monthlySalary)) {
      form.setValue("monthlySalary", newMonthly);
    }
  }, [annualSalary, monthlySalary, form]);

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthly = parseFloat(e.target.value);
    form.setValue("monthlySalary", monthly);
    if (!isNaN(monthly)) {
        form.setValue("salary", parseFloat((monthly * 12).toFixed(2)));
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await onSave({
        ...values,
        role: values.role as EmployeeRole,
        salary: values.salary ?? 0,
        hire_date: format(values.hire_date, "yyyy-MM-dd"),
        avatar: values.avatar || `https://picsum.photos/seed/emp${Math.random()}/200/200`,
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


  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
                <DialogDescription>
                    {employee ? "Update the details for this staff member." : "Fill out the details for the new staff member."}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., John Doe" {...field} />
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., +1 (555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Branch</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Annual Salary</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 75000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="monthlySalary"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Monthly Salary</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 6250" {...field} onChange={handleMonthlyChange} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="hire_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Hire Date</FormLabel>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="On Leave">On Leave</SelectItem>
                                        <SelectItem value="Blocked">Blocked</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {employee ? "Save Changes" : "Save Employee"}
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}


