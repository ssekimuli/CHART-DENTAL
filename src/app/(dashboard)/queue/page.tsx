
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
import type { Appointment, Employee, AppointmentStatus } from "@/lib/types";
import { getAppointments, getEmployees, updateAppointment } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, UserCheck, CheckCircle, PauseCircle, Ban } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusColumn = {
  title: string;
  statuses: AppointmentStatus[];
  icon: React.ReactNode;
};

const statusColumns: StatusColumn[] = [
  { title: "Waiting", statuses: ["Scheduled", "Waiting"], icon: <Clock className="h-5 w-5 text-blue-500" /> },
  { title: "In Session", statuses: ["In Session"], icon: <UserCheck className="h-5 w-5 text-yellow-500" /> },
  { title: "On Hold", statuses: ["On Hold"], icon: <PauseCircle className="h-5 w-5 text-orange-500" /> },
  { title: "Completed", statuses: ["Completed"], icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
];

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
            
            if (currentUser.role === 'Dentist') {
                // This is a mock email, in a real app this would be from the user session
                const currentUserEmployee = employeesData.find(e => e.email === 'lisa.cuddy@example.com');
                if (currentUserEmployee) {
                    setDoctorFilter(currentUserEmployee.id);
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const doctorsInBranch = useMemo(() => {
        const doctors = allEmployees.filter(e => e.role === 'Dentist');
         if (currentUser.role === 'Super Admin') {
            return doctors.filter(d => d.branchId === selectedBranch);
        }
        return doctors.filter(d => d.branchId === currentUser.branchId);
    }, [allEmployees, selectedBranch]);
    
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


    const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
        const appointment = allAppointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const updated = await updateAppointment(appointmentId, { status });
        if (updated) {
            setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
    }
    
    const appointmentsByStatus = (statuses: AppointmentStatus[]) => {
        return todaysAppointments.filter(a => statuses.includes(a.status));
    }


  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Today's Queue</CardTitle>
                    <CardDescription>Patient queue for {format(new Date(), "PPP")}</CardDescription>
                </div>
                {currentUser.role !== 'Dentist' && doctorsInBranch.length > 0 && (
                    <div className="w-full sm:w-auto sm:max-w-xs">
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
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                ) : todaysAppointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No appointments scheduled for today in this branch.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {statusColumns.map(column => (
                            <div key={column.title} className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
                               <div className="flex items-center gap-2">
                                   {column.icon}
                                   <h3 className="font-semibold">{column.title} ({appointmentsByStatus(column.statuses).length})</h3>
                               </div>
                               <div className="flex flex-col gap-4">
                                {appointmentsByStatus(column.statuses).map(appointment => (
                                     <Card key={appointment.id} className="flex flex-col">
                                        <CardHeader className="flex-row items-start gap-3 space-y-0">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={`https://picsum.photos/seed/${appointment.patientId}/200/200`} />
                                                <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <CardTitle className="text-base">{appointment.patientName}</CardTitle>
                                                <p className="text-xs text-muted-foreground">{appointment.treatment}</p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-1 text-sm pt-0">
                                            <p><strong>Time:</strong> {appointment.time}</p>
                                            <p><strong>Doctor:</strong> {appointment.doctorName}</p>
                                        </CardContent>
                                        <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:justify-end sm:items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="sm" className="flex-grow sm:flex-grow-0">Change Status</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'Waiting')}>
                                                        <Clock className="mr-2 h-4 w-4"/> Waiting
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'In Session')}>
                                                        <UserCheck className="mr-2 h-4 w-4"/> In Session
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'On Hold')}>
                                                        <PauseCircle className="mr-2 h-4 w-4"/> On Hold
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'Completed')}>
                                                        <CheckCircle className="mr-2 h-4 w-4"/> Completed
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem className="text-red-500" onClick={() => handleStatusChange(appointment.id, 'Cancelled')}>
                                                        <Ban className="mr-2 h-4 w-4"/> Cancelled
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button variant="outline" size="sm" className="flex-grow sm:flex-grow-0" onClick={() => router.push(`/patients/${appointment.patientId}/charting`)}>Chart</Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                                {appointmentsByStatus(column.statuses).length === 0 && (
                                    <p className="text-sm text-center text-muted-foreground py-4">No patients in this status.</p>
                                )}
                               </div>
                           </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    