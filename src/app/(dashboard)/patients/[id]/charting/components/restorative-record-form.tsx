"use client";

import { useEffect } from "react";
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
import type { RestorativeRecord } from "@/lib/types";

const formSchema = z.object({
  toothId: z.number().min(1, "Tooth ID is required").max(48, "Invalid tooth ID"),
  surface: z.string().min(1, "Surface is required"),
  material: z.string().min(1, "Material is required"),
  notes: z.string().optional(),
});

type RestorativeRecordFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: RestorativeRecord;
  onSave: (record: Omit<RestorativeRecord, "id" | "createdAt" | "updatedAt">) => void;
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

import { SelectGroup, SelectLabel } from "@/components/ui/select";

export function RestorativeRecordForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  onUpdate,
}: RestorativeRecordFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toothId: initialData?.toothId || 1,
      surface: initialData?.surface || "Whole Tooth",
      material: initialData?.material || "",
      notes: initialData?.notes || "",
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
      });
    }
  }, [initialData, form, open]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialData && initialData.id) {
      onUpdate({
        ...initialData,
        ...values,
      });
    } else {
      onSave(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Procedure" : "Add Procedure"}</DialogTitle>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select clinical procedure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {procedureGroups.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel className="font-bold text-blue-400 mt-2">{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option} value={option} className="ml-2">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
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
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
