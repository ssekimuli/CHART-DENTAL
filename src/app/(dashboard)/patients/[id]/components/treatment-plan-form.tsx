"use client";
import { useToast } from "@/hooks/use-toast";

import { Loader2, Calculator } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";

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
  condition: z.enum(['Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture', 'Implant', 'Bridge', 'Retained Root', 'Malocclusion']).optional(),
});

const VALID_CONDITIONS: DentalCondition[] = [
  'Healthy', 'Caries', 'Filling', 'Crown', 'Missing', 'Fracture', 'Implant', 'Bridge', 'Retained Root', 'Malocclusion'
];

function normalizeCondition(cond?: DentalCondition | string): DentalCondition | undefined {
  if (!cond) return undefined;
  if ((cond as string) === 'Retained' || cond === 'Retained Root') {
    return 'Retained Root';
  }
  return VALID_CONDITIONS.includes(cond as DentalCondition) ? (cond as DentalCondition) : undefined;
}

type TreatmentPlanFormProps = {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => void;
    onSaveBatch?: (items: Array<{ data: Omit<Treatment, 'id' | 'date'>; condition?: DentalCondition }>) => void;
    onOpenChange: (open: boolean) => void;
    toothId?: number;
    currentCondition?: DentalCondition | string;
};

export function TreatmentPlanForm({ treatment, onSave, onSaveBatch, onOpenChange, toothId, currentCondition }: TreatmentPlanFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const [itemCosts, setItemCosts] = useState<Record<string, number>>({});
  const isEditing = !!treatment;
  const lastProcedureIdsRef = useRef<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureIds: treatment?.procedureId ? [String(treatment.procedureId)] : [],
      status: treatment?.status ?? 'Proposed',
      tooth: treatment?.tooth ?? toothId ?? undefined,
      cost: treatment?.totalCost ?? treatment?.cost ?? 0,
      condition: normalizeCondition(currentCondition),
    },
  });

  useEffect(() => {
    const fetchTreatments = async () => {
        const data = await getTreatments();
        setSystemTreatments(data);
    };
    fetchTreatments();
  }, []);

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
          if (pId) {
            form.setValue('procedureIds', [pId]);
            setItemCosts({ [pId]: treatment.cost });
          }
          form.setValue('status', treatment.status);
          if (treatment.tooth) form.setValue('tooth', treatment.tooth);
          const effectiveCost = treatment.totalCost ?? treatment.cost ?? 0;
          form.setValue('cost', effectiveCost);
          const norm = normalizeCondition(currentCondition);
          if (norm) {
            form.setValue('condition', norm);
          }
      }
  }, [treatment, systemTreatments, form, currentCondition]);

  const selectedProcedureIds = form.watch("procedureIds");

  // Keep itemCosts and total cost in sync when procedures are selected or removed
  useEffect(() => {
    if (isEditing || systemTreatments.length === 0) return;

    const prevIds = lastProcedureIdsRef.current;
    const isSameIds = prevIds.length === selectedProcedureIds.length && prevIds.every((id, idx) => id === selectedProcedureIds[idx]);
    if (isSameIds) return;

    lastProcedureIdsRef.current = selectedProcedureIds;

    const newItemCosts: Record<string, number> = {};
    let total = 0;

    selectedProcedureIds.forEach(id => {
      if (itemCosts[id] !== undefined) {
        newItemCosts[id] = itemCosts[id];
        total += itemCosts[id];
      } else {
        const match = systemTreatments.find(t => String(t.id) === String(id));
        const defaultCost = match ? Number(match.cost) || 0 : 0;
        newItemCosts[id] = defaultCost;
        total += defaultCost;
      }
    });

    setItemCosts(newItemCosts);
    form.setValue('cost', total);
  }, [selectedProcedureIds, systemTreatments, isEditing, form, itemCosts]);

  // When user directly modifies the Total Cost input
  const handleTotalCostChange = (newTotal: number) => {
    form.setValue('cost', newTotal);

    if (selectedProcedureIds.length <= 1) {
      if (selectedProcedureIds[0]) {
        setItemCosts({ [selectedProcedureIds[0]]: newTotal });
      }
      return;
    }

    // Proportionally distribute adjusted total across selected procedures
    const currentSum = selectedProcedureIds.reduce((sum, id) => sum + (itemCosts[id] ?? 0), 0);
    const updated: Record<string, number> = {};
    let allocated = 0;

    selectedProcedureIds.forEach((id, idx) => {
      if (idx === selectedProcedureIds.length - 1) {
        updated[id] = Math.max(0, Math.round((newTotal - allocated) * 100) / 100);
      } else {
        const proportion = currentSum > 0 ? ((itemCosts[id] ?? 0) / currentSum) : (1 / selectedProcedureIds.length);
        const itemVal = Math.max(0, Math.round(newTotal * proportion * 100) / 100);
        updated[id] = itemVal;
        allocated += itemVal;
      }
    });

    setItemCosts(updated);
  };

  // When user modifies an individual procedure cost in the breakdown
  const handleItemCostChange = (id: string, newCost: number) => {
    const validCost = Math.max(0, Number(newCost) || 0);
    const updated = { ...itemCosts, [id]: validCost };
    setItemCosts(updated);
    const newTotal = selectedProcedureIds.reduce((sum, pid) => sum + (updated[pid] ?? 0), 0);
    form.setValue('cost', Math.round(newTotal * 100) / 100);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (values.procedureIds.length === 0) {
        toast({ title: "Error", description: "Please select at least one procedure.", variant: "destructive" });
        return;
      }

      const totalCostValue = Number(values.cost);

      if (isEditing) {
        // Single update
        const selectedSystemTreatment = systemTreatments.find(t => String(t.id) === String(values.procedureIds[0]));
        const procedureName = selectedSystemTreatment?.procedure ?? treatment?.procedure ?? '';
        onSave({
          procedureId: values.procedureIds[0],
          procedure: procedureName,
          tooth: values.tooth,
          status: values.status,
          cost: totalCostValue,
          totalCost: totalCostValue,
          total_cost: totalCostValue,
        }, values.condition);
      } else if (values.procedureIds.length === 1) {
        // Single procedure add
        const pid = values.procedureIds[0];
        const selectedSystemTreatment = systemTreatments.find(t => String(t.id) === String(pid));
        const procedureName = selectedSystemTreatment?.procedure ?? '';

        const singleItemData = {
          procedureId: pid,
          procedure: procedureName,
          tooth: values.tooth,
          status: values.status,
          cost: totalCostValue,
          totalCost: totalCostValue,
          total_cost: totalCostValue,
        };

        if (onSaveBatch) {
          onSaveBatch([{ data: singleItemData, condition: values.condition }]);
        } else {
          onSave(singleItemData, values.condition);
        }
      } else {
        // Multiple procedures add
        const items = values.procedureIds.map((pid, idx) => {
          const st = systemTreatments.find(t => String(t.id) === String(pid));
          const allocatedCost = itemCosts[pid] ?? (totalCostValue / values.procedureIds.length);
          return {
            data: {
              procedureId: pid,
              procedure: st?.procedure ?? '',
              tooth: values.tooth,
              status: values.status,
              cost: Number(allocatedCost),
              totalCost: totalCostValue,
              total_cost: totalCostValue,
            },
            condition: values.condition as DentalCondition | undefined,
          };
        }).filter(item => item.data.procedure);

        if (onSaveBatch) {
          onSaveBatch(items);
        } else {
          for (const item of items) {
            onSave(item.data, item.condition);
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
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

                    {/* Individual Procedure Breakdown if more than 1 procedure is selected */}
                    {selectedProcedureIds.length > 1 && (
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Calculator className="h-3.5 w-3.5" />
                            Procedure Cost Breakdown ({selectedProcedureIds.length} items)
                          </span>
                          <span className="text-xs text-muted-foreground">Adjust item or total cost</span>
                        </div>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {selectedProcedureIds.map(pid => {
                            const st = systemTreatments.find(t => String(t.id) === String(pid));
                            return (
                              <div key={pid} className="flex items-center justify-between gap-3 text-xs bg-background p-2 rounded border">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{st?.procedure || `Procedure #${pid}`}</p>
                                  <p className="text-muted-foreground text-[11px]">
                                    Catalog: {st?.cost !== undefined ? Number(st.cost).toLocaleString() : '0'}
                                    {st?.category ? ` • ${st.category}` : ''}
                                  </p>
                                </div>
                                <div className="w-28 shrink-0">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-7 text-xs text-right font-mono"
                                    value={itemCosts[pid] ?? ''}
                                    onChange={(e) => handleItemCostChange(pid, parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                                    <SelectItem value="Retained Root">Retained Root</SelectItem>
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
                                <FormLabel className="flex items-center justify-between">
                                  <span>Total Cost {selectedProcedureIds.length > 1 ? `(${selectedProcedureIds.length} procedures)` : ''}</span>
                                  <span className="text-[10px] text-muted-foreground font-normal">Adjustable</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={field.value ?? ''}
                                      onChange={(e) => handleTotalCostChange(parseFloat(e.target.value) || 0)}
                                      onBlur={field.onBlur}
                                    />
                                </FormControl>
                                <p className="text-[11px] text-muted-foreground">Total cost posted with treatment payload</p>
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
