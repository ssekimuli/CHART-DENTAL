"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
import { getXrayRequests, deleteXrayRequest, updateXrayRequest } from "@/lib/api";
import type { XrayRequest } from "@/lib/types";
import { XrayRequestFormModal } from "./components/xray-request-form-modal";
import { XrayRequestViewModal } from "./components/xray-request-view-modal";
import moment from "moment";
import {
  ScanLine,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Building2,
  DollarSign,
  FileText,
  User,
  Activity,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Trash2,
  Edit,
} from "lucide-react";

export default function RadiologyRequestsPage() {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();

  // State
  const [records, setRecords] = useState<XrayRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilterPreset, setDateFilterPreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<XrayRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<XrayRequest | null>(null);

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
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (facilityFilter !== "all") {
        params.facility = facilityFilter;
      }
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }

      const res = await getXrayRequests(params);
      setRecords(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.last_page || 1);
        setTotalCount(res.meta.total || (res.data?.length ?? 0));
      } else {
        setTotalPages(1);
        setTotalCount(res.data?.length || 0);
      }
    } catch (error) {
      console.error("Failed to load radiology requests:", error);
      toast({
        title: "Error Loading Requests",
        description: "Could not retrieve X-ray requests. Please try again.",
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
    statusFilter,
    facilityFilter,
    selectedBranch,
    toast,
  ]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Unique facilities for filter dropdown
  const facilityOptions = useMemo(() => {
    const list = new Set<string>();
    records.forEach((r) => {
      if (r.facility && r.facility.trim()) {
        list.add(r.facility.trim());
      }
    });
    return Array.from(list);
  }, [records]);

  // Metrics
  const stats = useMemo(() => {
    const totalOrders = totalCount || records.length;
    const pendingCount = records.filter((r) => r.status === "pending").length;
    const completedCount = records.filter((r) => r.status === "completed").length;
    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      total: totalOrders,
      pending: pendingCount,
      completed: completedCount,
      totalAmount,
    };
  }, [records, totalCount]);

  // Handlers
  const handleOpenNew = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (record: XrayRequest) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleView = (record: XrayRequest) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = async (
    record: XrayRequest,
    newStatus: "pending" | "completed" | "cancelled"
  ) => {
    try {
      await updateXrayRequest(record.id!, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `Requisition status marked as ${newStatus}.`,
      });
      fetchRecords();
    } catch (err) {
      toast({
        title: "Status Update Failed",
        description: "Could not change requisition status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this radiology request?")) return;
    try {
      await deleteXrayRequest(id);
      toast({
        title: "Requisition Deleted",
        description: "Radiology request has been removed.",
      });
      fetchRecords();
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: "Could not delete X-ray request.",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setDateFilterPreset("all");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setFacilityFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ScanLine className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Radiology Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage patient X-ray requisitions, imaging facilities & referral charges
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
            size="sm"
            onClick={handleOpenNew}
            className="h-9 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Requisition
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-teal-200/50 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Total Requisitions
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.total.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            All radiology orders on record
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Scans
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.pending}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Awaiting imaging or report
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Completed Scans
            </CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.completed}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Received & reviewed
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Total Amount
            </CardDescription>
            <CardTitle className="text-2xl font-black font-mono text-teal-700 dark:text-teal-400">
              {stats.totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Total referral & scan charges
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
                placeholder="Search patient name, phone, facility, scan type, notes or doctor..."
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

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[150px] h-10 text-xs">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Facility Filter */}
            {facilityOptions.length > 0 && (
              <Select
                value={facilityFilter}
                onValueChange={(val) => {
                  setFacilityFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[180px] h-10 text-xs">
                  <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilityOptions.map((fac) => (
                    <SelectItem key={fac} value={fac}>
                      {fac}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(searchTerm ||
              dateFilterPreset !== "all" ||
              statusFilter !== "all" ||
              facilityFilter !== "all" ||
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

      {/* DATA TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableHead className="w-[85px] text-xs font-bold uppercase">
                    Req #
                  </TableHead>
                  <TableHead className="w-[110px] text-xs font-bold uppercase">
                    Date
                  </TableHead>
                  <TableHead className="min-w-[170px] text-xs font-bold uppercase">
                    Patient
                  </TableHead>
                  <TableHead className="min-w-[160px] text-xs font-bold uppercase">
                    Facility
                  </TableHead>
                  <TableHead className="w-[110px] text-xs font-bold uppercase">
                    Amount
                  </TableHead>
                  <TableHead className="min-w-[170px] text-xs font-bold uppercase">
                    Scan / Region
                  </TableHead>
                  <TableHead className="min-w-[140px] text-xs font-bold uppercase">
                    Doctor
                  </TableHead>
                  <TableHead className="w-[110px] text-xs font-bold uppercase text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[110px] text-right text-xs font-bold uppercase pr-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ScanLine className="h-10 w-10 text-muted-foreground/40" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          No radiology requisitions found
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {searchTerm || dateFrom || dateTo || statusFilter !== "all"
                            ? "Try adjusting your search terms or filters."
                            : "Patient X-ray requisitions and diagnostic imaging orders will appear here."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenNew}
                          className="mt-2 text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Requisition
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((item) => {
                    const patientName = item.patient
                      ? `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim()
                      : "Patient Record";
                    const patientId =
                      item.patient?.id || item.patient_id;

                    const formattedAmount = Number(item.amount || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }
                    );

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* REQ # */}
                        <TableCell className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          #{String(item.id).padStart(5, "0")}
                        </TableCell>

                        {/* DATE */}
                        <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="font-semibold">
                            {item.request_date
                              ? moment(item.request_date).format("MMM DD, YYYY")
                              : moment(item.created_at).format("MMM DD, YYYY")}
                          </div>
                        </TableCell>

                        {/* PATIENT */}
                        <TableCell>
                          <div className="flex flex-col">
                            {patientId ? (
                              <Link
                                href={`/patients/${patientId}`}
                                className="font-bold text-sm text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 group whitespace-nowrap"
                              >
                                {patientName}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <span className="font-bold text-sm whitespace-nowrap">
                                {patientName}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              {item.patient?.gender && <span>{item.patient.gender}</span>}
                              {item.patient?.phone && <span>• {item.patient.phone}</span>}
                            </div>
                          </div>
                        </TableCell>

                        {/* FACILITY */}
                        <TableCell>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="truncate max-w-[180px]" title={item.facility}>
                              {item.facility}
                            </span>
                          </div>
                        </TableCell>

                        {/* AMOUNT */}
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formattedAmount}
                          </div>
                          {item.invoice_id ? (
                            <Link
                              href={`/billing`}
                              className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 mt-0.5 font-sans"
                            >
                              <span>Invoice #{item.invoice_id}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-muted-foreground block font-sans">
                              Unbilled
                            </span>
                          )}
                        </TableCell>

                        {/* SCAN TYPE / REGION */}
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.xray_type || "General Dental X-Ray"}
                          </div>
                          {item.tooth_region && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={item.tooth_region}>
                              {item.tooth_region}
                            </div>
                          )}
                        </TableCell>

                        {/* DOCTOR */}
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[140px] block" title={item.doctor_name || "Assigned Doctor"}>
                            {item.doctor_name || "—"}
                          </span>
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="text-center whitespace-nowrap">
                          {item.status === "completed" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                            >
                              Completed
                            </Badge>
                          ) : item.status === "cancelled" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400"
                            >
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                            >
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* ACTION */}
                        <TableCell className="text-right pr-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(item)}
                              className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                            >
                              <FileText className="mr-1 h-3.5 w-3.5" /> Sheet
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuLabel>Requisition Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleView(item)}>
                                  <Printer className="mr-2 h-3.5 w-3.5" /> View & Print Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold">
                                  Change Status
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, "completed")}>
                                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Mark Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, "pending")}>
                                  <Clock className="mr-2 h-3.5 w-3.5 text-amber-600" /> Mark Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, "cancelled")}>
                                  <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" /> Cancel Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item.id!)}
                                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Requisition
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                requisition records
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

      {/* FORM MODAL (CREATE / EDIT) */}
      <XrayRequestFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={editingRecord}
        onSuccess={() => {
          fetchRecords();
        }}
      />

      {/* VIEW & PRINT MODAL */}
      <XrayRequestViewModal
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        record={viewingRecord}
        onEdit={(rec) => {
          handleEdit(rec);
        }}
      />
    </div>
  );
}
