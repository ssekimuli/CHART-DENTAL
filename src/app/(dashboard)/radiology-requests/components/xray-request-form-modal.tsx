"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/branch-context";
import { createXrayRequest, updateXrayRequest, getPatients } from "@/lib/api";
import type { XrayRequest, Patient, XrayAttachment } from "@/lib/types";
import {
  ScanLine,
  Building2,
  DollarSign,
  User,
  Calendar,
  Stethoscope,
  FileText,
  Loader2,
  Search,
  Paperclip,
  Upload,
  X,
  FileIcon,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import moment from "moment";

interface XrayRequestFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: XrayRequest | null;
  defaultPatientId?: string | number;
  onSuccess: (record: XrayRequest) => void;
}

const XRAY_TYPE_OPTIONS = [
  "Panoramic (OPG)",
  "Bitewing (Bite-wing)",
  "Periapical (PA)",
  "Cone Beam CT (3D CBCT)",
  "Cephalometric (Lateral / PA)",
  "Occlusal View",
  "Full Mouth Series (FMS)",
  "Temporomandibular Joint (TMJ)",
  "Other Imaging",
];

const FACILITY_SUGGESTIONS = [
  "In-House Radiology",
  "Apex Diagnostic Imaging",
  "Metro Dental 3D Scans",
  "City Dental Diagnostics",
];

