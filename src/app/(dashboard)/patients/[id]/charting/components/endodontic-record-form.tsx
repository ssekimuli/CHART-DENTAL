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

function ToothAnatomy({ toothId, activeCanals }: { toothId: number; activeCanals: string[] }) {
  let type: "anterior" | "premolar" | "molar" = "anterior";

  const anteriors = [6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27];
  const premolars = [4, 5, 12, 13, 20, 21, 28, 29];

  if (anteriors.includes(toothId)) {
    type = "anterior";
  } else if (premolars.includes(toothId)) {
    type = "premolar";
  } else {
    type = "molar";
  }

  const isFilled = (name: string) => activeCanals.some((c) => c.toLowerCase() === name.toLowerCase());

  if (type === "anterior") {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card/50 h-full min-h-[300px]">
        <span className="text-sm font-bold text-muted-foreground mb-2">Anatomy: Anterior Tooth</span>
        <svg viewBox="0 0 100 200" className="w-full max-h-[220px] drop-shadow-md">
          {/* Tooth Crown Outline */}
          <path d="M 30,70 C 30,30 70,30 70,70 C 70,120 55,180 50,185 C 45,180 30,120 30,70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          {/* Dentin Layer */}
          <path d="M 34,70 C 34,38 66,38 66,70 C 66,110 54,165 50,170 C 46,165 34,110 34,70 Z" fill="#fef08a" opacity="0.3" stroke="#eab308" strokeWidth="0.5" />
          {/* Pulp Chamber */}
          <path d="M 45,70 C 45,55 55,55 55,70 C 55,90 52,110 50,120 C 48,110 45,90 45,70 Z" fill="#fda4af" opacity="0.8" />
          {/* Root Canal Path */}
          <path 
            d="M 50,70 L 50,178" 
            stroke={activeCanals.length > 0 ? "#ef4444" : "#f43f5e"} 
            strokeWidth={activeCanals.length > 0 ? "4" : "1.5"} 
            strokeDasharray={activeCanals.length > 0 ? "none" : "2,2"}
            fill="none" 
            className="transition-all duration-300"
          />
        </svg>
        <span className="text-[10px] text-muted-foreground mt-2 text-center">Single canal highlighted in red when canals are defined</span>
      </div>
    );
  }

  if (type === "premolar") {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card/50 h-full min-h-[300px]">
        <span className="text-sm font-bold text-muted-foreground mb-2">Anatomy: Premolar Tooth</span>
        <svg viewBox="0 0 100 200" className="w-full max-h-[220px] drop-shadow-md">
          {/* Tooth Crown Outline */}
          <path d="M 25,60 C 25,25 75,25 75,60 C 75,100 70,130 65,180 C 60,180 52,130 50,110 C 48,130 40,180 35,180 C 30,130 25,100 25,60 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          {/* Dentin Layer */}
          <path d="M 29,60 C 29,32 71,32 71,60 C 71,90 66,120 61,165 C 57,165 52,125 50,108 C 48,125 43,165 39,165 C 34,120 29,90 29,60 Z" fill="#fef08a" opacity="0.3" stroke="#eab308" strokeWidth="0.5" />
          {/* Pulp Chamber */}
          <path d="M 40,60 C 40,45 60,45 60,60 C 60,80 55,95 50,100 C 45,95 40,80 40,60 Z" fill="#fda4af" opacity="0.8" />
          {/* Root Canals */}
          <path 
            d="M 45,65 Q 48,100 35,175" 
            stroke={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "#ef4444" : "#f43f5e"} 
            strokeWidth={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "3.5" : "1.5"} 
            strokeDasharray={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "none" : "2,2"}
            fill="none" 
            className="transition-all duration-300"
          />
          <path 
            d="M 55,65 Q 52,100 65,175" 
            stroke={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "#ef4444" : "#f43f5e"} 
            strokeWidth={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "3.5" : "1.5"} 
            strokeDasharray={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "none" : "2,2"}
            fill="none" 
            className="transition-all duration-300"
          />
        </svg>
        <span className="text-[10px] text-muted-foreground mt-2 text-center">Buccal & Palatal/Lingual canals</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card/50 h-full min-h-[300px]">
      <span className="text-sm font-bold text-muted-foreground mb-2">Anatomy: Molar Tooth</span>
      <svg viewBox="0 0 120 200" className="w-full max-h-[220px] drop-shadow-md">
        {/* Tooth Crown Outline */}
        <path d="M 20,55 C 20,20 100,20 100,55 C 100,90 95,120 90,180 C 85,180 78,130 75,110 C 72,135 65,190 60,190 C 55,190 48,135 45,110 C 42,130 35,180 30,180 C 25,120 20,90 20,55 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        {/* Dentin Layer */}
        <path d="M 24,55 C 24,28 96,28 96,55 C 96,80 91,110 86,165 C 81,165 75,125 72,108 C 69,128 64,175 60,175 C 56,175 51,128 48,108 C 45,125 39,165 34,165 C 29,110 24,80 24,55 Z" fill="#fef08a" opacity="0.3" stroke="#eab308" strokeWidth="0.5" />
        {/* Pulp Chamber */}
        <path d="M 35,55 C 35,38 85,38 85,55 C 85,75 75,95 60,98 C 45,95 35,75 35,55 Z" fill="#fda4af" opacity="0.8" />
        {/* Mesio-Buccal Canal */}
        <path 
          d="M 45,60 Q 42,100 30,175" 
          stroke={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "#ef4444" : "#f43f5e"} 
          strokeWidth={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "3.5" : "1.5"} 
          strokeDasharray={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "none" : "2,2"}
          fill="none" 
          className="transition-all duration-300"
        />
        {/* Mesio-Lingual / Disto-Buccal Canal */}
        <path 
          d="M 60,60 L 60,185" 
          stroke={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "#ef4444" : "#f43f5e"} 
          strokeWidth={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "3.5" : "1.5"} 
          strokeDasharray={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "none" : "2,2"}
          fill="none" 
          className="transition-all duration-300"
        />
        {/* Distal / Palatal Canal */}
        <path 
          d="M 75,60 Q 78,100 90,175" 
          stroke={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "#ef4444" : "#f43f5e"} 
          strokeWidth={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "3.5" : "1.5"} 
          strokeDasharray={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "none" : "2,2"}
          fill="none" 
          className="transition-all duration-300"
        />
      </svg>
      <span className="text-[10px] text-muted-foreground mt-2 text-center">Multi-rooted molar canal pathways</span>
    </div>
  );
}

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
  const watchToothId = watch("toothId");
  const watchCanals = watch("canals") || [];
  const activeCanalNames = watchCanals.map((c) => c.name).filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Endodontic Record" : "Add Endodontic Record"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column - Tooth Anatomy Visual Representation */}
          <div className="md:col-span-4 h-full flex flex-col justify-between">
            <ToothAnatomy toothId={Number(watchToothId || 1)} activeCanals={activeCanalNames} />
          </div>

          {/* Right Column - Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-8 space-y-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
