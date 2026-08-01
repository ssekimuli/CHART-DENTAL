"use client";

import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";

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
import { useCurrency } from "@/hooks/use-currency";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Invoice, PaymentMethod } from "@/lib/types";


const formSchema = z.object({
  paymentAmount: z.coerce.number(),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer', 'Refund']),
});

type PaymentFormProps = {
    invoice: Invoice;
    onSave: (invoiceId: string, amount: number, method: string) => void;
    onOpenChange: (open: boolean) => void;
};

export function PaymentForm({ invoice, onSave, onOpenChange }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { formatCurrency } = useCurrency();
  const balance = Number(invoice.amount) - Number(invoice.paidAmount);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        paymentAmount: balance,
        paymentMethod: invoice.paymentMethod ?? "Credit Card",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    onSave(String(invoice.id), values.paymentAmount, values.paymentMethod);
      } finally {
      setIsSubmitting(false);
    }
  }

  const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Insurance', 'Bank Transfer', 'Refund'];

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Process Payment</DialogTitle>
                <DialogDescription>
                   For Invoice #{invoice.id} - Balance: {formatCurrency(balance)}
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
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Payment
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
