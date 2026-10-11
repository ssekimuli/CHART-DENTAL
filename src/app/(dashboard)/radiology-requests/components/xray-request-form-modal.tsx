"use client";

import React, { useState, useEffect } from "react";
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
import type { XrayRequest, Patient } from "@/lib/types";
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

  // Patients list for selector
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Form Fields
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load patients for dropdown
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
      setPatientId(String(initialData.patient_id || initialData.patient?.id || ""));
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
    } else {
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
    }
  }, [initialData, defaultPatientId, isOpen]);

  // Filter patients by search term
  const filteredPatients = patientsList.filter((p) => {
    if (!patientSearch.trim()) return true;
    const term = patientSearch.toLowerCase();
    const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    const phone = (p.phone || "").toLowerCase();
    const id = String(p.id || "");
    return name.includes(term) || phone.includes(term) || id.includes(term);
  });

  const selectedPatientObj = patientsList.find(
    (p) => String(p.id) === String(patientId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast({
        title: "Patient Required",
        description: "Please select a patient for this radiology order.",
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
      const payload: Partial<XrayRequest> = {
        patient_id: patientId,
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
      };

      let result: XrayRequest;
      if (initialData?.id) {
        result = await updateXrayRequest(initialData.id, payload);
        toast({
          title: "Requisition Updated",
          description: "Radiology request has been updated successfully.",
        });
      } else {
        result = await createXrayRequest(payload);
        toast({
          title: "Requisition Created",
          description: "Radiology & X-ray request created successfully.",
        });
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
            Create an imaging requisition with patient selection, imaging facility, charge amount & clinical region.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* 1. PATIENT SELECTION */}
          <div className="space-y-2 p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Patient Selection <span className="text-rose-500">*</span>
            </Label>

            {/* Quick search filter for patients */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Type name, phone or ID to search patient..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950">
                <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select Patient"} />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {filteredPatients.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No matching patients found
                  </div>
                ) : (
                  filteredPatients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      <span className="font-semibold">
                        {p.first_name} {p.last_name}
                      </span>{" "}
                      {p.gender ? `(${p.gender})` : ""} - {p.phone || "No phone"} #ID: {p.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedPatientObj && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-950">
                  Gender: {selectedPatientObj.gender || "Unspecified"}
                </Badge>
                {selectedPatientObj.phone && (
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-950">
                    Phone: {selectedPatientObj.phone}
                  </Badge>
                )}
                {selectedPatientObj.address && (
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-950 truncate max-w-xs">
                    Address: {selectedPatientObj.address}
                  </Badge>
                )}
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
                Total investigation cost or referral invoice charge.
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
              className="min-h-[70px] text-xs resize-none"
            />
          </div>

          {/* 6. FINDINGS / REPORT (IF COMPLETED) */}
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