export function XrayRequestFormModal({
  isOpen,
  onOpenChange,
  initialData,
  defaultPatientId,
  onSuccess,
}: XrayRequestFormModalProps) {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Patients list for quick selector
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Form Fields
  const [patientName, setPatientName] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [facility, setFacility] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [xrayType, setXrayType] = useState("Panoramic (OPG)");
  const [toothRegion, setToothRegion] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [requestDate, setRequestDate] = useState(moment().format("YYYY-MM-DD"));
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");
  const [reportFindings, setReportFindings] = useState("");
  
  // Attachments (Optional)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<XrayAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load patients for selector
  useEffect(() => {
    if (isOpen) {
      setIsLoadingPatients(true);
      getPatients()
        .then((data) => {
          setPatientsList(data || []);
        })
        .catch((err) => {
          console.error("Failed to load patients for selector:", err);
        })
        .finally(() => {
          setIsLoadingPatients(false);
        });
    }
  }, [isOpen]);

  // Sync form when initialData or modal opens
  useEffect(() => {
    if (initialData) {
      const initialPatientStr =
        typeof initialData.patient === "string" && initialData.patient.trim()
          ? initialData.patient
          : initialData.patientRecord
          ? `${initialData.patientRecord.first_name || ""} ${initialData.patientRecord.last_name || ""}`.trim()
          : typeof initialData.patient === "object" && initialData.patient
          ? `${(initialData.patient as any).first_name || ""} ${(initialData.patient as any).last_name || ""}`.trim()
          : "";

      setPatientName(initialPatientStr);
      setPatientId(String(initialData.patient_id || ""));
      setFacility(initialData.facility || "");
      setAmount(initialData.amount !== undefined ? String(initialData.amount) : "");
      setXrayType(initialData.xray_type || "Panoramic (OPG)");
      setToothRegion(initialData.tooth_region || "");
      setClinicalNotes(initialData.clinical_notes || "");
      setDoctorName(initialData.doctor_name || "");
      setRequestDate(
        initialData.request_date
          ? moment(initialData.request_date).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD")
      );
      setStatus(initialData.status || "pending");
      setReportFindings(initialData.report_findings || "");
      setExistingAttachments(Array.isArray(initialData.attachments) ? initialData.attachments : []);
      setSelectedFiles([]);
      setShowPatientSelector(false);
    } else {
      setPatientName("");
      setPatientId(defaultPatientId ? String(defaultPatientId) : "");
      setFacility("In-House Radiology");
      setAmount("50000");
      setXrayType("Panoramic (OPG)");
      setToothRegion("Full Dentition");
      setClinicalNotes("");
      setDoctorName("");
      setRequestDate(moment().format("YYYY-MM-DD"));
      setStatus("pending");
      setReportFindings("");
      setExistingAttachments([]);
      setSelectedFiles([]);
      setShowPatientSelector(false);
    }
  }, [initialData, defaultPatientId, isOpen]);

  // If defaultPatientId is passed, resolve patient name when patientsList loads
  useEffect(() => {
    if (!initialData && defaultPatientId && patientsList.length > 0 && !patientName) {
      const p = patientsList.find((item) => String(item.id) === String(defaultPatientId));
      if (p) {
        setPatientName(`${p.first_name || ""} ${p.last_name || ""}`.trim());
      }
    }
  }, [defaultPatientId, patientsList, initialData, patientName]);

  // Filter patients by search term
  const filteredPatients = patientsList.filter((p) => {
    if (!patientSearch.trim()) return true;
    const term = patientSearch.toLowerCase();
    const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    const phone = (p.phone || "").toLowerCase();
    const id = String(p.id || "");
    return name.includes(term) || phone.includes(term) || id.includes(term);
  });

  const handleSelectRegisteredPatient = (p: Patient) => {
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    setPatientName(fullName);
    setPatientId(String(p.id));
    setShowPatientSelector(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      toast({
        title: "Patient Name Required",
        description: "Please enter the patient name for this radiology order.",
        variant: "destructive",
      });
      return;
    }

    if (!facility.trim()) {
      toast({
        title: "Facility Required",
        description: "Please specify the imaging center or facility.",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast({
        title: "Valid Amount Required",
        description: "Please enter a valid numeric amount for the requisition.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let result: XrayRequest;

      if (selectedFiles.length > 0) {
        // Submit using FormData to include files
        const formData = new FormData();
        formData.append("patient", patientName.trim());
        if (patientId) formData.append("patient_id", patientId);
        formData.append("facility", facility.trim());
        formData.append("amount", String(numericAmount));
        formData.append("xray_type", xrayType);
        formData.append("tooth_region", toothRegion.trim());
        formData.append("clinical_notes", clinicalNotes.trim());
        formData.append("doctor_name", doctorName.trim());
        formData.append("request_date", requestDate);
        formData.append("status", status);
        formData.append("report_findings", reportFindings.trim());
        if (selectedBranch) formData.append("branch_id", String(selectedBranch));
        if (existingAttachments.length > 0) {
          formData.append("attachments", JSON.stringify(existingAttachments));
        }

        // Attach each newly selected file
        selectedFiles.forEach((file) => {
          formData.append("files[]", file);
        });

        if (initialData?.id) {
          result = await updateXrayRequest(initialData.id, formData);
          toast({
            title: "Requisition Updated",
            description: "Radiology request and attached files updated successfully.",
          });
        } else {
          result = await createXrayRequest(formData);
          toast({
            title: "Requisition Created",
            description: "Radiology request created with invoice and attached files.",
          });
        }
      } else {
        // Standard JSON payload
        const payload: Partial<XrayRequest> = {
          patient: patientName.trim(),
          patient_id: patientId || undefined,
          facility: facility.trim(),
          amount: numericAmount,
          xray_type: xrayType,
          tooth_region: toothRegion.trim(),
          clinical_notes: clinicalNotes.trim(),
          doctor_name: doctorName.trim(),
          request_date: requestDate,
          status: status,
          report_findings: reportFindings.trim(),
          branch_id: selectedBranch || undefined,
          attachments: existingAttachments,
        };

        if (initialData?.id) {
          result = await updateXrayRequest(initialData.id, payload);
          toast({
            title: "Requisition Updated",
            description: "Radiology request updated successfully.",
          });
        } else {
          result = await createXrayRequest(payload);
          toast({
            title: "Requisition Created",
            description: "Radiology & X-ray request created successfully.",
          });
        }
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "Save Failed",
        description: err?.message || "Could not save X-ray request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <ScanLine className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold">
              {initialData ? "Edit Radiology Request" : "New X-Ray & Imaging Requisition"}
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create an imaging requisition with patient name, imaging facility, charge amount & optional scan attachments.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* 1. PATIENT (STRING + QUICK SELECTOR HELPER) */}
          <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Patient Name <span className="text-rose-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowPatientSelector(!showPatientSelector)}
                className="text-xs text-teal-700 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Search className="h-3 w-3" />
                {showPatientSelector ? "Hide Patient Directory" : "Pick from Registered Patients"}
              </button>
            </div>

            {/* Direct Patient String Input */}
            <div className="relative">
              <Input
                placeholder="Type patient full name (e.g. Sarah Namukasa)..."
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  // If user edits text manually, unlink patientId unless matches
                  if (patientId) setPatientId("");
                }}
                className="h-10 text-sm font-semibold bg-white dark:bg-slate-950"
                required
              />
            </div>

            {/* Active Link Badge if registered patient selected */}
            {patientId && (
              <div className="flex items-center gap-2 pt-0.5 text-[11px] text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Linked to Patient Record #{patientId}</span>
                <button
                  type="button"
                  onClick={() => setPatientId("")}
                  className="text-rose-500 hover:underline text-[10px] ml-1"
                >
                  (Unlink)
                </button>
              </div>
            )}

            {/* Registered Patient Quick Dropdown / Filter Search */}
            {showPatientSelector && (
              <div className="mt-2 p-2.5 rounded-md bg-white dark:bg-slate-950 border border-dashed border-teal-300 dark:border-teal-800 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patient by name, phone or record ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingPatients ? (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      Loading registered patients...
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      No matching registered patients found. You can keep typing any name above.
                    </div>
                  ) : (
                    filteredPatients.slice(0, 15).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectRegisteredPatient(p)}
                        className="py-1.5 px-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer rounded flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {p.first_name} {p.last_name}
                          </span>
                          <span className="text-muted-foreground text-[11px] ml-2">
                            {p.gender ? `(${p.gender})` : ""} {p.phone ? `• ${p.phone}` : ""}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          ID #{p.id}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. FACILITY & AMOUNT (CORE USER REQUIREMENT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Facility */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Imaging Facility <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. In-House Radiology, Apex Imaging..."
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="h-9 text-xs"
                required
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                {FACILITY_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFacility(sug)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Amount / Charge Fee <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-semibold">
                  UGX / $
                </span>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-16 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Automatically billed to an invoice upon creating the requisition.
              </p>
            </div>
          </div>

          {/* 3. X-RAY SCAN TYPE & TOOTH/REGION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                X-Ray / Scan Type
              </Label>
              <Select value={xrayType} onValueChange={setXrayType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Scan Type" />
                </SelectTrigger>
                <SelectContent>
                  {XRAY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tooth / Anatomical Region
              </Label>
              <Input
                placeholder="e.g. Full Dentition, Tooth #18, Mandible..."
                value={toothRegion}
                onChange={(e) => setToothRegion(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* 4. DOCTOR, DATE & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Stethoscope className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Attending Doctor
              </Label>
              <Input
                placeholder="Dr. Name"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Requisition Date
              </Label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v: "pending" | "completed" | "cancelled") => setStatus(v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5. CLINICAL INDICATION & NOTES */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Clinical Indication / Reason for Imaging
            </Label>
            <Textarea
              placeholder="e.g. Assessment of third molar impaction, bone resorption around lower left quadrant, pre-orthodontic evaluation..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="min-h-[60px] text-xs resize-none"
            />
          </div>

          {/* 6. OPTIONAL FILE ATTACHMENTS (NEW FEATURE) */}
          <div className="space-y-2 p-3.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Attach Files / Scans <span className="text-xs font-normal lowercase text-muted-foreground">(optional)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs flex items-center gap-1 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
              >
                <Upload className="h-3 w-3" />
                Choose Files
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.dcm,.dicom,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="text-[11px] text-muted-foreground">
              Optional: Attach X-ray image scans (JPG, PNG, WebP), DICOM files, or PDF referral documents.
            </p>

            {/* List of existing attachments if editing */}
            {existingAttachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Existing Attached Files:
                </span>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                    >
                      {att.mime?.startsWith("image/") ? (
                        <ImageIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <FileIcon className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      )}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate max-w-[140px] font-medium text-teal-700 dark:text-teal-400 hover:underline"
                        title={att.name || "Attachment"}
                      >
                        {att.name || `Scan ${idx + 1}`}
                      </a>
                      {att.size && (
                        <span className="text-[10px] text-muted-foreground">
                          ({formatFileSize(att.size)})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingAttachment(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-1 p-0.5 rounded transition-colors"
                        title="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of newly picked files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Ready to Upload ({selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-xs shadow-sm"
                    >
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <FileIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      )}
                      <span className="truncate max-w-[140px] font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-1 p-0.5 rounded transition-colors"
                        title="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. FINDINGS / REPORT (IF COMPLETED) */}
          {status === "completed" && (
            <div className="space-y-1.5 p-3 rounded-md bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
              <Label className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Radiological Findings / Radiologist Impression
              </Label>
              <Textarea
                placeholder="Findings observed on X-ray / CT scan..."
                value={reportFindings}
                onChange={(e) => setReportFindings(e.target.value)}
                className="min-h-[60px] text-xs bg-white dark:bg-slate-950 resize-none"
              />
            </div>
          )}

          {/* FOOTER */}
          <DialogFooter className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {initialData ? "Update Requisition" : "Create Requisition Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
