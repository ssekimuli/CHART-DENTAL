
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Treatment, DentalCondition } from "@/lib/types";

const formSchema = z.object({
  procedure: z.string().min(2, {
    message: "Procedure must be at least 2 characters.",
  }),
  tooth: z.coerce.number().optional(),
  status: z.enum(['Proposed', 'In Progress', 'Completed', 'Cancelled']),
  cost: z.coerce.number().positive({ message: "Cost must be a positive number."}),
  condition: z.enum(['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture']).optional(),
});

type TreatmentPlanFormProps = {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id' | 'date'>) => void;
    onOpenChange: (open: boolean) => void;
    toothId?: number;
};

export function TreatmentPlanForm({ treatment, onSave, onOpenChange, toothId }: TreatmentPlanFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedure: treatment?.procedure ?? "",
      status: treatment?.status ?? 'Proposed',
      tooth: treatment?.tooth ?? toothId,
      cost: treatment?.cost,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { condition, ...treatmentData } = values; // Condition is handled in charting now
    onSave(treatmentData);
  }

  const isEditing = !!treatment;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Treatment' : `Add New Treatment`}</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Update the details of this treatment.' : 'Fill out the details for the new treatment plan item.'}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="procedure"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Procedure</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Composite Filling" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="tooth"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tooth # (optional)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 16" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                                        <SelectItem value="Proposed">Proposed</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cost</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Treatment'}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

    