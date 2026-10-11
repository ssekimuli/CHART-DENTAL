"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { XrayRequest } from "@/lib/types";
import {
  Printer,
  Calendar,
  Building2,
  DollarSign,
  ScanLine,
  User,
  ExternalLink,
} from "lucide-react";
import moment from "moment";
import { useBranch } from "@/context/branch-context";

interface XrayRequestViewModalProps {
  record: XrayRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (record: XrayRequest) => void;
}

export function XrayRequestViewModal({
  record,
  isOpen,
  onOpenChange,
  onEdit,
}: XrayRequestViewModalProps) {
  const { selectedBranch, availableBranches } = useBranch();

  if (!record) return null;

  const currentBranch =
    availableBranches.find(
      (b) => String(b.id) === String(selectedBranch || record.branch_id)
    ) || availableBranches[0];

  const facilityClinicName = currentBranch?.name || "DENTAL & ORAL HEALTHCARE CLINIC";
  const facilityAddress = currentBranch?.address || "";

  const patientName = record.patient
    ? `${record.patient.first_name || ""} ${record.patient.last_name || ""}`.trim()
    : "Patient Record";

  const patientAge = (() => {
    if (record.patient?.age !== undefined && record.patient?.age !== null && String(record.patient.age).trim() !== "") {
      return `${record.patient.age} yrs`;
    }
    if (record.patient?.date_of_birth) {
      const years = moment().diff(moment(record.patient.date_of_birth), "years");
      if (!isNaN(years) && years >= 0) return `${years} yrs`;
    }
    return "N/A";
  })();

  const formattedDate = record.request_date
    ? moment(record.request_date).format("MMMM DD, YYYY")
    : (record.created_at ? moment(record.created_at).format("MMMM DD, YYYY") : "Undated");

  const formattedAmount = Number(record.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-w-full print:p-0">
        {/* PRINTABLE REQUISITION CASE SHEET */}
        <div className="p-6 md:p-8 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:p-0 print:text-black">
          {/* HEADER / CLINIC WATERMARK */}
          <div className="flex items-start justify-between pb-3 border-b-2 border-dashed border-slate-800 dark:border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-teal-700 dark:text-teal-400 print:text-black">
                  {facilityClinicName}
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-slate-700 mt-0.5">
                Radiology & Diagnostic Imaging Requisition Form
              </p>
              {facilityAddress && (
                <p className="text-[11px] text-muted-foreground print:text-slate-600 mt-0.5">
                  📍 {facilityAddress}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 print:text-black">
                REQUISITION #{String(record.id).padStart(5, "0")}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1 print:text-slate-600">
                <Calendar className="h-3 w-3" /> {formattedDate}
              </p>
              <div className="mt-1">
                {record.status === "completed" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] print:border-black print:text-black">
                    Completed
                  </Badge>
                ) : record.status === "cancelled" ? (
                  <Badge variant="outline" className="text-rose-600 border-rose-300 text-[10px]">
                    Cancelled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                    Pending Imaging
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 1. PATIENT DEMOGRAPHICS (CLEAN DASHED LINES) */}
          <div className="space-y-2 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 print:text-black flex items-center gap-1.5 mb-1.5">
              <User className="h-3.5 w-3.5" /> 1. Patient Demographics
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[220px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Patient Name:
                </span>
                <span className="flex-1 font-semibold text-sm border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patientName}
                </span>
              </div>
              <div className="flex items-end gap-1.5 w-32">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Sex:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.patient?.gender || "Unspecified"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 w-24">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Age:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patientAge}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Contact / Tel:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.patient?.phone || record.patient?.email || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Address:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.patient?.address || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Requesting Clinician:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.doctor_name || "Authorized Clinician"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. IMAGING & FACILITY ORDER DETAILS */}
          <div className="space-y-2 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 print:text-black flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5" /> 2. Imaging Center & Requisition Specifics
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[240px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Assigned Facility:
                </span>
                <span className="flex-1 font-bold text-sm text-teal-800 dark:text-teal-300 print:text-black border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.facility}
                </span>
              </div>
              <div className="flex items-end gap-1.5 w-48">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Amount / Fee:
                </span>
                <span className="flex-1 font-mono font-bold text-sm border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {formattedAmount}
                </span>
              </div>
              {record.invoice_id && (
                <div className="flex items-end gap-1.5 w-36">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Invoice:
                  </span>
                  <span className="flex-1 font-mono font-bold text-xs text-teal-700 dark:text-teal-400 print:text-black border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                    #{record.invoice_id}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-end gap-1.5 flex-1 min-w-[240px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Scan / X-Ray Type:
                </span>
                <span className="flex-1 font-semibold border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.xray_type || "General Dental X-Ray"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Tooth / Anatomical Region:
                </span>
                <span className="flex-1 font-semibold border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {record.tooth_region || "Full Dentition"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. CLINICAL INDICATION */}
          <div className="space-y-1 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 print:text-black">
              3. Clinical Indication & Investigation Purpose:
            </span>
            <div className="pt-1 min-h-[50px] font-sans text-xs text-slate-800 dark:text-slate-200 print:text-black leading-relaxed">
              {record.clinical_notes || "Routine diagnostic evaluation. Assessment of dentition and surrounding alveolar bone."}
            </div>
          </div>

          {/* 4. RADIOLOGICAL REPORT / FINDINGS (IF RECORDED) */}
          {record.report_findings && (
            <div className="space-y-1 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 print:text-black">
                4. Radiological Impression & Findings:
              </span>
              <div className="pt-1 min-h-[40px] font-sans text-xs text-slate-800 dark:text-slate-200 print:text-black leading-relaxed">
                {record.report_findings}
              </div>
            </div>
          )}

          {/* SIGNATURES & VERIFICATION (CLEAN DASHED LINES) */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-2">
              <div className="border-b border-dashed border-slate-800 dark:border-slate-300 h-10 flex items-end">
                <span className="text-xs font-semibold pb-1">
                  {record.doctor_name || "Requesting Clinician"}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground print:text-slate-600">
                <span className="font-bold uppercase">Referring Dentist Signature</span>
                <span>Date: {moment().format("DD/MM/YYYY")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="border-b border-dashed border-slate-800 dark:border-slate-300 h-10 flex items-end">
                <span className="text-xs font-semibold pb-1 text-slate-600 dark:text-slate-400">
                  {record.facility}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground print:text-slate-600">
                <span className="font-bold uppercase">Imaging Facility / Radiographer</span>
                <span>Stamp & Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t flex items-center justify-between print:hidden">
          <div className="text-xs text-muted-foreground">
            Print standard requisition case sheet for referral or clinical archiving.
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(record);
                }}
                className="h-9 text-xs"
              >
                Edit Requisition
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              <Printer className="mr-1.5 h-4 w-4" /> Print Requisition Sheet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
