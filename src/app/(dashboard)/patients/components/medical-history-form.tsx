"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createMedicalHistory, updateMedicalHistory } from "@/lib/api";
import type { MedicalHistory, Patient } from "@/lib/types";
import {
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Activity,
  Stethoscope,
  ShieldCheck,
  ClipboardList,
  Loader2,
  Printer,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export interface PatientBasicInfo {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  gender?: string;
  age?: number | string;
  dateOfBirth?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  branch_id?: string | number;
}

interface MedicalHistoryFormProps {
  patient: PatientBasicInfo;
  initialData?: MedicalHistory | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (record: MedicalHistory) => void;
}

const COMMON_CHIEF_COMPLAINTS = [
  "Severe throbbing toothache",
  "Routine dental checkup & cleaning",
  "Bleeding & swollen gums",
  "Broken / chipped tooth",
  "Sensitivity to hot and cold",
  "Missing teeth replacement",
  "Jaw pain / TMJ clicking",
  "Aesthetic & smile makeover inquiry",
];

export function MedicalHistoryForm({
  patient,
  initialData,
  isOpen,
  onOpenChange,
  onSuccess,
}: MedicalHistoryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState<string>(
    initialData?.date || format(new Date(), "yyyy-MM-dd")
  );
  const [doctorName, setDoctorName] = useState<string>(
    initialData?.doctor_name || ""
  );
  const [chiefComplaint, setChiefComplaint] = useState<string>(
    initialData?.chief_complaint || ""
  );
  const [historyComplaint, setHistoryComplaint] = useState<string>(
    initialData?.history_complaint || ""
  );
  const [extraOralExam, setExtraOralExam] = useState<string>(
    initialData?.extra_oral_exam || ""
  );
  const [intraOralExam, setIntraOralExam] = useState<string>(
    initialData?.intra_oral_exam || ""
  );
  const [diagnosis, setDiagnosis] = useState<string>(
    initialData?.diagnosis || ""
  );
  const [treatmentPlan, setTreatmentPlan] = useState<string>(
    initialData?.treatment_plan || ""
  );
  const [treatmentGiven, setTreatmentGiven] = useState<string>(
    initialData?.treatment_given || ""
  );
  const [treatmentNote, setTreatmentNote] = useState<string>(
    initialData?.treatment_note || ""
  );
  const [consent, setConsent] = useState<boolean>(
    initialData?.consent ?? true
  );
  const [consentNotes, setConsentNotes] = useState<string>(
    initialData?.consent_notes || "Patient informed of findings, proposed treatment, risks, and alternatives."
  );

  // Auto-calculated age
  const calculatedAge = React.useMemo(() => {
    if (patient.age !== undefined && patient.age !== null && patient.age !== "") {
      return String(patient.age);
    }
    if (patient.dateOfBirth) {
      try {
        const dob = parseISO(patient.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          const diffMs = Date.now() - dob.getTime();
          const ageDt = new Date(diffMs);
          return String(Math.abs(ageDt.getUTCFullYear() - 1970));
        }
      } catch {
        // ignore
      }
    }
    return "N/A";
  }, [patient.age, patient.dateOfBirth]);

  const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Patient";

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date ? String(initialData.date).split("T")[0] : format(new Date(), "yyyy-MM-dd"));
      setDoctorName(initialData.doctor_name || "");
      setChiefComplaint(initialData.chief_complaint || "");
      setHistoryComplaint(initialData.history_complaint || "");
      setExtraOralExam(initialData.extra_oral_exam || "");
      setIntraOralExam(initialData.intra_oral_exam || "");
      setDiagnosis(initialData.diagnosis || "");
      setTreatmentPlan(initialData.treatment_plan || "");
      setTreatmentGiven(initialData.treatment_given || "");
      setTreatmentNote(initialData.treatment_note || "");
      setConsent(initialData.consent ?? true);
      setConsentNotes(initialData.consent_notes || "Patient informed of findings, proposed treatment, risks, and alternatives.");
    } else {
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDoctorName("");
      setChiefComplaint("");
      setHistoryComplaint("");
      setExtraOralExam("");
      setIntraOralExam("");
      setDiagnosis("");
      setTreatmentPlan("");
      setTreatmentGiven("");
      setTreatmentNote("");
      setConsent(true);
      setConsentNotes("Patient informed of findings, proposed treatment, risks, and alternatives.");
    }
  }, [initialData, isOpen]);

  const handleApplyChiefComplaint = (complaint: string) => {
    if (!chiefComplaint.trim()) {
      setChiefComplaint(complaint);
    } else {
      setChiefComplaint((prev) => `${prev}; ${complaint}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter the Chief Complaint.",
        variant: "destructive",
      });
      return;
    }

    if (!patient.id) {
      // Draft mode (e.g. creating patient for the first time)
      const draftRecord: MedicalHistory = {
        id: `draft_${Date.now()}`,
        date,
        chief_complaint: chiefComplaint,
        history_complaint: historyComplaint,
        extra_oral_exam: extraOralExam,
        intra_oral_exam: intraOralExam,
        diagnosis,
        treatment_plan: treatmentPlan,
        treatment_given: treatmentGiven,
        consent,
        consent_notes: consentNotes,
        treatment_note: treatmentNote,
        doctor_name: doctorName,
      };
      if (onSuccess) {
        onSuccess(draftRecord);
      }
      toast({
        title: "Medical Form Attached",
        description: "Clinical case record details captured for this patient.",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<MedicalHistory, "id"> = {
        patient_id: patient.id,
        patientId: patient.id,
        date,
        chief_complaint: chiefComplaint,
        history_complaint: historyComplaint,
        extra_oral_exam: extraOralExam,
        intra_oral_exam: intraOralExam,
        diagnosis,
        treatment_plan: treatmentPlan,
        treatment_given: treatmentGiven,
        consent,
        consent_notes: consentNotes,
        treatment_note: treatmentNote,
        doctor_name: doctorName,
      };

      let saved: MedicalHistory;
      if (initialData?.id && !String(initialData.id).startsWith("draft_")) {
        saved = await updateMedicalHistory(initialData.id, patient.id, payload);
        toast({
          title: "Medical History Updated",
          description: "Patient medical and dental record updated successfully.",
        });
      } else {
        saved = await createMedicalHistory(patient.id, payload);
        toast({
          title: "Medical History Saved",
          description: "New clinical case sheet recorded successfully.",
        });
      }

      if (onSuccess) {
        onSuccess(saved);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save medical history record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2 border-b bg-gradient-to-r from-teal-50/60 to-blue-50/60 dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {initialData?.id ? "Edit Medical & Dental Case Record" : "New Medical & Dental Case Record"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Comprehensive clinical assessment, oral examination, diagnosis, and treatment plan.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1 font-mono text-xs border-teal-300 text-teal-700 dark:text-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40">
              {initialData?.id ? `Record #${initialData.id}` : "Clinical Case Form"}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* AUTO-FILLED PATIENT DEMOGRAPHICS HEADER */}
          <div className="rounded-xl border border-border/80 bg-slate-50/70 dark:bg-slate-900/40 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-600" /> Patient Demographics (Auto-filled)
              </span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded font-medium">
                Auto-linked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Patient Name</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{fullName}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Sex / Gender</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {patient.gender || "Unspecified"}
                  </Badge>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Age</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {calculatedAge} <span className="text-xs text-muted-foreground font-normal">years</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Contact</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1 truncate">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  {patient.phone || patient.email || "No contact"}
                </p>
              </div>
            </div>

            {/* Visit Meta (Date & Attending Doctor) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-border/60">
              <div className="space-y-1.5">
                <Label htmlFor="record_date" className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Examination Date
                </Label>
                <Input
                  id="record_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctor_name" className="text-xs font-medium flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" /> Attending Dentist / Clinician
                </Label>
                <Input
                  id="doctor_name"
                  placeholder="e.g., Dr. Sarah Mukasa, BDS"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 1: CHIEF COMPLAINT & PRESENT ILLNESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Activity className="h-4 w-4 text-teal-600" />
                1. Chief Complaint (Patient&apos;s own words) <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">Click common presets below to quick-fill</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {COMMON_CHIEF_COMPLAINTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleApplyChiefComplaint(item)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  + {item}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Describe the primary reason for patient's dental visit (e.g., Severe throbbing pain in lower right molar for 3 days, exacerbated by chewing and cold drinks)..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
              className="resize-none"
              required
            />

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="history_complaint" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                History of Present Complaint / Illness
              </Label>
              <Textarea
                id="history_complaint"
                placeholder="Onset, duration, frequency, character of pain, aggravating / relieving factors, radiation, previous dental treatment and history of present illness..."
                value={historyComplaint}
                onChange={(e) => setHistoryComplaint(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* SECTION 2: ORAL EXAMINATION (EXTRA & INTRA ORAL) */}
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              2. Clinical Oral Examination
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 rounded-lg border p-3.5 bg-slate-50/40 dark:bg-slate-900/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="extra_oral_exam" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Extra-Oral Examination
                  </Label>
                  <span className="text-[10px] text-muted-foreground">TMJ, Lymph nodes, Facial symmetry</span>
                </div>
                <Textarea
                  id="extra_oral_exam"
                  placeholder="Record findings on facial symmetry, swellings, lymphadenopathy, TMJ tenderness, clicking, mouth opening range, lips..."
                  value={extraOralExam}
                  onChange={(e) => setExtraOralExam(e.target.value)}
                  rows={3}
                  className="resize-none text-sm bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5 rounded-lg border p-3.5 bg-slate-50/40 dark:bg-slate-900/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="intra_oral_exam" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Intra-Oral Examination
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Mucosa, Gingiva, Teeth, Tongue</span>
                </div>
                <Textarea
                  id="intra_oral_exam"
                  placeholder="Record findings on oral hygiene, gingival status, calculus, periodontal pockets, soft tissue lesions, tongue, palate, dentition, occlusion..."
                  value={intraOralExam}
                  onChange={(e) => setIntraOralExam(e.target.value)}
                  rows={3}
                  className="resize-none text-sm bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 3: DIAGNOSIS & TREATMENT MANAGEMENT */}
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <ClipboardList className="h-4 w-4 text-teal-600" />
              3. Diagnosis & Treatment Management
            </Label>

            <div className="space-y-1.5">
              <Label htmlFor="diagnosis" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Diagnosis (Provisional / Final)
              </Label>
              <Input
                id="diagnosis"
                placeholder="e.g., Acute Irreversible Pulpitis #46 with Symptomatic Apical Periodontitis; Generalized Chronic Gingivitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="treatment_plan" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Treatment Plan (Proposed Care)
                </Label>
                <Textarea
                  id="treatment_plan"
                  placeholder="Outline sequenced treatment plan (e.g., 1. RCT tooth #46; 2. Core build-up & PFM crown; 3. Ultrasonic scaling & prophylaxis)..."
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="treatment_given" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Treatment Given (Procedures Rendered Today)
                </Label>
                <Textarea
                  id="treatment_given"
                  placeholder="Describe treatment performed during this visit (e.g., Local anesthesia 2% lignocaine with adrenaline given; Access cavity prepared #46; Pulp extirpated; Working length established)..."
                  value={treatmentGiven}
                  onChange={(e) => setTreatmentGiven(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 4: TREATMENT NOTES & INFORMED CONSENT */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="treatment_note" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Treatment Notes & Post-Op Recommendations
              </Label>
              <Textarea
                id="treatment_note"
                placeholder="Special observations, medication prescribed, home care instructions given, next appointment goals, recall date..."
                value={treatmentNote}
                onChange={(e) => setTreatmentNote(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Informed Consent Card */}
            <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent_checkbox"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(!!checked)}
                  className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="consent_checkbox"
                    className="text-sm font-semibold leading-none cursor-pointer text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> Informed Consent Confirmed
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Patient or legal guardian has been informed of findings, diagnosis, treatment options, potential risks, and has given consent.
                  </p>
                </div>
              </div>

              {consent && (
                <div className="pt-1">
                  <Input
                    placeholder="Consent notes / details (e.g., Signed consent form on file; verbal consent obtained in presence of chaperone)..."
                    value={consentNotes}
                    onChange={(e) => setConsentNotes(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-800"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : initialData?.id ? (
                "Update Medical History"
              ) : (
                "Save Medical History"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
