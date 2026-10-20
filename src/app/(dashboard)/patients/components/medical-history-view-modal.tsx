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
import { PrintWatermark } from "@/components/print-watermark";
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
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import {
  getClinicName,
  getClinicSubtitle,
  getClinicAddress,
  getClinicPhone,
  getClinicEmail,
  getReceiptFooter,
} from "@/lib/business-details";

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
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState<boolean>(false);
  const printableRef = React.useRef<HTMLDivElement>(null);

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

  const currentBranch = availableBranches.find(
    (b) => String(b.id) === String(selectedBranch || (patient && patient.branch_id))
  ) || availableBranches[0];

  const localClinicName = typeof window !== "undefined" ? getClinicName() : "";
  const facilityName =
    receiptSettings?.clinic_name ||
    (localClinicName && localClinicName !== "CHART DENTAL" ? localClinicName : "") ||
    currentBranch?.name ||
    localClinicName ||
    "DENTAL & ORAL HEALTHCARE CLINIC";

  const facilitySubtitle =
    receiptSettings?.subtitle ||
    (typeof window !== "undefined" ? getClinicSubtitle() : "") ||
    "";

  const facilityAddress =
    receiptSettings?.address ||
    (typeof window !== "undefined" ? getClinicAddress() : "") ||
    currentBranch?.address ||
    "";

  const facilityPhone =
    receiptSettings?.phone ||
    (typeof window !== "undefined" ? getClinicPhone() : "") ||
    (currentBranch as any)?.contactNumber ||
    (currentBranch as any)?.contact_number ||
    (currentBranch as any)?.phone ||
    "";

  const facilityEmail =
    receiptSettings?.email ||
    (typeof window !== "undefined" ? getClinicEmail() : "") ||
    (currentBranch as any)?.email ||
    "";

  const facilityFooter =
    receiptSettings?.receipt_footer ||
    (typeof window !== "undefined" ? getReceiptFooter() : "") ||
    "";

  // Build the 4 requested QR code fields: CLINIC NAME, ADDRESS, PHONE, EMAIL
  React.useEffect(() => {
    let isMounted = true;
    const qrData = [
      `CLINIC NAME: ${facilityName}`,
      `ADDRESS: ${facilityAddress || "Clinic Premises"}`,
      `PHONE: ${facilityPhone || "Not Specified"}`,
      `EMAIL: ${facilityEmail || "Not Specified"}`,
    ].join("\n");

    QRCode.toDataURL(qrData, {
      margin: 1,
      width: 256,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate Clinic QR Code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [facilityName, facilityAddress, facilityPhone, facilityEmail]);

  if (!record) return null;

  const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Patient";

  const handlePrint = () => {
    const content = printableRef.current;
    if (!content) return;

    // Remove any previous print iframe
    const oldIframe = document.getElementById("medical-form-print-iframe");
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "medical-form-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all stylesheets from main document
    const headNodes: string[] = [];
    document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
      headNodes.push(node.outerHTML);
    });

    const printStyles = `
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: inherit;
        }
        #medical-form-v-content {
          display: block !important;
          visibility: visible !important;
          position: relative !important;
          width: 100% !important;
          padding: 8px !important;
          margin: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          overflow: hidden !important;
        }
        #medical-form-v-content .print-watermark-embed {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-around !important;
          align-items: center !important;
          pointer-events: none !important;
          z-index: 5 !important;
          visibility: visible !important;
        }
        #medical-form-v-content .print-watermark-text {
          font-size: clamp(34px, 5vw, 56px) !important;
          font-weight: 900 !important;
          color: rgba(15, 23, 42, 0.08) !important;
          text-transform: uppercase !important;
          letter-spacing: 6px !important;
          transform: rotate(-32deg) !important;
          text-align: center !important;
          line-height: 1.25 !important;
          max-width: 90% !important;
          visibility: visible !important;
        }
        .print\\:hidden {
          display: none !important;
        }
      </style>
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical-Form-V-${fullName.replace(/\s+/g, "_")}-${record.id || "record"}</title>
          ${headNodes.join("\n")}
          ${printStyles}
        </head>
        <body class="bg-white text-slate-900">
          ${content.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Give browser time to lay out and render image/QR, then open print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 400);
  };
const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const html2pdf = (await import("html2pdf.js")).default;
      const element = printableRef.current;
      if (!element) return;

      const opt = {
        margin: 8,
        filename: `Medical-Form-V-Record-${record.id || "doc"}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc: any) => {
            const clonedContent = clonedDoc.getElementById("medical-form-v-content");
            if (clonedContent) {
              clonedContent.style.backgroundColor = "#ffffff";
              clonedContent.style.color = "#0f172a";

              const watermark = clonedContent.querySelector(".print-watermark-embed") as HTMLElement | null;
              if (watermark) {
                watermark.style.display = "flex";
                watermark.style.position = "absolute";
                watermark.style.inset = "0";
                watermark.style.width = "100%";
                watermark.style.height = "100%";
                watermark.style.zIndex = "10";
                watermark.style.visibility = "visible";
              }
              const watermarkTexts = clonedContent.querySelectorAll(".print-watermark-text");
              watermarkTexts.forEach((node: any) => {
                const el = node as HTMLElement;
                el.style.color = "rgba(15, 23, 42, 0.08)";
                el.style.visibility = "visible";
                el.style.display = "block";
              });
            }
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
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
        <div
          ref={printableRef}
          id="medical-form-v-content"
          className="relative p-6 md:p-8 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:p-0 print:text-black"
        >
          <PrintWatermark facilityName={facilityName} embedInContent />
          {/* HEADER / CLINIC WATERMARK & QR CODE */}
          <div className="flex items-start justify-between pb-3 border-b-2 border-dashed border-slate-800 dark:border-slate-200 gap-4">
            <div className="flex-1 pr-2">
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
                Medical Form V &mdash; Clinical Case Sheet
              </p>
              <div className="text-[11px] text-muted-foreground print:text-slate-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {facilityAddress && <span>Address: {facilityAddress}</span>}
                {facilityPhone && <span>Tel: {facilityPhone}</span>}
                {facilityEmail && <span>Email: {facilityEmail}</span>}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {qrCodeDataUrl && (
                <div className="flex flex-col items-center justify-center p-1 bg-white rounded border border-slate-300 shadow-xs print:border-slate-500">
                  <img
                    src={qrCodeDataUrl}
                    alt="Clinic Information QR Code"
                    className="w-16 h-16 object-contain block"
                  />
                  <span className="text-[8px] font-bold tracking-wider uppercase text-slate-700 print:text-black mt-0.5">
                    CLINIC QR
                  </span>
                </div>
              )}
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 print:text-black">
                  RECORD #{record.id || "N/A"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1 print:text-slate-600">
                  <Calendar className="h-3 w-3" /> {formattedDate}
                </p>
              </div>
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
                1. Chief Complaint & History of Present Illness
              </span>
              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
            </div>
            <div className="border-b border-dashed border-slate-400 dark:border-slate-600 pb-1.5 pt-0.5 text-xs whitespace-pre-wrap min-h-[26px]">
              {record.chief_complaint || "No chief complaint noted"}
            </div>
            {record.history_complaint && (
              <p className="text-[11px] text-muted-foreground pt-0.5 italic">
                History: {record.history_complaint}
              </p>
            )}
          </div>

          {/* 2. CLINICAL EXAMINATION */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
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
          <div className="flex items-center gap-2 mr-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Case Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
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
