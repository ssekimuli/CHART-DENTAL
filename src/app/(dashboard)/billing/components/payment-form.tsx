
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";

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
import type { Invoice, PaymentMethod } from "@/lib/types";


const formSchema = z.object({
  paymentAmount: z.coerce.number().positive("Payment amount must be positive."),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer']),
});

type PaymentFormProps = {
    invoice: Invoice;
    onSave: (invoiceId: string, amount: number, method: string) => void;
    onOpenChange: (open: boolean) => void;
};

export function PaymentForm({ invoice, onSave, onOpenChange }: PaymentFormProps) {
  const balance = invoice.amount - invoice.paidAmount;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        paymentAmount: balance,
        paymentMethod: invoice.paymentMethod ?? "Credit Card",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(invoice.id, values.paymentAmount, values.paymentMethod);
  }

  const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Insurance', 'Bank Transfer'];

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Process Payment</DialogTitle>
                <DialogDescription>
                   For Invoice #{invoice.id} - Balance: ${balance.toFixed(2)}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="paymentAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Payment Amount</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {paymentMethods.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Submit Payment</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
