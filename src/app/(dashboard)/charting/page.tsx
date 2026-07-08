
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, Pencil, FileText, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientsTable } from "../patients/components/patients-table";
import { useBranch } from "@/context/branch-context";
import { useState, useMemo, useEffect } from "react";
import { currentUser, hasRole } from "@/lib/user";
import type { Patient, Appointment, AppointmentStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getPatients, getAppointments, updateAppointment, deleteAppointment } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";


export default function ChartingOverviewPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [patientsData, setPatientsData] = useState<Patient[]>([]);
    const [appointmentsData, setAppointmentsData] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [patientNameFilter, setPatientNameFilter] = useState("");
    const [doctorNameFilter, setDoctorNameFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            const patients = await getPatients();
            setPatientsData(patients);
            setIsLoading(false);
        }
        fetchPatients();
    }, [selectedBranch]);

    const normalizedSelectedBranch = String(selectedBranch || "");
    const normalizedUserBranch = currentUser.branchId ? String(currentUser.branchId) : '';
    const branchId = hasRole('Super Admin') ? normalizedSelectedBranch : normalizedUserBranch;

    // Fetch appointments with filters when any filter changes
    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoading(true);
            const filters: any = { branch_id: branchId };
            if (patientNameFilter) filters.search = patientNameFilter;
            if (statusFilter !== "all") filters.status = statusFilter;
            if (dateFilter) filters.date = dateFilter;
            const appointments = await getAppointments(filters);
            setAppointmentsData(appointments);
            setIsLoading(false);
        }
        if (branchId) {
            fetchAppointments();
        }
    }, [branchId, patientNameFilter, doctorNameFilter, statusFilter, dateFilter]);


    const handleGoToChart = (patientId: string | number) => {
        router.push(`/patients/${String(patientId)}/charting`);
    };

    const handleSendToQueue = async (appointment: Appointment) => {
        const updated = await updateAppointment(appointment.id, { status: "Waiting" });
        if (updated) {
            setAppointmentsData(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
    };

    const handleDeleteAppointment = async (appointment: Appointment) => {
        await deleteAppointment(appointment.id);
        setAppointmentsData(prev => prev.filter(a => a.id !== appointment.id));
    };

    const getStatusVariant = (status: AppointmentStatus) => {
        switch (status) {
            case "Scheduled":
                return "default";
            case "Completed":
                return "secondary";
            case "Cancelled":
                return "destructive";
            case "Waiting":
                return "outline";
            case "In Session":
            case "On Hold":
                return "default";
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>
                        All appointments for this branch. Showing {appointmentsData.length} appointment{appointmentsData.length !== 1 ? 's' : ''}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        <Input
                            placeholder="Filter by patient name..."
                            value={patientNameFilter}
                            onChange={(e) => setPatientNameFilter(e.target.value)}
                        />
                        <Input
                            placeholder="Filter by doctor name..."
                            value={doctorNameFilter}
                            onChange={(e) => setDoctorNameFilter(e.target.value)}
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Waiting">Waiting</SelectItem>
                                <SelectItem value="In Session">In Session</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Filter by date (YYYY-MM-DD)..."
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Doctor Name</TableHead>
                                    <TableHead>Treatment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointmentsData.length > 0 ? (
                                    appointmentsData.map((appointment) => (
                                        <TableRow key={appointment.id}>
                                            <TableCell className="font-bold">{appointment.tokenNumber}</TableCell>
                                            <TableCell>{appointment.patientName}</TableCell>
                                            <TableCell>{appointment.doctorName}</TableCell>
                                            <TableCell>{appointment.treatment}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(appointment.status)}>
                                                    {appointment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{appointment.date}</TableCell>
                                            <TableCell>{appointment.time}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleGoToChart(appointment.patientId)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Go to Chart
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSendToQueue(appointment)} disabled={appointment.status !== 'Scheduled'}>
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Send to Queue
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteAppointment(appointment)}>
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No appointments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
