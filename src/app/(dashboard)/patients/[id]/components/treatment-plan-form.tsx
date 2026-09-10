"use client";
import { useToast } from "@/hooks/use-toast";

import { Loader2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { getTreatments } from "@/lib/api";

const formSchema = z.object({
  procedureIds: z.array(z.string()).min(1, "At least one procedure is required."),
  tooth: z.coerce.number().optional(),
  status: z.enum(['Proposed', 'In Progress', 'Completed', 'Cancelled']),
  cost: z.coerce.number().min(0, { message: "Cost must be 0 or more." }),
  condition: z.enum(['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture', 'Implant', 'Bridge', 'Retained', 'Malocclusion']).optional(),
});

type TreatmentPlanFormProps = {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => void;
    onOpenChange: (open: boolean) => void;
    toothId?: number;
    currentCondition?: DentalCondition;
};

export function TreatmentPlanForm({ treatment, onSave, onOpenChange, toothId, currentCondition }: TreatmentPlanFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const isEditing = !!treatment;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureIds: treatment?.procedureId ? [String(treatment.procedureId)] : [],
      status: treatment?.status ?? 'Proposed',
      tooth: treatment?.tooth ?? toothId ?? undefined,
      cost: treatment?.cost ?? 0,
      condition: (currentCondition && ['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture', 'Implant', 'Bridge', 'Retained', 'Malocclusion'].includes(currentCondition)) ? currentCondition as any : undefined,
    },
  });

  useEffect(() => {
    const fetchTreatments = async () => {
        const data = await getTreatments();
        setSystemTreatments(data);
    }
    fetchTreatments();
  }, [])

  // When editing, pre-populate procedure selection after system treatments load
  useEffect(() => {
      if (treatment && systemTreatments.length > 0) {
          let pId = "";
          let matchedByName = systemTreatments.find(st => st.procedure === treatment.procedure);
          if (!matchedByName && treatment.procedure) {
              matchedByName = systemTreatments.find(st =>
                  treatment.procedure.includes(st.procedure) || st.procedure.includes(treatment.procedure)
              );
          }
          if (matchedByName) {
              pId = String(matchedByName.id);
          } else if (treatment.procedureId) {
              pId = String(treatment.procedureId);
          }
          if (pId) form.setValue('procedureIds', [pId]);
          form.setValue('status', treatment.status);
          if (treatment.tooth) form.setValue('tooth', treatment.tooth);
          form.setValue('cost', treatment.cost);
          if (currentCondition && ['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture', 'Implant', 'Bridge', 'Retained', 'Malocclusion'].includes(currentCondition)) {
            form.setValue('condition', currentCondition as any);
          }
      }
  }, [treatment, systemTreatments, form, currentCondition]);

  // Auto-compute total cost when selected procedures change
  const selectedProcedureIds = form.watch("procedureIds");
  useEffect(() => {
    if (!isEditing && selectedProcedureIds.length > 0 && systemTreatments.length > 0) {
      const total = selectedProcedureIds.reduce((sum, id) => {
        const match = systemTreatments.find(t => String(t.id) === String(id));
        return sum + (match ? Number(match.cost) : 0);
      }, 0);
      form.setValue('cost', total);
    }
  }, [selectedProcedureIds, systemTreatments, isEditing, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (values.procedureIds.length === 0) {
        toast({ title: "Error", description: "Please select at least one procedure.", variant: "destructive" });
        return;
      }

      // Submit one treatment entry per selected procedure
      for (const pid of values.procedureIds) {
        const selectedSystemTreatment = systemTreatments.find(t => String(t.id) === String(pid));
        const procedureName = selectedSystemTreatment?.procedure ?? treatment?.procedure ?? '';
        if (!procedureName) continue;

        onSave({
          procedureId: pid,
          procedure: procedureName,
          tooth: values.tooth,
          status: values.status,
          cost: selectedSystemTreatment ? Number(selectedSystemTreatment.cost) : values.cost / values.procedureIds.length,
        }, values.condition);
      }
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

  const comboboxOptions = systemTreatments.map(t => ({
    value: String(t.id),
    label: t.procedure,
    category: t.category,
  }));

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
                    {/* Multi-procedure selector */}
                    <Controller
                      control={form.control}
                      name="procedureIds"
                      render={({ field, fieldState }) => (
                        <div className="space-y-1">
                          <FormLabel>Procedures</FormLabel>
                          <MultiCombobox
                            options={comboboxOptions}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select one or more procedures..."
                            searchPlaceholder="Search procedures..."
                            emptyMessage="No procedure found."
                          />
                          {fieldState.error && (
                            <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
                          )}
                        </div>
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
                                    <SelectItem value="Healthy">Healthy</SelectItem>
                                    <SelectItem value="Caries">Caries</SelectItem>
                                    <SelectItem value="Filling">Filling</SelectItem>
                                    <SelectItem value="Crown">Crown</SelectItem>
                                    <SelectItem value="Fracture">Fracture</SelectItem>
                                    <SelectItem value="Missing">Missing</SelectItem>
                                    <SelectItem value="Implant">Implant</SelectItem>
                                    <SelectItem value="Bridge">Bridge</SelectItem>
                                    <SelectItem value="Retained">Retained</SelectItem>
                                    <SelectItem value="Malocclusion">Malocclusion</SelectItem>
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
                                <FormLabel>Total Cost {selectedProcedureIds.length > 1 ? `(${selectedProcedureIds.length} procedures)` : ''}</FormLabel>
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
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isEditing ? 'Save Changes' : `Add ${selectedProcedureIds.length > 1 ? `${selectedProcedureIds.length} Treatments` : 'Treatment'}`}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
