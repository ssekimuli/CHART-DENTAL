"use client";
import { useToast } from "@/hooks/use-toast";

import { Loader2 } from "lucide-react";
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
import { useCurrency } from "@/hooks/use-currency";

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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const { formatCurrency } = useCurrency();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureId: treatment?.procedureId ? String(treatment.procedureId) : "",
      procedure: treatment?.procedure ?? "",
      status: treatment?.status ?? 'Proposed',
      tooth: treatment?.tooth ?? toothId ?? undefined,
      cost: treatment?.cost ?? 0,
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

  // When editing, if we have a treatment but procedureId is empty, try to match it by name
  // after system treatments load.
  useEffect(() => {
      if (treatment && systemTreatments.length > 0) {
          let pId = treatment.procedureId;
          if (!pId) {
              const matched = systemTreatments.find(st => st.procedure === treatment.procedure);
              if (matched) {
                  pId = String(matched.id);
                  form.setValue('procedureId', pId);
              }
          }
          // Set other values to ensure form is fully populated
          form.setValue('procedure', treatment.procedure);
          form.setValue('status', treatment.status);
          if (treatment.tooth) form.setValue('tooth', treatment.tooth);
          form.setValue('cost', treatment.cost);
          if (currentCondition) form.setValue('condition', currentCondition);
      }
  }, [treatment, systemTreatments, form, currentCondition]);
  
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
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    const selectedSystemTreatment = systemTreatments.find(t => String(t.id) === String(values.procedureId));
    
    // When editing, it's okay if we can't find the system treatment (user may not have changed procedure)
    // Fall back to the existing treatment prop's procedure name
    const procedureName = selectedSystemTreatment?.procedure ?? treatment?.procedure ?? values.procedure ?? '';
    if (!procedureName) return;

    await onSave({
        ...values,
        procedure: procedureName,
    }, values.condition);
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
                                options={systemTreatments.map(t => ({ 
                                    value: t.id, 
                                    label: `${t.procedure} (${formatCurrency(t.cost)})`,
                                    category: t.category 
                                }))}
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
                        <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? 'Save Changes' : 'Add Treatment'}
      </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
