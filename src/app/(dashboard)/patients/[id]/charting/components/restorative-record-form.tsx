"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import type { RestorativeRecord, SystemTreatment } from "@/lib/types";
import { getTreatments } from "@/lib/api";
import { getCurrencyConfig } from "@/lib/currency";

const formSchema = z.object({
  toothId: z.number().min(1, "Tooth ID is required").max(48, "Invalid tooth ID"),
  surface: z.string().min(1, "Surface is required"),
  material: z.string().min(1, "Material is required"),
  notes: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost must be a positive number").optional(),
  procedureCost: z.coerce.number().min(0, "Cost must be a positive number").optional(),
  materialCost: z.coerce.number().min(0, "Cost must be a positive number").optional(),
  otherCharges: z.coerce.number().min(0, "Cost must be a positive number").optional(),
});

type RestorativeRecordFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: RestorativeRecord;
  onSave: (record: Omit<RestorativeRecord, "id" | "createdAt" | "updatedAt"> & { procedureCost?: number, materialCost?: number, otherCharges?: number }) => void;
  onUpdate: (record: RestorativeRecord) => void;
};

const commonSurfaces = ["O (Occlusal)", "M (Mesial)", "D (Distal)", "F (Facial)", "L (Lingual)", "MO", "DO", "MOD", "Whole Tooth"];

// Grouped procedures for the select dropdown
const procedureGroups = [
  {
    label: "Direct Restorations",
    options: [
      "Composite (tooth-colored) fillings",
      "Amalgam (silver) fillings",
      "Glass ionomer cement (GIC) fillings",
      "Resin-modified glass ionomer (RMGIC) fillings",
      "Temporary fillings"
    ]
  },
  {
    label: "Indirect Restorations",
    options: [
      "Dental inlays",
      "Dental onlays",
      "Porcelain veneers",
      "Composite veneers"
    ]
  },
  {
    label: "Crowns",
    options: [
      "Full metal crowns",
      "Porcelain-fused-to-metal (PFM) crowns",
      "All-ceramic crowns",
      "Zirconia crowns",
      "E-max (lithium disilicate) crowns",
      "Stainless steel crowns (primarily pediatric)"
    ]
  },
  {
    label: "Bridge Procedures",
    options: [
      "Traditional dental bridge",
      "Cantilever bridge",
      "Maryland bridge (resin-bonded bridge)",
      "Implant-supported bridge"
    ]
  },
  {
    label: "Implant Restorations",
    options: [
      "Implant",
      "Single implant crown",
      "Implant-supported overdenture",
      "Full-arch implant restoration (All-on-4/All-on-6)"
    ]
  },
  {
    label: "Denture Restorations",
    options: [
      "Complete dentures",
      "Partial dentures",
      "Immediate dentures",
      "Flexible dentures",
      "Implant-retained dentures",
      "Denture relining",
      "Denture rebasing",
      "Denture repair"
    ]
  },
  {
    label: "Endodontic Restorations",
    options: [
      "Core buildup",
      "Post and core restoration",
      "Crown after root canal treatment",
      "Endocrown"
    ]
  },
  {
    label: "Pediatric Restorations",
    options: [
      "Composite restorations",
      "Glass ionomer restorations",
      "Stainless steel crowns",
      "Strip crowns",
      "Hall technique crowns"
    ]
  },
  {
    label: "Cosmetic Restorations",
    options: [
      "Direct composite bonding",
      "Diastema (gap) closure",
      "Tooth reshaping (enameloplasty)",
      "Composite veneers",
      "Porcelain veneers"
    ]
  },
  {
    label: "Tooth Reconstruction",
    options: [
      "Cusp replacement",
      "Fractured tooth restoration",
      "Worn tooth rehabilitation",
      "Full mouth rehabilitation",
      "Occlusal reconstruction"
    ]
  },
  {
    label: "Repair and Replacement",
    options: [
      "Filling replacement",
      "Crown replacement",
      "Bridge replacement",
      "Veneer replacement",
      "Composite restoration repair",
      "Crown repair"
    ]
  },
  {
    label: "Additional Restorative Procedures",
    options: [
      "Pin-retained restoration",
      "Foundation restoration",
      "Caries excavation and restoration",
      "Deep margin elevation",
      "Indirect pulp capping before restoration",
      "Direct pulp capping before restoration",
      "Temporary crown placement",
      "Temporary bridge placement",
      "Occlusal adjustment after restoration"
    ]
  },
  {
    label: "Digital Restorative Procedures",
    options: [
      "Digital intraoral scanning",
      "CAD/CAM same-day crowns",
      "Chairside milled inlays/onlays",
      "Digital smile design for restorations"
    ]
  }
];

const comboboxOptions = procedureGroups.flatMap(group => 
  group.options.map(opt => ({
    label: opt,
    value: opt,
    category: group.label
  }))
);

export function RestorativeRecordForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  onUpdate,
}: RestorativeRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const currencyConfig = getCurrencyConfig();

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const data = await getTreatments();
        setSystemTreatments(data);
      } catch (error) {
        console.error("Failed to fetch treatments", error);
      }
    };
    if (open) {
      fetchTreatments();
    }
  }, [open]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toothId: initialData?.toothId || 1,
      surface: initialData?.surface || "Whole Tooth",
      material: initialData?.material || "",
      notes: initialData?.notes || "",
      cost: undefined,
      procedureCost: undefined,
      materialCost: undefined,
      otherCharges: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        toothId: initialData.toothId,
        surface: initialData.surface || "Whole Tooth",
        material: initialData.material,
        notes: initialData.notes || "",
      });
    } else {
      form.reset({
        toothId: 1, // Will be overridden dynamically when opening
        surface: "Whole Tooth",
        material: "",
        notes: "",
        cost: undefined,
        procedureCost: undefined,
        materialCost: undefined,
        otherCharges: undefined,
      });
    }
  }, [initialData, form, open]);

  const selectedMaterial = form.watch("material");

  useEffect(() => {
    if (selectedMaterial && systemTreatments.length > 0) {
      const match = systemTreatments.find(t => t.procedure.toLowerCase() === selectedMaterial.toLowerCase());
      if (match && !initialData?.id) {
        form.setValue("procedureCost", Number(match.cost));
      }
    }
  }, [selectedMaterial, systemTreatments, form, initialData?.id]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialData && initialData.id) {
      onUpdate({
        ...initialData,
        ...values,
      });
    } else {
      await onSave(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData && initialData.id ? "Edit Procedure" : "Add Procedure"}</DialogTitle>
          <DialogDescription>
            Record clinical procedures and surface locations.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toothId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tooth ID</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="surface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / View</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select view (e.g. Top)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonSurfaces.map((surface) => (
                        <SelectItem key={surface} value={surface}>
                          {surface}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedure</FormLabel>
                  <FormControl>
                    <Combobox
                      options={comboboxOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select clinical procedure..."
                      searchPlaceholder="Search procedures..."
                      emptyMessage="No procedures found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Additional details..." 
                        className="resize-none"
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="procedureCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procedure Cost ({currencyConfig.symbol})</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="materialCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Cost ({currencyConfig.symbol})</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="otherCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Charges ({currencyConfig.symbol})</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="text-right text-sm text-slate-400 font-medium pt-2 pb-4">
                    Total Estimated Cost: {currencyConfig.symbol}{(
                      (Number(form.watch('procedureCost')) || 0) + 
                      (Number(form.watch('materialCost')) || 0) + 
                      (Number(form.watch('otherCharges')) || 0)
                    ).toFixed(2)}
                  </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save
      </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
