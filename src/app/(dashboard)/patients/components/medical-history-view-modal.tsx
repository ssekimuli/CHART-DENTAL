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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-w-full print:p-0">
        {/* PRINTABLE CASE SHEET WRAPPER */}
        <div className="p-6 md:p-8 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:p-0 print:text-black">
          {/* HEADER / CLINIC WATERMARK */}
          <div className="flex items-start justify-between pb-3 border-b-2 border-dashed border-slate-800 dark:border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-teal-700 dark:text-teal-400 print:text-black">
                  DENTAL & MEDICAL CASE RECORD
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 print:text-slate-600">
                Clinical Examination, Assessment & Management Sheet
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 print:text-black">
                RECORD #{record.id || "N/A"}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1 print:text-slate-600">
                <Calendar className="h-3 w-3" /> {formattedDate}
              </p>
            </div>
          </div>

          {/* PATIENT DEMOGRAPHICS (CLEAN DASHED LINES) */}
          <div className="space-y-2 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[220px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Patient Name:
                </span>
                <span className="flex-1 font-semibold text-sm border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {fullName}
                </span>
              </div>
              <div className="flex items-end gap-1.5 w-32">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Sex:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patient.gender || "Unspecified"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 w-24">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Age:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patient.age || "N/A"} yrs
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[220px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Contact / Tel:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patient.phone || patient.email || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[220px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Attending Doctor:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.doctor_name || "Authorized Clinician"}
                </span>
              </div>
            </div>
          </div>

          {/* 1. CHIEF COMPLAINT */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 print:text-black">
                1. Chief Complaint
              </span>
              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
            </div>
            <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-sm min-h-[26px]">
              {record.chief_complaint || "None recorded"}
            </div>
          </div>

          {/* HISTORY OF PRESENT COMPLAINT */}
          {record.history_complaint && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                  History of Present Complaint / Illness
                </span>
                <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-sm whitespace-pre-wrap min-h-[26px]">
                {record.history_complaint}
              </div>
            </div>
          )}

          {/* 2. ORAL EXAMINATION */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 print:text-black">
                2. Clinical Oral Examination
              </span>
              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Extra-Oral Findings:
                </span>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[26px]">
                  {record.extra_oral_exam || "No abnormalities detected (NAD)"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Intra-Oral Findings:
                </span>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[26px]">
                  {record.intra_oral_exam || "No abnormalities detected (NAD)"}
                </div>
              </div>
            </div>
          </div>

          {/* 3. DIAGNOSIS */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 print:text-black">
                3. Diagnosis
              </span>
              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
            </div>
            <div className="border-b border-dashed border-teal-500 pb-1.5 pt-0.5 text-sm font-semibold text-teal-900 dark:text-teal-200 print:text-black min-h-[26px]">
              {record.diagnosis || "Under evaluation"}
            </div>
          </div>

          {/* 4. TREATMENT MANAGEMENT */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                4. Treatment Management
              </span>
              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Proposed Treatment Plan:
                </span>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[46px]">
                  {record.treatment_plan || "None documented"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Treatment Given (Today):
                </span>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[46px]">
                  {record.treatment_given || "None rendered"}
                </div>
              </div>
            </div>
          </div>

          {/* 5. TREATMENT NOTE */}
          {record.treatment_note && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                  5. Clinical & Treatment Notes
                </span>
                <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[26px]">
                {record.treatment_note}
              </div>
            </div>
          )}

          {/* 6. CONSENT */}
          <div className="flex items-end gap-2 pt-1 pb-2 border-b border-dashed border-slate-400 dark:border-slate-600 text-xs">
            <span className="font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Informed Consent:
            </span>
            <span className="flex-1 font-semibold text-slate-900 dark:text-slate-100">
              {record.consent ? "Confirmed & Acknowledged" : "Pending"}
              {record.consent_notes && (
                <span className="font-normal italic text-slate-500 ml-2">&mdash; {record.consent_notes}</span>
              )}
            </span>
          </div>

          {/* 7. SIGNATURE SECTION (FOR PRINTING) */}
          <div className="hidden print:grid grid-cols-2 gap-10 pt-10 mt-8 text-xs">
            <div className="space-y-8">
              <p className="font-semibold text-slate-700">Patient / Guardian Signature:</p>
              <div className="border-b border-dashed border-slate-600 w-full"></div>
              <p className="text-[11px] text-slate-500">Date: ________________________________</p>
            </div>
            <div className="space-y-8 text-right flex flex-col items-end">
              <p className="font-semibold text-slate-700">Dentist Signature & Stamp:</p>
              <div className="border-b border-dashed border-slate-600 w-full"></div>
              <p className="text-[11px] text-slate-500">
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
