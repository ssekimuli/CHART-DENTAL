
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Appointment, Employee, Patient } from "@/lib/types";
import { getAppointments, getEmployees, getPatients, updateAppointment } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCheck, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function QueuePage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [doctorFilter, setDoctorFilter] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [appointmentsData, employeesData] = await Promise.all([
                getAppointments(),
                getEmployees()
            ]);
            setAllAppointments(appointmentsData);
            setAllEmployees(employeesData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const doctorsInBranch = useMemo(() => {
        return allEmployees.filter(e => e.role === 'Dentist' && e.branchId === selectedBranch);
    }, [allEmployees, selectedBranch]);
    
    // Set doctor filter to current user if they are a doctor
    useEffect(() => {
        if (currentUser.role === 'Dentist') {
            const currentUserEmployee = allEmployees.find(e => e.email === 'lisa.cuddy@example.com'); // mock user
            if (currentUserEmployee) {
                setDoctorFilter(currentUserEmployee.id);
            }
        }
    }, [allEmployees]);

    const todaysAppointments = useMemo(() => {
        const today = format(new Date(), "yyyy-MM-dd");
        let filtered = allAppointments.filter(
          (a) => a.branchId === selectedBranch && a.date === today && a.status !== 'Cancelled'
        );
        if (doctorFilter !== "all") {
          filtered = filtered.filter((a) => a.doctorId === doctorFilter);
        }
        return filtered.sort((a,b) => a.time.localeCompare(b.time));
      }, [allAppointments, selectedBranch, doctorFilter]);


    const handleStatusChange = async (appointmentId: string, status: "Waiting" | "In Session" | "Completed") => {
        const appointment = allAppointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const updated = await updateAppointment(appointmentId, { status });
        if (updated) {
            setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
    }
    
    const getStatusInfo = (status: Appointment['status']) => {
        switch (status) {
            case 'Waiting':
                return { icon: <Clock className="h-4 w-4" />, color: 'bg-blue-500' };
            case 'In Session':
                return { icon: <UserCheck className="h-4 w-4" />, color: 'bg-yellow-500' };
            case 'Completed':
                return { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500' };
            default: // Scheduled
                return { icon: <Clock className="h-4 w-4" />, color: 'bg-gray-400' };
        }
    };


  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Today's Queue</CardTitle>
                    <CardDescription>Patient queue for {format(new Date(), "PPP")}</CardDescription>
                </div>
                {currentUser.role === 'Super Admin' && doctorsInBranch.length > 0 && (
                    <div className="w-full max-w-xs">
                        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by doctor..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Doctors</SelectItem>
                                {doctorsInBranch.map(doc => (
                                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : todaysAppointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No appointments scheduled for today in this branch.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {todaysAppointments.map(appointment => {
                           const patient = getPatients().then(pats => pats.find(p => p.id === appointment.patientId));
                           const { icon, color } = getStatusInfo(appointment.status);
                           return (
                            <Card key={appointment.id} className="flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                     <div className={`relative h-12 w-12`}>
                                        <Avatar className="h-12 w-12">
                                            {/* This is a temporary fix for patient avatar */}
                                            <AvatarImage src={`https://picsum.photos/seed/${appointment.patientId}/200/200`} />
                                            <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-background ${color}`} title={appointment.status} />
                                     </div>
                                    <div>
                                        <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                    <p className="text-sm"><strong>Time:</strong> {appointment.time}</p>
                                    <p className="text-sm"><strong>Doctor:</strong> {appointment.doctorName}</p>
                                     <p className="text-sm flex items-center gap-2"><strong>Status:</strong> <Badge variant="outline">{appointment.status}</Badge></p>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/patients/${appointment.patientId}/charting`)}>View Chart</Button>
                                    {appointment.status === 'Scheduled' || appointment.status === 'Waiting' ? (
                                        <Button size="sm" onClick={() => handleStatusChange(appointment.id, 'In Session')}>Call Patient</Button>
                                    ): appointment.status === 'In Session' ? (
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(appointment.id, 'Completed')}>Mark as Complete</Button>
                                    ) : null}
                                </CardFooter>
                            </Card>
                           )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
