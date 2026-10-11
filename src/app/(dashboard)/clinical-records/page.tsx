"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/branch-context";
import { getAllMedicalHistories } from "@/lib/api";
import type { MedicalHistory } from "@/lib/types";
import { MedicalHistoryViewModal } from "../patients/components/medical-history-view-modal";
import { type PatientBasicInfo } from "../patients/components/medical-history-form";
import moment from "moment";
import {
  Stethoscope,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  ShieldCheck,
  User,
  Activity,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ClipboardList,
  Sparkles,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function ClinicalRecordsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { selectedBranch, availableBranches } = useBranch();

  // State
  const [records, setRecords] = useState<MedicalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilterPreset, setDateFilterPreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [consentFilter, setConsentFilter] = useState("all");
  const [selectedClinician, setSelectedClinician] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [viewingRecord, setViewingRecord] = useState<MedicalHistory | null>(null);
  const [viewingPatient, setViewingPatient] = useState<PatientBasicInfo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle Preset Changes
  const handleDatePresetChange = (preset: string) => {
    setDateFilterPreset(preset);
    setCurrentPage(1);
    const today = moment().format("YYYY-MM-DD");

    if (preset === "today") {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === "week") {
      setDateFrom(moment().startOf("week").format("YYYY-MM-DD"));
      setDateTo(moment().endOf("week").format("YYYY-MM-DD"));
    } else if (preset === "month") {
      setDateFrom(moment().startOf("month").format("YYYY-MM-DD"));
      setDateTo(moment().endOf("month").format("YYYY-MM-DD"));
    } else if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    }
  };

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: pageSize,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }
      if (consentFilter !== "all") {
        params.consent = consentFilter === "consented" ? "1" : "0";
      }
      if (selectedClinician !== "all") {
        params.doctor_name = selectedClinician;
      }
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }

      const res = await getAllMedicalHistories(params);
      setRecords(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.last_page || 1);
        setTotalCount(res.meta.total || (res.data?.length ?? 0));
      } else {
        setTotalPages(1);
        setTotalCount(res.data?.length || 0);
      }
    } catch (error) {
      console.error("Failed to load clinical records:", error);
      toast({
        title: "Error Loading Records",
        description: "Could not retrieve clinical histories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    dateFrom,
    dateTo,
    consentFilter,
    selectedClinician,
    selectedBranch,
    toast,
  ]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Unique Clinicians for dropdown filter
  const clinicianOptions = useMemo(() => {
    const names = new Set<string>();
    records.forEach((r) => {
      if (r.doctor_name && r.doctor_name.trim()) {
        names.add(r.doctor_name.trim());
      }
    });
    return Array.from(names);
  }, [records]);

  // Metrics
  const stats = useMemo(() => {
    const todayStr = moment().format("YYYY-MM-DD");
    const currentMonthStr = moment().format("YYYY-MM");
    const todayCount = records.filter(
      (r) => r.date && r.date.startsWith(todayStr)
    ).length;
    const monthCount = records.filter(
      (r) => r.date && r.date.startsWith(currentMonthStr)
    ).length;
    const consentedCount = records.filter((r) => r.consent).length;
    const consentRate =
      records.length > 0
        ? Math.round((consentedCount / records.length) * 100)
        : 100;

    return {
      total: totalCount || records.length,
      today: todayCount,
      thisMonth: monthCount,
      consentRate,
    };
  }, [records, totalCount]);

  // Open modal for a record
  const handleViewRecord = (record: MedicalHistory) => {
    const patientInfo: PatientBasicInfo = {
      id: Number(record.patient?.id || record.patient_id || record.patientId || 0),
      first_name: record.patient?.first_name || "",
      last_name: record.patient?.last_name || "",
      gender: record.patient?.gender || "Unspecified",
      age: record.patient?.age,
      date_of_birth: record.patient?.date_of_birth,
      phone: record.patient?.phone || "",
      email: record.patient?.email || "",
      branch_id: record.patient?.branch_id,
    };
    setViewingPatient(patientInfo);
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setDateFilterPreset("all");
    setDateFrom("");
    setDateTo("");
    setConsentFilter("all");
    setSelectedClinician("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Stethoscope className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Clinical Records
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master repository of all patient medical histories, clinical examinations & diagnoses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Link href="/patients">
              <User className="mr-2 h-4 w-4" /> Go to Patients
            </Link>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-teal-200/50 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Total Case Records
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.total.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Across all registered patients
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Documented Today
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.today}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Recorded in current 24 hours
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              This Month
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.thisMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Month of {moment().format("MMMM YYYY")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Consent Rate
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.consentRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Informed consent acknowledged
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient name, phone, complaint, diagnosis, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            {/* Date Preset */}
            <Select
              value={dateFilterPreset}
              onValueChange={handleDatePresetChange}
            >
              <SelectTrigger className="w-full lg:w-[150px] h-10 text-xs">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Clinician Filter */}
            {clinicianOptions.length > 0 && (
              <Select
                value={selectedClinician}
                onValueChange={(val) => {
                  setSelectedClinician(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[180px] h-10 text-xs">
                  <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Attending Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clinicians</SelectItem>
                  {clinicianOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Consent Filter */}
            <Select
              value={consentFilter}
              onValueChange={(val) => {
                setConsentFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[150px] h-10 text-xs">
                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Consent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consent</SelectItem>
                <SelectItem value="consented">Consent Confirmed</SelectItem>
                <SelectItem value="pending">Consent Pending</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm ||
              dateFilterPreset !== "all" ||
              consentFilter !== "all" ||
              selectedClinician !== "all" ||
              dateFrom ||
              dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 text-xs text-muted-foreground hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Custom Date Inputs if custom selected */}
          {dateFilterPreset === "custom" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Custom Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px]">From:</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 text-xs w-36"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px]">To:</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 text-xs w-36"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RECORDS DATA TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableHead className="w-[120px] text-xs font-bold uppercase">
                    Date
                  </TableHead>
                  <TableHead className="min-w-[190px] text-xs font-bold uppercase">
                    Patient
                  </TableHead>
                  <TableHead className="min-w-[200px] text-xs font-bold uppercase">
                    Chief Complaint
                  </TableHead>
                  <TableHead className="min-w-[170px] text-xs font-bold uppercase">
                    Diagnosis
                  </TableHead>
                  <TableHead className="min-w-[150px] text-xs font-bold uppercase">
                    Attending Clinician
                  </TableHead>
                  <TableHead className="w-[110px] text-xs font-bold uppercase text-center">
                    Consent
                  </TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-bold uppercase pr-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Activity className="h-10 w-10 text-muted-foreground/40" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          No clinical records found
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {searchTerm || dateFrom || dateTo || consentFilter !== "all"
                            ? "Try adjusting your search terms or date filters."
                            : "Clinical histories and dental case sheets recorded for patients will appear here."}
                        </p>
                        {(searchTerm || dateFrom || dateTo || consentFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="mt-2 text-xs"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((item) => {
                    const patientName = item.patient
                      ? `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim()
                      : "Patient Record";
                    const patientId =
                      item.patient?.id || item.patient_id || item.patientId;

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* DATE */}
                        <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          <div className="font-semibold">
                            {item.date
                              ? moment(item.date).format("MMM DD, YYYY")
                              : moment(item.created_at).format("MMM DD, YYYY")}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {moment(item.created_at || item.date).format("hh:mm A")}
                          </span>
                        </TableCell>

                        {/* PATIENT */}
                        <TableCell>
                          <div className="flex flex-col">
                            {patientId ? (
                              <Link
                                href={`/patients/${patientId}`}
                                className="font-bold text-sm text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 group"
                              >
                                {patientName}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <span className="font-bold text-sm">{patientName}</span>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              {item.patient?.gender && <span>{item.patient.gender}</span>}
                              {item.patient?.age && <span>• {item.patient.age} yrs</span>}
                              {item.patient?.phone && <span>• {item.patient.phone}</span>}
                            </div>
                          </div>
                        </TableCell>

                        {/* CHIEF COMPLAINT */}
                        <TableCell>
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                            {item.chief_complaint || "—"}
                          </div>
                          {item.history_complaint && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1 italic">
                              HPI: {item.history_complaint}
                            </span>
                          )}
                        </TableCell>

                        {/* DIAGNOSIS */}
                        <TableCell>
                          {item.diagnosis ? (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2 py-0.5 border-teal-300 text-teal-800 dark:border-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30"
                            >
                              {item.diagnosis}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Pending evaluation
                            </span>
                          )}
                        </TableCell>

                        {/* CLINICIAN */}
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>{item.doctor_name || "Assigned Dentist"}</span>
                          </div>
                        </TableCell>

                        {/* CONSENT */}
                        <TableCell className="text-center">
                          {item.consent ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                            >
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                            >
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRecord(item)}
                            className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Case Sheet
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION BAR */}
          {!isLoading && records.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs text-muted-foreground">
              <div>
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {records.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {totalCount || records.length}
                </span>{" "}
                clinical case records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                <span className="text-xs px-2 font-medium">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL (CLEAN DASHED LINES CASE SHEET) */}
      {viewingRecord && viewingPatient && (
        <MedicalHistoryViewModal
          patient={viewingPatient}
          record={viewingRecord}
          isOpen={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
        />
      )}
    </div>
  );
}
