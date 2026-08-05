"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
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

  const secondDigit = toothId % 10;

  if (secondDigit >= 1 && secondDigit <= 3) {
    type = "anterior";
  } else if (secondDigit >= 4 && secondDigit <= 5 && toothId < 50) {
    type = "premolar";
  } else {
    type = "molar";
  }

  const isFilled = (name: string) => activeCanals.some((c) => c.toLowerCase() === name.toLowerCase());

  if (type === "anterior") {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-slate-900 border-slate-800 text-slate-100 h-full min-h-[300px]">
        <span className="text-sm font-bold text-slate-200 mb-4">Tooth #{toothId} (Anterior)</span>
        
        {/* Relative wrapper holding both the real PNG image and the dynamic SVG canal overlay */}
        <div className="relative w-full max-w-[150px] aspect-[100/200] flex items-center justify-center">
          <img 
            src={`/teeth/${toothId}.png`} 
            alt={`Tooth ${toothId}`} 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          
          <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Overlay Single Root Canal Path */}
            <path 
              d="M 50,70 L 50,178" 
              stroke={activeCanals.length > 0 ? "#ef4444" : "#f43f5e"} 
              strokeWidth={activeCanals.length > 0 ? "4" : "1.5"} 
              strokeDasharray={activeCanals.length > 0 ? "none" : "2,2"}
              fill="none" 
              opacity="0.85"
              className="transition-all duration-300"
            />
          </svg>
        </div>
        <span className="text-[10px] text-slate-400 mt-4 text-center">Single canal highlighted in red when canals are defined</span>
      </div>
    );
  }

  if (type === "premolar") {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-slate-900 border-slate-800 text-slate-100 h-full min-h-[300px]">
        <span className="text-sm font-bold text-slate-200 mb-4">Tooth #{toothId} (Premolar)</span>
        
        <div className="relative w-full max-w-[150px] aspect-[100/200] flex items-center justify-center">
          <img 
            src={`/teeth/${toothId}.png`} 
            alt={`Tooth ${toothId}`} 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          
          <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Overlay Buccal Canal */}
            <path 
              d="M 45,65 Q 48,100 35,175" 
              stroke={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "#ef4444" : "#f43f5e"} 
              strokeWidth={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "3.5" : "1.5"} 
              strokeDasharray={isFilled("B") || isFilled("MB") || isFilled("M") || isFilled("Buccal") ? "none" : "2,2"}
              fill="none" 
              opacity="0.85"
              className="transition-all duration-300"
            />
            {/* Overlay Lingual/Palatal Canal */}
            <path 
              d="M 55,65 Q 52,100 65,175" 
              stroke={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "#ef4444" : "#f43f5e"} 
              strokeWidth={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "3.5" : "1.5"} 
              strokeDasharray={isFilled("L") || isFilled("P") || isFilled("D") || isFilled("DL") || isFilled("Palatal") || isFilled("Lingual") ? "none" : "2,2"}
              fill="none" 
              opacity="0.85"
              className="transition-all duration-300"
            />
          </svg>
        </div>
        <span className="text-[10px] text-slate-400 mt-4 text-center">Buccal & Palatal/Lingual canals</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-slate-900 border-slate-800 text-slate-100 h-full min-h-[300px]">
      <span className="text-sm font-bold text-slate-200 mb-4">Tooth #{toothId} (Molar)</span>
      
      <div className="relative w-full max-w-[150px] aspect-[120/200] flex items-center justify-center">
        <img 
          src={`/teeth/${toothId}.png`} 
          alt={`Tooth ${toothId}`} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        
        <svg viewBox="0 0 120 200" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Mesio-Buccal Canal */}
          <path 
            d="M 45,60 Q 42,100 30,175" 
            stroke={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "#ef4444" : "#f43f5e"} 
            strokeWidth={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "3.5" : "1.5"} 
            strokeDasharray={isFilled("MB") || isFilled("MB2") || isFilled("Mesial") ? "none" : "2,2"}
            fill="none" 
            opacity="0.85"
            className="transition-all duration-300"
          />
          {/* Mesio-Lingual / Disto-Buccal Canal */}
          <path 
            d="M 60,60 L 60,185" 
            stroke={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "#ef4444" : "#f43f5e"} 
            strokeWidth={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "3.5" : "1.5"} 
            strokeDasharray={isFilled("ML") || isFilled("DB") || isFilled("Buccal") ? "none" : "2,2"}
            fill="none" 
            opacity="0.85"
            className="transition-all duration-300"
          />
          {/* Distal / Palatal Canal */}
          <path 
            d="M 75,60 Q 78,100 90,175" 
            stroke={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "#ef4444" : "#f43f5e"} 
            strokeWidth={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "3.5" : "1.5"} 
            strokeDasharray={isFilled("D") || isFilled("P") || isFilled("DL") || isFilled("Distal") || isFilled("Palatal") ? "none" : "2,2"}
            fill="none" 
            opacity="0.85"
            className="transition-all duration-300"
          />
        </svg>
      </div>
      <span className="text-[10px] text-slate-400 mt-4 text-center">Multi-rooted molar canal pathways</span>
    </div>
  );
}

export function EndodonticRecordForm({
  isOpen,
  onClose,
  onSave,
  record,
}: EndodonticRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue, watch } = useForm<Omit<EndodonticRecord, "id" | "date">>({
    defaultValues: {
      toothId: 11,
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
        toothId: 11,
        pulpalDiagnosis: PULPAL_DIAGNOSES[0],
        periapicalDiagnosis: PERIAPICAL_DIAGNOSES[0],
        canals: [{ name: "MB", referencePoint: "Cusp Tip", workingLength: 21, fileSize: "#25", obturationSize: "#25/.04" }],
        obturationMaterial: "Gutta-Percha & Sealer",
        postType: "None",
        notes: "",
      });
    }
  }, [record, reset, isOpen]);

  const onSubmit = async (data: Omit<EndodonticRecord, "id" | "date">) => {
    await onSave({
      ...data,
      toothId: Number(data.toothId),
    });
  };

  const watchPulpal = watch("pulpalDiagnosis");
  const watchPeriapical = watch("periapicalDiagnosis");
  const watchToothId = watch("toothId");
  const watchCanals = watch("canals") || [];
  const activeCanalNames = watchCanals.map((c) => c.name).filter(Boolean);

  if (!isOpen) return null;

  return (
    <Card className="w-full shadow-lg border-muted">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-xl font-bold">
            {record ? "Edit Endodontic Record" : "Add Endodontic Record"}
          </CardTitle>
        </div>
        <div className="flex gap-2 items-center">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Records
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit"  form="endodontic-form" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {record ? "Save Changes" : "Save Record"}
      </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column - Tooth Anatomy Visual Representation with Real PNG background */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <ToothAnatomy toothId={Number(watchToothId || 1)} activeCanals={activeCanalNames} />
          </div>

          {/* Right Column - Form Fields */}
          <form id="endodontic-form" onSubmit={handleSubmit(onSubmit)} className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toothId">Tooth Number</Label>
                <Input
                  id="toothId"
                  type="number"
                  min={11}
                  max={85}
                  {...register("toothId", { required: true, min: 11, max: 85 })}
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

            {/* Buttons moved to top-right CardHeader */}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
