"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintWatermark } from "@/components/print-watermark";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { XrayRequest, XrayAttachment } from "@/lib/types";
import {
  Printer,
  Calendar,
  Building2,
  DollarSign,
  ScanLine,
  User,
  ExternalLink,
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileIcon,
  Share2,
  Mail,
  Copy,
  Check,
  MoreVertical,
} from "lucide-react";
import moment from "moment";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/hooks/use-toast";
import { XrayShareDialog } from "./xray-share-dialog";

interface XrayRequestViewModalProps {
  record: XrayRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (record: XrayRequest) => void;
}

// Authentic WhatsApp SVG Icon
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function XrayRequestViewModal({
  record,
  isOpen,
  onOpenChange,
  onEdit,
}: XrayRequestViewModalProps) {
  const { toast } = useToast();
  const { selectedBranch, availableBranches } = useBranch();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Send / Share Dialog State
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareChannel, setShareChannel] = useState<"email" | "whatsapp">("email");
  const [shareTargetFile, setShareTargetFile] = useState<XrayAttachment | null>(null);

  if (!record) return null;

  const currentBranch =
    availableBranches.find(
      (b) => String(b.id) === String(selectedBranch || record.branch_id)
    ) || availableBranches[0];

  const facilityClinicName = currentBranch?.name || "DENTAL & ORAL HEALTHCARE CLINIC";
  const facilityAddress = currentBranch?.address || "";

  // Support string patient or patientRecord relation
  const patientName =
    typeof record.patient === "string" && record.patient.trim()
      ? record.patient.trim()
      : record.patientRecord
      ? `${record.patientRecord.first_name || ""} ${record.patientRecord.last_name || ""}`.trim()
      : typeof record.patient === "object" && record.patient
      ? `${(record.patient as any).first_name || ""} ${(record.patient as any).last_name || ""}`.trim()
      : "Walk-in Patient";

  const patientGender =
    record.patientRecord?.gender ||
    (typeof record.patient === "object" ? (record.patient as any)?.gender : undefined) ||
    "Unspecified";

  const patientAge = (() => {
    const rawAge =
      record.patientRecord?.age ??
      (typeof record.patient === "object" ? (record.patient as any)?.age : undefined);
    if (rawAge !== undefined && rawAge !== null && String(rawAge).trim() !== "") {
      return `${rawAge} yrs`;
    }
    const dob =
      record.patientRecord?.date_of_birth ??
      (typeof record.patient === "object" ? (record.patient as any)?.date_of_birth : undefined);
    if (dob) {
      const years = moment().diff(moment(dob), "years");
      if (!isNaN(years) && years >= 0) return `${years} yrs`;
    }
    return "N/A";
  })();

  const patientPhone =
    record.patientRecord?.phone ||
    (typeof record.patient === "object" ? (record.patient as any)?.phone : undefined) ||
    "";

  const patientEmail =
    record.patientRecord?.email ||
    (typeof record.patient === "object" ? (record.patient as any)?.email : undefined) ||
    "";

  const patientAddressInfo =
    record.patientRecord?.address ||
    (typeof record.patient === "object" ? (record.patient as any)?.address : undefined) ||
    "N/A";

  const formattedDate = record.request_date
    ? moment(record.request_date).format("MMMM DD, YYYY")
    : (record.created_at ? moment(record.created_at).format("MMMM DD, YYYY") : "Undated");

  const formattedAmount = Number(record.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const attachments: XrayAttachment[] = Array.isArray(record.attachments) ? record.attachments : [];

  const handlePrint = () => {
    window.print();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── File Sharing Handlers ──────────────────────────────────────────────────
  const handleOpenShareModal = (channel: "email" | "whatsapp", file?: XrayAttachment | null) => {
    setShareChannel(channel);
    setShareTargetFile(file || null);
    setIsShareDialogOpen(true);
  };

  const handleShareFileWhatsApp = (att: XrayAttachment) => {
    handleOpenShareModal("whatsapp", att);
  };

  const handleShareFileEmail = (att: XrayAttachment) => {
    handleOpenShareModal("email", att);
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: "Link Copied",
        description: "File URL copied to clipboard.",
      });
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy the file link manually.",
        variant: "destructive",
      });
    }
  };

  // ── Entire Requisition Sharing Handlers ─────────────────────────────────────
  const handleShareRequisitionWhatsApp = () => {
    handleOpenShareModal("whatsapp", null);
  };

  const handleShareRequisitionEmail = () => {
    handleOpenShareModal("email", null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-w-full print:p-0">
        {/* PRINTABLE REQUISITION CASE SHEET */}
        <div className="relative p-6 md:p-8 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:p-0 print:text-black">
          <PrintWatermark facilityName={facilityClinicName} embedInContent />
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
                  {patientGender}
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
                  {patientPhone || patientEmail || "N/A"}
                </span>
              </div>
              <div className="flex items-end gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Address:
                </span>
                <span className="flex-1 font-medium border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">
                  {patientAddressInfo}
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

          {/* 5. ATTACHED DIAGNOSTIC SCANS & FILES WITH SHARING OPTIONS */}
          {attachments.length > 0 && (
            <div className="space-y-2 pb-3 border-b border-dashed border-slate-400 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 print:text-black flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" /> 5. Attached Imaging Scans & Files ({attachments.length})
                </span>
                <span className="text-[10px] text-muted-foreground print:hidden">
                  Click share to send file via WhatsApp or Email
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {attachments.map((att, idx) => {
                  const isImage = att.mime?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(att.url);
                  return (
                    <div
                      key={idx}
                      className="group flex flex-col justify-between p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50/50 dark:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.url}
                              alt={att.name || "Scan"}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0 text-teal-600">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate block font-semibold text-xs text-slate-800 dark:text-slate-200 hover:text-teal-600 transition-colors"
                            title={att.name || `Scan File #${idx + 1}`}
                          >
                            {att.name || `Scan File #${idx + 1}`}
                          </a>
                          <div className="text-[10px] text-muted-foreground">
                            {att.size ? formatFileSize(att.size) : "Attached File"}
                          </div>
                        </div>
                      </div>

                      {/* File Action & Share Buttons (Hidden during print) */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 print:hidden">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>

                        <div className="flex items-center gap-1">
                          {/* Quick WhatsApp Share */}
                          <button
                            type="button"
                            onClick={() => handleShareFileWhatsApp(att)}
                            className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 transition-colors"
                            title="Share file via WhatsApp"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick Email Share */}
                          <button
                            type="button"
                            onClick={() => handleShareFileEmail(att)}
                            className="p-1.5 rounded hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 transition-colors"
                            title="Share file via Email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>

                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(att.url)}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                            title="Copy file link"
                          >
                            {copiedUrl === att.url ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="text-xs text-muted-foreground">
            Print or share requisition case sheet with clinical team or patient.
          </div>
          <div className="flex items-center gap-2">
            {/* SHARE DROPDOWN MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs flex items-center gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300">
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel className="text-[11px] font-bold text-slate-500 uppercase">
                  Share Requisition & Files
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleShareRequisitionWhatsApp}
                  className="flex items-center gap-2 cursor-pointer text-emerald-700 dark:text-emerald-400"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleShareRequisitionEmail}
                  className="flex items-center gap-2 cursor-pointer text-sky-700 dark:text-sky-400"
                >
                  <Mail className="h-4 w-4" />
                  <span>Share via Email</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {attachments.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => handleCopyLink(attachments[0].url)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy First Scan Link</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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

    {/* SHARE REQUISITION / FILE DIALOG */}
    <XrayShareDialog
      isOpen={isShareDialogOpen}
      onOpenChange={setIsShareDialogOpen}
      record={record}
      targetFile={shareTargetFile}
      initialChannel={shareChannel}
    />
    </>
  );
}
