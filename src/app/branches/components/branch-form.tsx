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
import type { Branch } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  address: z.string().min(5, "Please enter a valid address."),
});

type BranchFormProps = {
    onSave: (data: Omit<Branch, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function BranchForm({ onSave, onOpenChange }: BranchFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        address: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add Branch</DialogTitle>
                <DialogDescription>
                    Fill out the details for the new practice location.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Branch Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Downtown Clinic" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 123 Main St, Cityville" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Branch</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
