
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import type { Employee } from "@/lib/types";


const formSchema = z.object({
  salary: z.coerce.number().positive("Salary must be a positive number."),
});

type SalaryFormProps = {
    employee: Employee;
    onSave: (employeeId: string, newSalary: number) => void;
    onOpenChange: (open: boolean) => void;
};

export function SalaryForm({ employee, onSave, onOpenChange }: SalaryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        salary: employee.salary,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(String(employee.id), values.salary);
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Update Salary</DialogTitle>
                <DialogDescription>
                    Update the annual salary for {employee.name}.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
