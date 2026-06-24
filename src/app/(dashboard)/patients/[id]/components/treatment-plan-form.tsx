

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import type { Treatment, DentalCondition, SystemTreatment } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { getTreatments } from "@/lib/api";

const formSchema = z.object({
  procedureId: z.preprocess((value) => String(value), z.string().min(1, "Procedure is required.")),
  procedure: z.string().optional(),
  tooth: z.coerce.number().optional(),
  status: z.enum(['Proposed', 'In Progress', 'Completed', 'Cancelled']),
  cost: z.coerce.number().positive({ message: "Cost must be a positive number."}),
  condition: z.enum(['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture']).optional(),
});

type TreatmentPlanFormProps = {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => void;
    onOpenChange: (open: boolean) => void;
    toothId?: number;
    currentCondition?: DentalCondition;
};

export function TreatmentPlanForm({ treatment, onSave, onOpenChange, toothId, currentCondition }: TreatmentPlanFormProps) {
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureId: treatment?.procedureId ?? "",
      status: treatment?.status ?? 'Proposed',
      tooth: treatment?.tooth ?? toothId,
      cost: treatment?.cost,
      condition: currentCondition,
    },
  });

  useEffect(() => {
    const fetchTreatments = async () => {
        const data = await getTreatments();
        setSystemTreatments(data);
    }
    fetchTreatments();
  }, [])
  
  const selectedProcedureId = form.watch("procedureId");
  useEffect(() => {
    if (selectedProcedureId) {
      const matchingTreatment = systemTreatments.find(
        t => String(t.id) === String(selectedProcedureId)
      );
      if (matchingTreatment) {
        form.setValue('cost', matchingTreatment.cost);
        form.setValue('procedure', matchingTreatment.procedure);
      }
    }
  }, [selectedProcedureId, systemTreatments, form])
  function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedSystemTreatment = systemTreatments.find(t => t.id === values.procedureId);
    if (!selectedSystemTreatment) return;

    onSave({
        ...values,
        procedure: selectedSystemTreatment.procedure,
    }, values.condition);
  }

  const isEditing = !!treatment;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Treatment' : `Add New Treatment`}</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Update the details of this treatment.' : `Fill out the details for the new treatment plan item.${toothId ? ` For tooth #${toothId}.` : ''}`}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="procedureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procedure</FormLabel>
                          <FormControl>
                            <Combobox
                                options={systemTreatments.map(t => ({ value: t.id, label: `${t.procedure} ($${t.cost})` }))}
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                placeholder="Select a procedure"
                                searchPlaceholder="Search procedures..."
                                emptyMessage="No procedure found."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isEditing && toothId && (
                       <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Log Condition (optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select condition to log" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Caries">Caries</SelectItem>
                                    <SelectItem value="Filling">Filling</SelectItem>
                                    <SelectItem value="Crown">Crown</SelectItem>
                                    <SelectItem value="Fracture">Fracture</SelectItem>
                                    <SelectItem value="Missing">Missing</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">This will also update the odontogram chart for this tooth.</p>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                    )}
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
