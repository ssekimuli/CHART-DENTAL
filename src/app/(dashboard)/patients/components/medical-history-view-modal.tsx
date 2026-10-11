"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MedicalHistory } from "@/lib/types";
import { type PatientBasicInfo } from "./medical-history-form";
import {
  Printer,
  ShieldCheck,
  Stethoscope,
  Activity,
  ClipboardList,
  Calendar,
  User,
  Phone,
  Building2,
  FileText,
} from "lucide-react";
import moment from "moment";

interface MedicalHistoryViewModalProps {
  patient: PatientBasicInfo;
  record: MedicalHistory | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (record: MedicalHistory) => void;
}

export function MedicalHistoryViewModal({
  patient,
  record,
  isOpen,
  onOpenChange,
  onEdit,
}: MedicalHistoryViewModalProps) {
  if (!record) return null;

  const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Patient";

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = record.date ? moment(record.date).format("MMMM DD, YYYY") : "Undated";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-w-full">
        {/* PRINTABLE CASE SHEET WRAPPER */}
        <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:p-0">
          {/* HEADER / CLINIC WATERMARK */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-teal-600 dark:text-teal-400">
                  DENTAL & MEDICAL CASE RECORD
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clinical Examination, Assessment & Management Sheet
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 border-teal-300 text-teal-700 dark:text-teal-400">
                Record #{record.id || "N/A"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                <Calendar className="h-3 w-3" /> {formattedDate}
              </p>
            </div>
          </div>

          {/* PATIENT INFO BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Patient Name</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{fullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Sex / Gender</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.gender || "Unspecified"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Age</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.age || "N/A"} years
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.phone || patient.email || "N/A"}
              </span>
            </div>
          </div>

          {/* DOCTOR IN CHARGE */}
          {record.doctor_name && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
              <span>Attending Clinician: <strong className="text-slate-800 dark:text-slate-200">{record.doctor_name}</strong></span>
            </div>
          )}

          {/* CHIEF COMPLAINT */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> 1. Chief Complaint
            </h4>
            <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-sm">
              {record.chief_complaint || "None recorded"}
            </div>
          </div>

          {/* HISTORY OF PRESENT COMPLAINT */}
          {record.history_complaint && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                History of Present Complaint / Illness
              </h4>
              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-sm whitespace-pre-wrap">
                {record.history_complaint}
              </div>
            </div>
          )}

          {/* ORAL EXAMINATION */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> 2. Clinical Oral Examination
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-1">
                <span className="font-bold block text-slate-800 dark:text-slate-200">Extra-Oral Findings:</span>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {record.extra_oral_exam || "No abnormalities detected (NAD)"}
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-1">
                <span className="font-bold block text-slate-800 dark:text-slate-200">Intra-Oral Findings:</span>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {record.intra_oral_exam || "No abnormalities detected (NAD)"}
                </p>
              </div>
            </div>
          </div>

          {/* DIAGNOSIS */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> 3. Diagnosis
            </h4>
            <div className="p-3 rounded-lg border bg-teal-50/40 dark:bg-teal-950/20 text-sm font-semibold text-teal-950 dark:text-teal-100">
              {record.diagnosis || "Under evaluation"}
            </div>
          </div>

          {/* TREATMENT PLAN & TREATMENT GIVEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Proposed Treatment Plan
              </h4>
              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs whitespace-pre-wrap min-h-[70px]">
                {record.treatment_plan || "None documented"}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Treatment Given (Today)
              </h4>
              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs whitespace-pre-wrap min-h-[70px]">
                {record.treatment_given || "None rendered"}
              </div>
            </div>
          </div>

          {/* TREATMENT NOTE */}
          {record.treatment_note && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Clinical & Treatment Notes
              </h4>
              <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs whitespace-pre-wrap">
                {record.treatment_note}
              </div>
            </div>
          )}

          {/* CONSENT STAMP */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>
                Informed Consent:{" "}
                <strong className={record.consent ? "text-teal-700 dark:text-teal-400" : "text-amber-600"}>
                  {record.consent ? "Confirmed & Acknowledged" : "Pending"}
                </strong>
              </span>
            </div>
            {record.consent_notes && (
              <span className="text-[11px] text-muted-foreground italic">{record.consent_notes}</span>
            )}
          </div>

          {/* SIGNATURE SECTION (FOR PRINTING) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 border-t text-xs">
            <div className="space-y-6">
              <p className="text-muted-foreground">Patient / Guardian Signature:</p>
              <div className="border-b border-dashed border-slate-400 w-48"></div>
              <p className="text-[10px] text-muted-foreground">Date: ________________________</p>
            </div>
            <div className="space-y-6 text-right flex flex-col items-end">
              <p className="text-muted-foreground">Dentist Signature & Stamp:</p>
              <div className="border-b border-dashed border-slate-400 w-48"></div>
              <p className="text-[10px] text-muted-foreground">
                {record.doctor_name || "Authorized Clinician"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-slate-50/50 dark:bg-slate-900/40 print:hidden">
          <div className="flex items-center gap-2 mr-auto">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Case Sheet
            </Button>
            {record.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
                  window.open(`${backendBase}/medical-histories/${record.id}/print?print=1`, '_blank');
                }}
                className="border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/40"
              >
                <FileText className="mr-2 h-4 w-4" /> Official Template
              </Button>
            )}
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(record);
              }}
            >
              Edit Record
            </Button>
          )}
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
