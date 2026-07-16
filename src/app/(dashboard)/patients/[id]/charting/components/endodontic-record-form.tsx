"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import type { EndodonticRecord, CanalDetail } from "@/lib/types";

type EndodonticRecordFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<EndodonticRecord, "id" | "date">) => void;
  record?: EndodonticRecord;
};

const PULPAL_DIAGNOSES = [
  "Normal Pulp",
  "Reversible Pulpitis",
  "Symptomatic Irreversible Pulpitis",
  "Asymptomatic Irreversible Pulpitis",
  "Pulp Necrosis",
  "Previously Treated",
  "Previously Initiated Therapy",
];

const PERIAPICAL_DIAGNOSES = [
  "Normal Apical Tissues",
  "Symptomatic Apical Periodontitis",
  "Asymptomatic Apical Periodontitis",
  "Acute Apical Abscess",
  "Chronic Apical Abscess",
  "Condensing Osteitis",
];

const CANAL_NAMES = ["MB", "MB2", "DB", "ML", "DL", "P", "B", "L", "Lingual", "Buccal", "Palatal", "Mesial", "Distal"];

export function EndodonticRecordForm({
  isOpen,
  onClose,
  onSave,
  record,
}: EndodonticRecordFormProps) {
  const { register, control, handleSubmit, reset, setValue, watch } = useForm<Omit<EndodonticRecord, "id" | "date">>({
    defaultValues: {
      toothId: 1,
      pulpalDiagnosis: PULPAL_DIAGNOSES[0],
      periapicalDiagnosis: PERIAPICAL_DIAGNOSES[0],
      canals: [{ name: "MB", referencePoint: "Cusp Tip", workingLength: 21, fileSize: "#25", obturationSize: "#25/.04" }],
      obturationMaterial: "Gutta-Percha & Sealer",
      postType: "None",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "canals",
  });

  useEffect(() => {
    if (record) {
      reset({
        toothId: record.toothId,
        pulpalDiagnosis: record.pulpalDiagnosis,
        periapicalDiagnosis: record.periapicalDiagnosis,
        canals: record.canals,
        obturationMaterial: record.obturationMaterial || "Gutta-Percha & Sealer",
        postType: record.postType || "None",
        notes: record.notes || "",
      });
    } else {
      reset({
        toothId: 1,
        pulpalDiagnosis: PULPAL_DIAGNOSES[0],
        periapicalDiagnosis: PERIAPICAL_DIAGNOSES[0],
        canals: [{ name: "MB", referencePoint: "Cusp Tip", workingLength: 21, fileSize: "#25", obturationSize: "#25/.04" }],
        obturationMaterial: "Gutta-Percha & Sealer",
        postType: "None",
        notes: "",
      });
    }
  }, [record, reset, isOpen]);

  const onSubmit = (data: Omit<EndodonticRecord, "id" | "date">) => {
    onSave({
      ...data,
      toothId: Number(data.toothId),
    });
  };

  const watchPulpal = watch("pulpalDiagnosis");
  const watchPeriapical = watch("periapicalDiagnosis");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Endodontic Record" : "Add Endodontic Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toothId">Tooth Number</Label>
              <Input
                id="toothId"
                type="number"
                min={1}
                max={32}
                {...register("toothId", { required: true, min: 1, max: 32 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postType">Post / Core Type</Label>
              <Select
                value={watch("postType") || "None"}
                onValueChange={(val) => setValue("postType", val)}
              >
                <SelectTrigger id="postType">
                  <SelectValue placeholder="Select Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Fiber Post">Fiber Post</SelectItem>
                  <SelectItem value="Metal Post">Metal Post</SelectItem>
                  <SelectItem value="Cast Post & Core">Cast Post & Core</SelectItem>
                  <SelectItem value="Composite Core Only">Composite Core Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pulpalDiagnosis">Pulpal Diagnosis</Label>
              <Select
                value={watchPulpal}
                onValueChange={(val) => setValue("pulpalDiagnosis", val)}
              >
                <SelectTrigger id="pulpalDiagnosis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PULPAL_DIAGNOSES.map((diag) => (
                    <SelectItem key={diag} value={diag}>
                      {diag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periapicalDiagnosis">Periapical Diagnosis</Label>
              <Select
                value={watchPeriapical}
                onValueChange={(val) => setValue("periapicalDiagnosis", val)}
              >
                <SelectTrigger id="periapicalDiagnosis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIAPICAL_DIAGNOSES.map((diag) => (
                    <SelectItem key={diag} value={diag}>
                      {diag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Label className="text-base font-semibold">Root Canals</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: "MB",
                    referencePoint: "Cusp Tip",
                    workingLength: 20,
                    fileSize: "#25",
                    obturationSize: "#25/.04",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Canal
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md relative bg-muted/40"
              >
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">Canal Name</Label>
                  <Select
                    value={watch(`canals.${index}.name`)}
                    onValueChange={(val) => setValue(`canals.${index}.name`, val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANAL_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px]">Ref Point</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. Cusp Tip"
                    {...register(`canals.${index}.referencePoint` as const)}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">WL (mm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    className="h-8 text-xs"
                    placeholder="Length"
                    {...register(`canals.${index}.workingLength` as const, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">MAF Size</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. #30"
                    {...register(`canals.${index}.fileSize` as const)}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">Obturation</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. #30/.04"
                    {...register(`canals.${index}.obturationSize` as const)}
                  />
                </div>

                <div className="col-span-1 flex justify-center pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="obturationMaterial">Obturation Material</Label>
              <Input
                id="obturationMaterial"
                placeholder="e.g. Gutta-Percha & AH Plus"
                {...register("obturationMaterial")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Observations</Label>
            <Textarea
              id="notes"
              placeholder="Record any additional clinical findings..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{record ? "Save Changes" : "Save Record"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
