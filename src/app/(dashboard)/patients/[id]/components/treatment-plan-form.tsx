"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Trash2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  FileText,
  MousePointerClick,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Treatment, DentalCondition, SystemTreatment, Employee } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { getTreatments, getDoctors } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { Badge } from "@/components/ui/badge";

const VALID_CONDITIONS: DentalCondition[] = [
  "Healthy",
  "Caries",
  "Filling",
  "Crown",
  "Missing",
  "Fracture",
  "Implant",
  "Bridge",
  "Retained Root",
  "Malocclusion",
  "Generalized Calculus",
];

const UR_TEETH = [18, 17, 16, 15, 14, 13, 12, 11];
const UL_TEETH = [21, 22, 23, 24, 25, 26, 27, 28];
const LR_TEETH = [48, 47, 46, 45, 44, 43, 42, 41];
const LL_TEETH = [31, 32, 33, 34, 35, 36, 37, 38];
const ALL_TEETH = [...UR_TEETH, ...UL_TEETH, ...LR_TEETH, ...LL_TEETH];

function getFriendlyToothName(tooth?: number | null): string {
  if (tooth === null || tooth === undefined) return "General / Full Mouth (No Tooth #)";
  switch (tooth) {
    case 18: return "Upper Right 3rd Molar (Wisdom)";
    case 17: return "Upper Right 2nd Molar";
    case 16: return "Upper Right 1st Molar";
    case 15: return "Upper Right 2nd Premolar";
    case 14: return "Upper Right 1st Premolar";
    case 13: return "Upper Right Canine";
    case 12: return "Upper Right Lateral Incisor";
    case 11: return "Upper Right Central Incisor";
    case 21: return "Upper Left Central Incisor";
    case 22: return "Upper Left Lateral Incisor";
    case 23: return "Upper Left Canine";
    case 24: return "Upper Left 1st Premolar";
    case 25: return "Upper Left 2nd Premolar";
    case 26: return "Upper Left 1st Molar";
    case 27: return "Upper Left 2nd Molar";
    case 28: return "Upper Left 3rd Molar (Wisdom)";
    case 48: return "Lower Right 3rd Molar (Wisdom)";
    case 47: return "Lower Right 2nd Molar";
    case 46: return "Lower Right 1st Molar";
    case 45: return "Lower Right 2nd Premolar";
    case 44: return "Lower Right 1st Premolar";
    case 43: return "Lower Right Canine";
    case 42: return "Lower Right Lateral Incisor";
    case 41: return "Lower Right Central Incisor";
    case 31: return "Lower Left Central Incisor";
    case 32: return "Lower Left Lateral Incisor";
    case 33: return "Lower Left Canine";
    case 34: return "Lower Left 1st Premolar";
    case 35: return "Lower Left 2nd Premolar";
    case 36: return "Lower Left 1st Molar";
    case 37: return "Lower Left 2nd Molar";
    case 38: return "Lower Left 3rd Molar (Wisdom)";
    default: return `Tooth #${tooth}`;
  }
}

const POPULAR_PROCEDURES = [
  { name: "Composite Filling", label: "Filling", defaultCost: 250 },
  { name: "Tooth Extraction", label: "Extraction", defaultCost: 300 },
  { name: "Root Canal Treatment", label: "Root Canal", defaultCost: 1500 },
  { name: "Dental Crown (Porcelain/Ceramic)", label: "Crown", defaultCost: 1200 },
  { name: "Regular Checkup & Cleaning", label: "Cleaning", defaultCost: 75 },
  { name: "Teeth Whitening", label: "Whitening", defaultCost: 450 },
];

export interface TreatmentDraftItem {
  id: string;
  tooth?: number | null;
  procedureId?: string;
  procedure: string;
  cost: number;
  condition?: DentalCondition;
  notes?: string;
  showNotes?: boolean;
}

type TreatmentPlanFormProps = {
  treatment?: Treatment;
  onSave: (data: Omit<Treatment, "id" | "date">, condition?: DentalCondition) => void;
  onSaveBatch?: (items: Array<{ data: Omit<Treatment, "id" | "date">; condition?: DentalCondition }>) => void;
  onOpenChange: (open: boolean) => void;
  toothId?: number;
  currentCondition?: DentalCondition | string;
};

