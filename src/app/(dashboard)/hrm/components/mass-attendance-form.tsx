"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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

const formSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});

type MassAttendanceFormProps = {
    onSave: (checkIn?: string, checkOut?: string) => void;
    onOpenChange: (open: boolean) => void;
    employeeCount: number;
};

export function MassAttendanceForm({ onSave, onOpenChange, employeeCount }: MassAttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        checkIn: "09:00",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    onSave(values.checkIn, values.checkOut);
      } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Mark {employeeCount} Employee(s) as Present</DialogTitle>
                <DialogDescription>
                    Set the check-in and check-out times for the selected employees.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply to Selected
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
