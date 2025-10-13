
"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Appointment, Employee, AppointmentStatus } from "@/lib/types";
import { getTodaysQueue, getEmployees, updateAppointment, announcePatientInQueue } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import { currentUser, hasPermission } from "@/lib/user";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, UserCheck, CheckCircle, PauseCircle, Ban, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type StatusColumn = {
  title: string;
  statuses: AppointmentStatus[];
  icon: React.ReactNode;
};

const statusColumns: StatusColumn[] = [
  { title: "Waiting", statuses: ["Waiting"], icon: <Clock className="h-5 w-5 text-blue-500" /> },
  { title: "In Session", statuses: ["In Session"], icon: <UserCheck className="h-5 w-5 text-yellow-500" /> },
  { title: "On Hold", statuses: ["On Hold"], icon: <PauseCircle className="h-5 w-5 text-orange-500" /> },
  { title: "Completed", statuses: ["Completed"], icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
];

function playNotificationSound() {
    if (typeof window === 'undefined') return;
    const audioContext = new (window.AudioContext)();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
  
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
  
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
  
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

export default function QueuePage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [doctorFilter, setDoctorFilter] = useState<string>("all");
    const [isSpeaking, startTransition] = useTransition();
    const [currentlySpeaking, setCurrentlySpeaking] = useState<string | null>(null);

    const canUpdateAppointments = hasPermission('appointments:update');

    useEffect(() => {
        const fetchEmployees = async () => {
            const employeesData = await getEmployees();
            setAllEmployees(employeesData);
             if (currentUser.role === 'Dentist') {
                const currentUserEmployee = employeesData.find(e => e.email === currentUser.email);
                if (currentUserEmployee) {
                    setDoctorFilter(currentUserEmployee.id as string);
                }
            }
        }
        fetchEmployees();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const appointmentsData = await getTodaysQueue({
                branchId: selectedBranch,
                doctorId: doctorFilter !== 'all' ? doctorFilter : undefined,
            });
            setTodaysAppointments(appointmentsData);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, doctorFilter]);

    const doctorsInBranch = useMemo(() => {
        const doctors = allEmployees.filter(e => e.role === 'Dentist');
         if (currentUser.role === 'Super Admin') {
            return doctors.filter(d => String(d.branch_id) === String(selectedBranch));
        }
        return doctors.filter(d => String(d.branch_id) === String(currentUser.branchId));
    }, [allEmployees, selectedBranch]);
    
    const handleAnnounce = (appointment: Appointment) => {
        setCurrentlySpeaking(appointment.id as string);
        startTransition(async () => {
            const { audio_url } = await announcePatientInQueue(appointment.id);
            if (audio_url) {
                const audioPlayer = new Audio(audio_url);
                audioPlayer.play();
                audioPlayer.onended = () => setCurrentlySpeaking(null);
            } else {
                setCurrentlySpeaking(null);
            }
        });
    }

    const handleStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
        if (!canUpdateAppointments) return;
        const updated = await updateAppointment(appointment.id, { status });
        if (updated) {
            setTodaysAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
            if (status === 'In Session') {
                handleAnnounce(appointment);
            } else {
                playNotificationSound();
            }
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
                                    <SelectItem key={doc.id} value={String(doc.id)}>{doc.name}</SelectItem>
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
                        No patients in the queue for today in this branch.
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
                                     <Card key={appointment.id} className="flex flex-col isolate z-10 overflow-hidden">
                                        <CardHeader className="flex-col items-center gap-2 space-y-0 p-4 bg-background/50 border-b">
                                             <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 text-primary font-bold text-2xl">
                                                {isSpeaking && currentlySpeaking === appointment.id ? <Loader2 className="h-6 w-6 animate-spin"/> : appointment.tokenNumber}
                                             </div>
                                            <div className="text-center">
                                                <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-1 text-sm px-4 pt-4 pb-4">
                                            <p><strong>Time:</strong> {appointment.time}</p>
                                            <p><strong>Doctor:</strong> {appointment.doctorName}</p>
                                        </CardContent>
                                        <CardFooter className="flex-col items-stretch gap-2 bg-background/50 border-t p-2">
                                            <div className="flex items-center justify-between gap-1">
                                                <TooltipProvider>
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => handleStatusChange(appointment, 'Waiting')} disabled={!canUpdateAppointments}>
                                                                <Clock className="h-5 w-5"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Send to Waiting</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500 hover:text-yellow-600" onClick={() => handleStatusChange(appointment, 'In Session')} disabled={!canUpdateAppointments}>
                                                                <UserCheck className="h-5 w-5"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Begin Session</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600" onClick={() => handleStatusChange(appointment, 'On Hold')} disabled={!canUpdateAppointments}>
                                                                <PauseCircle className="h-5 w-5"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Put on Hold</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={() => handleStatusChange(appointment, 'Completed')} disabled={!canUpdateAppointments}>
                                                                <CheckCircle className="h-5 w-5"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>Mark as Completed</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-600" onClick={() => handleStatusChange(appointment, 'Scheduled')} disabled={!canUpdateAppointments}>
                                                                <Ban className="h-5 w-5"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>Return to Scheduled</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <Button variant="outline" size="sm" className="flex-grow" onClick={() => router.push(`/patients/${appointment.patientId}/charting`)}>Chart</Button>
                                            </div>
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
