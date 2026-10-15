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
  Share2,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
import moment from "moment";
import { useBranch } from "@/context/branch-context";
import { getFacilityReceiptSettings, type FacilityReceiptSettings } from "@/lib/api";

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
  const { selectedBranch, availableBranches } = useBranch();
  const [receiptSettings, setReceiptSettings] = React.useState<FacilityReceiptSettings | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const s = await getFacilityReceiptSettings();
        if (isMounted && s) setReceiptSettings(s);
      } catch (err) {
        console.warn("Could not load facility receipt settings:", err);
      }
    };
    if (isOpen) {
      loadSettings();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!record) return null;

  const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Patient";

  const currentBranch = availableBranches.find(
    (b) => String(b.id) === String(selectedBranch || patient.branch_id)
  ) || availableBranches[0];

  const facilityName = receiptSettings?.clinic_name || currentBranch?.name || "DENTAL & ORAL HEALTHCARE CLINIC";
  const facilitySubtitle = receiptSettings?.subtitle || "";
  const facilityAddress = receiptSettings?.address || currentBranch?.address || "";
  const facilityPhone = receiptSettings?.phone || (currentBranch as any)?.contactNumber || (currentBranch as any)?.phone || "";
  const facilityEmail = receiptSettings?.email || "";
  const facilityFooter = receiptSettings?.receipt_footer || "";

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = record.date ? moment(record.date).format("MMMM DD, YYYY") : "Undated";

  const handleShareWhatsApp = () => {
    const text = [
      `*Clinical Case Sheet: ${fullName}*`,
      `*Facility:* ${facilityName}`,
      `*Date:* ${formattedDate}`,
      record.chief_complaint ? `*Chief Complaint:* ${record.chief_complaint}` : "",
      record.diagnosis ? `*Diagnosis:* ${record.diagnosis}` : "",
      record.treatment_given ? `*Treatment Given:* ${record.treatment_given}` : "",
      record.treatment_plan ? `*Plan:* ${record.treatment_plan}` : "",
      `*Dentist:* ${record.doctor_name || "Authorized Clinician"}`,
    ].filter(Boolean).join("\n");

    const phone = (patient.phone || "").replace(/[^0-9]/g, "");
    const waUrl = phone.length >= 9
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareEmail = () => {
    const subject = `Clinical Case Sheet - ${fullName} (${formattedDate})`;
    const body = [
      `Patient Name: ${fullName}`,
      `Facility: ${facilityName}`,
      `Date: ${formattedDate}`,
      ``,
      record.chief_complaint ? `Chief Complaint:\n${record.chief_complaint}\n` : "",
      record.diagnosis ? `Diagnosis:\n${record.diagnosis}\n` : "",
      record.treatment_given ? `Treatment Given:\n${record.treatment_given}\n` : "",
      record.treatment_plan ? `Treatment Plan:\n${record.treatment_plan}\n` : "",
      `Attending Clinician: ${record.doctor_name || "Authorized Clinician"}`,
    ].filter(Boolean).join("\n");

    const email = patient.email || "";
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
                  {facilityName}
                </span>
              </div>
              {facilitySubtitle && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 print:text-slate-700 mt-0.5">
                  {facilitySubtitle}
                </p>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 print:text-slate-800 mt-0.5">
                Medical Form
              </p>
              <div className="text-[11px] text-muted-foreground print:text-slate-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {facilityAddress && <span>{facilityAddress}</span>}
                {facilityPhone && <span>Tel: {facilityPhone}</span>}
                {facilityEmail && <span>Email: {facilityEmail}</span>}
              </div>
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
                  {patient.age ? `${patient.age} yrs` : (patient.dateOfBirth || patient.date_of_birth ? `${moment().diff(moment(patient.dateOfBirth || patient.date_of_birth), "years")} yrs` : "N/A")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Contact / Tel:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patient.phone || patient.email || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Address:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patient.address || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Attending Clinician:
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
              <p className="font-semibold text-slate-700">Attending Clinician Signature & Stamp:</p>
              <div className="border-b border-dashed border-slate-600 w-full"></div>
              <p className="text-[11px] text-slate-500">
                {record.doctor_name || "Authorized Clinician"}
              </p>
            </div>
          </div>

          {/* FACILITY FOOTER NOTE */}
          {facilityFooter && (
            <div className="pt-4 mt-6 border-t border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 print:text-slate-600">
              {facilityFooter}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-slate-50/50 dark:bg-slate-900/40 print:hidden">
          <div className="flex items-center gap-2 mr-auto">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Case Sheet
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-teal-500/40 text-teal-700 dark:text-teal-300">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-xs">
                <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase font-bold">
                  Share Case Sheet
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleShareWhatsApp} className="text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  <WhatsAppIcon className="mr-2 h-4 w-4" /> Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareEmail} className="text-sky-700 dark:text-sky-400 cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" /> Share via Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