export function TreatmentPlanForm({
  treatment,
  onSave,
  onSaveBatch,
  onOpenChange,
  toothId,
  currentCondition,
}: TreatmentPlanFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [status, setStatus] = useState<"Proposed" | "In Progress" | "Completed" | "Cancelled">("Proposed");

  const isEditing = Boolean(treatment);

  const [items, setItems] = useState<TreatmentDraftItem[]>(() => {
    if (treatment) {
      return [
        {
          id: String(treatment.id || Math.random()),
          tooth: treatment.tooth,
          procedureId: treatment.procedureId ? String(treatment.procedureId) : undefined,
          procedure: treatment.procedure || "",
          cost: treatment.totalCost ?? treatment.cost ?? 0,
          condition: ((treatment as any).condition as DentalCondition) || (currentCondition as DentalCondition),
          notes: (treatment as any).notes || "",
          showNotes: Boolean((treatment as any).notes || (treatment as any).condition),
        },
      ];
    }
    return [
      {
        id: Math.random().toString(36).substring(2, 9),
        tooth: toothId ?? null,
        procedure: "",
        cost: 0,
        condition: (currentCondition as DentalCondition) || undefined,
        notes: "",
        showNotes: false,
      },
    ];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, dData] = await Promise.all([getTreatments(), getDoctors()]);
        setSystemTreatments(tData);
        setDoctors(dData);

        if (treatment) {
          const docId = String(treatment.doctorId || treatment.doctor_id || "");
          if (docId) setSelectedDoctorId(docId);
          if (treatment.status) setStatus(treatment.status as any);
        } else {
          const user = getCurrentUser();
          if ((user as any)?.id) {
            const userDoc = dData.find((d) => String(d.id) === String((user as any).id));
            if (userDoc) {
              setSelectedDoctorId(String(userDoc.id));
            } else if (dData.length === 1) {
              setSelectedDoctorId(String(dData[0].id));
            }
          } else if (dData.length === 1) {
            setSelectedDoctorId(String(dData[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch treatments or doctors:", err);
      }
    };
    fetchData();
  }, [treatment]);

  // Procedure options for Combobox
  const procedureOptions = useMemo(() => {
    return systemTreatments.map((st) => ({
      value: String(st.id),
      label: `${st.procedure}${st.cost ? ` • $${Number(st.cost).toFixed(2)}` : ""}`,
      category: st.category || "General Procedures",
    }));
  }, [systemTreatments]);

  // Total running cost
  const totalCost = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
  }, [items]);

  const handleApplyQuickProcedure = (itemIndex: number, popName: string, defaultCost: number) => {
    const matched = systemTreatments.find((t) =>
      t.procedure.toLowerCase().includes(popName.toLowerCase())
    );

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        return {
          ...it,
          procedureId: matched ? String(matched.id) : undefined,
          procedure: matched ? matched.procedure : popName,
          cost: matched && matched.cost ? Number(matched.cost) || defaultCost : defaultCost,
        };
      })
    );
  };

  const handleProcedureSelect = (itemIndex: number, procedureIdVal: string) => {
    const matched = systemTreatments.find((t) => String(t.id) === String(procedureIdVal));
    if (!matched) return;

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        return {
          ...it,
          procedureId: String(matched.id),
          procedure: matched.procedure,
          cost: matched.cost ? Number(matched.cost) || 0 : it.cost,
        };
      })
    );
  };

  const handleToothBoxClick = (toothNum: number) => {
    const assignedIndex = items.findIndex((it) => it.tooth === toothNum);

    if (assignedIndex !== -1) {
      if (items.length > 1) {
        setItems((prev) => prev.filter((_, idx) => idx !== assignedIndex));
      } else {
        setItems((prev) =>
          prev.map((it, idx) => (idx === 0 ? { ...it, tooth: null } : it))
        );
      }
    } else {
      if (items.length === 1 && items[0].tooth === null && !items[0].procedure) {
        setItems((prev) =>
          prev.map((it, idx) => (idx === 0 ? { ...it, tooth: toothNum } : it))
        );
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            tooth: toothNum,
            procedure: "",
            cost: 0,
            showNotes: false,
          },
        ]);
      }
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        tooth: null,
        procedure: "",
        cost: 0,
        showNotes: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctorId) {
      toast({
        title: "Doctor Required",
        description: "Please assign an attending doctor for this treatment plan.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].procedure || items[i].procedure.trim() === "") {
        toast({
          title: "Procedure Required",
          description: `Please select or enter a procedure for Item #${i + 1}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedDoctor = doctors.find((d) => String(d.id) === String(selectedDoctorId));
      const doctorNameVal = selectedDoctor?.name || treatment?.doctorName || treatment?.doctor_name || "";

      if (isEditing) {
        const item = items[0];
        onSave(
          ({

            procedureId: item.procedureId || "",
            procedure: item.procedure,
            tooth: item.tooth ?? undefined,
            status: status,
            cost: Number(item.cost) || 0,
            totalCost: Number(item.cost) || 0,
            total_cost: Number(item.cost) || 0,
            doctorId: selectedDoctorId,
            doctor_id: selectedDoctorId,
            doctorName: doctorNameVal,
            doctor_name: doctorNameVal,
            notes: item.notes?.trim() || undefined,
            condition: item.condition,
            doctor: selectedDoctor
              ? {
                  id: selectedDoctor.id,
                  name: selectedDoctor.name,
                  role: selectedDoctor.role,
                  avatar: selectedDoctor.avatar,
                }
              : undefined,
          } as any),
          item.condition
        );
        onOpenChange(false);
      } else {
        const mappedItems = items.map((it) => ({
          data: {
            procedureId: it.procedureId || "",
            procedure: it.procedure,
            tooth: it.tooth ?? undefined,
            status: status,
            cost: Number(it.cost) || 0,
            totalCost: Number(it.cost) || 0,
            total_cost: Number(it.cost) || 0,
            doctorId: selectedDoctorId,
            doctor_id: selectedDoctorId,
            doctorName: doctorNameVal,
            doctor_name: doctorNameVal,
            notes: it.notes?.trim() || undefined,
            condition: it.condition,
            doctor: selectedDoctor
              ? {
                  id: selectedDoctor.id,
                  name: selectedDoctor.name,
                  role: selectedDoctor.role,
                  avatar: selectedDoctor.avatar,
                }
              : undefined,
          },
          condition: it.condition,
        }));

        if (onSaveBatch) {
          onSaveBatch(mappedItems);
        } else {
          for (const m of mappedItems) {
            onSave(m.data, m.condition);
          }
        }
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save treatment plan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-slate-50/60 dark:bg-slate-900/40">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-teal-600/10 text-teal-700 dark:text-teal-400">
              <Stethoscope className="h-5 w-5" />
            </span>
            {isEditing ? "Edit Treatment Plan" : "Add Treatment Plan"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Update tooth number, procedure name, or treatment fee"
              : "Select tooth number, choose procedure, and save — clean & simple!"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* META BAR: Doctor & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Attending Doctor <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={doctors.map((d) => ({
                    value: String(d.id),
                    label: `Dr. ${d.name}${d.role ? ` (${d.role})` : ""}`,
                  }))}
                  value={selectedDoctorId}
                  onChange={(val) => setSelectedDoctorId(String(val))}
                  placeholder="Select doctor..."
                  searchPlaceholder="Search doctor..."
                  emptyMessage="No doctor found."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Treatment Status</Label>
                <Select
                  value={status}
                  onValueChange={(val: any) => setStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proposed">Proposed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* VISUAL TOOTH QUICK SELECTOR */}
            <div className="rounded-xl border p-3.5 bg-slate-50/40 dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Interactive Tooth Quick Selector
                  </span>
                  <span className="text-[11px] text-muted-foreground italic">
                    (Click any tooth to add below)
                  </span>
                </div>
                {items.some((it) => it.tooth !== null && it.tooth !== undefined) && (
                  <button
                    type="button"
                    onClick={() =>
                      setItems([
                        {
                          id: Math.random().toString(36).substring(2, 9),
                          tooth: null,
                          procedure: "",
                          cost: 0,
                          showNotes: false,
                        },
                      ])
                    }
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              {/* Upper Arch */}
              <div className="flex items-center justify-center gap-1 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-400 w-5 text-center">UR</span>
                {UR_TEETH.map((t) => {
                  const isAssigned = items.some((it) => it.tooth === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      title={`Tooth #${t} • ${getFriendlyToothName(t)}`}
                      onClick={() => handleToothBoxClick(t)}
                      className={`w-7 h-7 rounded text-[11px] font-bold transition-all border ${
                        isAssigned
                          ? "bg-teal-600 border-teal-700 text-white shadow-sm scale-105"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
                <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700 mx-1" />
                {UL_TEETH.map((t) => {
                  const isAssigned = items.some((it) => it.tooth === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      title={`Tooth #${t} • ${getFriendlyToothName(t)}`}
                      onClick={() => handleToothBoxClick(t)}
                      className={`w-7 h-7 rounded text-[11px] font-bold transition-all border ${
                        isAssigned
                          ? "bg-teal-600 border-teal-700 text-white shadow-sm scale-105"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
                <span className="text-[10px] font-bold text-slate-400 w-5 text-center">UL</span>
              </div>

              {/* Lower Arch */}
              <div className="flex items-center justify-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 w-5 text-center">LR</span>
                {LR_TEETH.map((t) => {
                  const isAssigned = items.some((it) => it.tooth === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      title={`Tooth #${t} • ${getFriendlyToothName(t)}`}
                      onClick={() => handleToothBoxClick(t)}
                      className={`w-7 h-7 rounded text-[11px] font-bold transition-all border ${
                        isAssigned
                          ? "bg-teal-600 border-teal-700 text-white shadow-sm scale-105"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
                <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700 mx-1" />
                {LL_TEETH.map((t) => {
                  const isAssigned = items.some((it) => it.tooth === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      title={`Tooth #${t} • ${getFriendlyToothName(t)}`}
                      onClick={() => handleToothBoxClick(t)}
                      className={`w-7 h-7 rounded text-[11px] font-bold transition-all border ${
                        isAssigned
                          ? "bg-teal-600 border-teal-700 text-white shadow-sm scale-105"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
                <span className="text-[10px] font-bold text-slate-400 w-5 text-center">LL</span>
              </div>
            </div>

            {/* PROCEDURES LIST HEADER */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Procedures by Tooth ({items.length})
              </span>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-8 text-xs font-semibold text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Another Tooth
                </Button>
              )}
            </div>

            {/* DYNAMIC ITEM CARDS */}
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className={`rounded-xl border p-3.5 transition-all space-y-3 bg-white dark:bg-slate-900 shadow-sm ${
                    it.tooth
                      ? "border-teal-500/50 dark:border-teal-500/40"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Card Header: Item Badge + Tooth Dropdown + Delete */}
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300">
                      Item #{idx + 1}
                    </span>

                    <div className="flex-1">
                      <Select
                        value={it.tooth !== null && it.tooth !== undefined ? String(it.tooth) : "general"}
                        onValueChange={(val) => {
                          const newTooth = val === "general" ? null : Number(val);
                          setItems((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, tooth: newTooth } : item))
                          );
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs font-medium bg-slate-50/60 dark:bg-slate-800/40">
                          <SelectValue placeholder="Select tooth..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="general">
                            General / Full Mouth (No Tooth #)
                          </SelectItem>
                          {ALL_TEETH.map((t) => (
                            <SelectItem key={t} value={String(t)}>
                              Tooth #{t} • {getFriendlyToothName(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Procedure Combobox & Cost Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    <div className="sm:col-span-8 space-y-1.5">
                      <Combobox
                        options={procedureOptions}
                        value={it.procedureId || ""}
                        onChange={(val) => handleProcedureSelect(idx, String(val))}
                        placeholder="Search procedure (e.g. Filling, Extraction)..."
                        searchPlaceholder="Type procedure name or code..."
                        emptyMessage="No procedure found."
                      />

                      {/* Quick Pick Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Quick:
                        </span>
                        {POPULAR_PROCEDURES.map((pop) => (
                          <button
                            key={pop.label}
                            type="button"
                            onClick={() => handleApplyQuickProcedure(idx, pop.name, pop.defaultCost)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                              it.procedure.toLowerCase().includes(pop.label.toLowerCase())
                                ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400"
                            }`}
                          >
                            {pop.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.cost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, cost: val } : item))
                            );
                          }}
                          placeholder="0.00"
                          className="pl-7 h-9 text-xs font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, showNotes: !item.showNotes } : item
                            )
                          )
                        }
                        className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 pt-0.5"
                      >
                        {it.showNotes ? (
                          <>
                            <ChevronUp className="h-3 w-3" /> Hide Notes
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" /> + Add Note / Condition
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Optional Condition & Notes */}
                  {it.showNotes && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-dashed">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">
                          Tooth Condition (optional)
                        </Label>
                        <Select
                          value={it.condition || "none"}
                          onValueChange={(val) => {
                            const c = val === "none" ? undefined : (val as DentalCondition);
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, condition: c } : item))
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Condition (e.g. Caries)..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {VALID_CONDITIONS.map((cond) => (
                              <SelectItem key={cond} value={cond}>
                                {cond}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">
                          Clinical Instructions / Notes
                        </Label>
                        <Input
                          value={it.notes || ""}
                          onChange={(e) => {
                            const n = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, notes: n } : item))
                            );
                          }}
                          placeholder="Special instructions or findings..."
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* BIG PROMINENT "+ ADD ANOTHER TOOTH & PROCEDURE" BUTTON */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-teal-500/40 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                + Add Another Tooth & Procedure
              </button>
            )}
          </div>

          {/* FOOTER: Live Running Total & Actions */}
          <DialogFooter className="px-6 py-3.5 border-t bg-slate-50/70 dark:bg-slate-900/50 flex flex-row items-center justify-between sm:justify-between">
            <div className="text-left">
              <span className="text-[11px] text-muted-foreground block font-medium">
                Total Estimated Amount:
              </span>
              <span className="text-base font-extrabold text-teal-700 dark:text-teal-400">
                ${totalCost.toFixed(2)}{" "}
                <span className="text-xs font-semibold text-muted-foreground">
                  ({items.length} {items.length === 1 ? "procedure" : "procedures"})
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing
                  ? "Save Changes"
                  : items.length > 1
                  ? `Save All Treatments (${items.length})`
                  : "Save Treatment"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
