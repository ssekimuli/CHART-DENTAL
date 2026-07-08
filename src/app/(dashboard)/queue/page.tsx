
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
import { currentUser, hasPermission, hasRole } from "@/lib/user";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  UserCheck, 
  CheckCircle, 
  PauseCircle, 
  Ban, 
  Loader2, 
  Volume2, 
  User, 
  Activity, 
  UserRound, 
  ChevronRight, 
  Calendar,
  Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type StatusColumn = {
  title: string;
  statuses: AppointmentStatus[];
  icon: React.ReactNode;
  themeColor: string;
  glowColor: string;
  badgeBg: string;
  textColor: string;
};

const statusColumns: StatusColumn[] = [
  { 
    title: "Waiting", 
    statuses: ["Waiting"], 
    icon: <Clock className="h-5 w-5" />, 
    themeColor: "border-t-sky-500", 
    glowColor: "shadow-sky-500/5",
    badgeBg: "bg-sky-500/10 text-sky-600 border-sky-200/50",
    textColor: "text-sky-700"
  },
  { 
    title: "In Session", 
    statuses: ["In Session"], 
    icon: <UserCheck className="h-5 w-5 animate-pulse" />, 
    themeColor: "border-t-amber-500", 
    glowColor: "shadow-amber-500/5",
    badgeBg: "bg-amber-500/10 text-amber-600 border-amber-200/50",
    textColor: "text-amber-700"
  },
  { 
    title: "On Hold", 
    statuses: ["On Hold"], 
    icon: <PauseCircle className="h-5 w-5" />, 
    themeColor: "border-t-orange-500", 
    glowColor: "shadow-orange-500/5",
    badgeBg: "bg-orange-500/10 text-orange-600 border-orange-200/50",
    textColor: "text-orange-700"
  },
  { 
    title: "Completed", 
    statuses: ["Completed"], 
    icon: <CheckCircle className="h-5 w-5" />, 
    themeColor: "border-t-emerald-500", 
    glowColor: "shadow-emerald-500/5",
    badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
    textColor: "text-emerald-700"
  },
];

function playNotificationSound() {
    if (typeof window === 'undefined') return;
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
      
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
      
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5 note
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.4);
      
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        console.error("Audio Context failed:", e);
    }
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
             if (hasRole('Dentist')) {
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
        if (hasRole('Super Admin')) {
            return doctors.filter(d => String(d.branchId || '') === String(selectedBranch));
        }
        return doctors.filter(d => String(d.branchId || '') === String(currentUser.branchId));
    }, [allEmployees, selectedBranch]);
    
    const handleAnnounce = (appointment: Appointment) => {
        setCurrentlySpeaking(appointment.id as string);
        startTransition(async () => {
            try {
                const { audio_url } = await announcePatientInQueue(appointment.id);
                if (audio_url) {
                    const audioPlayer = new Audio(audio_url);
                    audioPlayer.play();
                    audioPlayer.onended = () => setCurrentlySpeaking(null);
                } else {
                    setCurrentlySpeaking(null);
                }
            } catch (e) {
                console.error("Announcement failed:", e);
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
    <div className="space-y-6">
        {/* Header Summary Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-[#A3D8E1]/30 rounded-3xl shadow-[0_10px_30px_rgba(44,63,77,0.02)]">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-[#2C3F4D] tracking-tight">Today's Queue</h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold animate-pulse border border-emerald-200/30">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Live Dashboard
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-[#008B89]" />
                    <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
                </div>
            </div>

            {/* Top Toolbar filters */}
            <div className="flex flex-wrap items-center gap-3">
                {!hasRole('Dentist') && doctorsInBranch.length > 0 && (
                    <div className="w-full sm:w-64">
                        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                            <SelectTrigger className="h-11 bg-gray-50/50 border-[#A3D8E1]/40 rounded-xl focus:ring-[#008B89] focus:border-[#008B89] transition-all">
                                <div className="flex items-center gap-2">
                                    <UserRound className="h-4 w-4 text-[#008B89]" />
                                    <SelectValue placeholder="Filter by Doctor" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#A3D8E1]/30">
                                <SelectItem value="all">All Doctors</SelectItem>
                                {doctorsInBranch.map(doc => (
                                    <SelectItem key={doc.id} value={String(doc.id)}>{doc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>

        {/* Board */}
        {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-[500px] w-full rounded-3xl" />
                <Skeleton className="h-[500px] w-full rounded-3xl" />
                <Skeleton className="h-[500px] w-full rounded-3xl" />
                <Skeleton className="h-[500px] w-full rounded-3xl" />
            </div>
        ) : todaysAppointments.length === 0 ? (
            <Card className="border border-dashed border-[#A3D8E1]/60 bg-white/50 backdrop-blur-sm rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="h-16 w-16 bg-[#E0F7F7] text-[#008B89] rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                        <Activity className="h-8 w-8 animate-pulse" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                        <h3 className="text-lg font-bold text-[#2C3F4D]">Queue is Empty</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            There are currently no patients checked into today's queue for this branch. Checked-in appointments will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {statusColumns.map(column => {
                    const colAppointments = appointmentsByStatus(column.statuses);
                    return (
                        <div 
                            key={column.title} 
                            className="flex flex-col gap-4 rounded-3xl bg-white border border-[#A3D8E1]/20 p-5 shadow-[0_10px_30px_rgba(44,63,77,0.02)] min-h-[500px]"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                               <div className="flex items-center gap-2.5">
                                   <div className={`p-2 rounded-xl ${column.badgeBg} border`}>
                                       {column.icon}
                                   </div>
                                   <h3 className="font-extrabold text-[#2C3F4D] text-base tracking-tight">{column.title}</h3>
                               </div>
                               <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                                   {colAppointments.length}
                               </span>
                            </div>

                            {/* Cards Stack */}
                            <div className="flex flex-col gap-4 overflow-y-auto max-h-[650px] pr-1.5">
                                {colAppointments.map(appointment => {
                                    const isAnnouncing = currentlySpeaking === appointment.id;
                                    return (
                                         <Card 
                                            key={appointment.id} 
                                            className={`flex flex-col overflow-hidden bg-white border border-[#A3D8E1]/30 rounded-2xl shadow-[0_5px_15px_rgba(44,63,77,0.03)] hover:shadow-[0_15px_30px_rgba(44,63,77,0.07)] hover:border-[#008B89]/50 transition-all duration-300 border-t-4 ${column.themeColor} ${column.glowColor}`}
                                         >
                                            <CardHeader className="flex-col items-center gap-3 space-y-0 p-5 bg-gradient-to-b from-gray-50/50 to-white border-b border-gray-100">
                                                <div className="flex items-center justify-between w-full">
                                                    {/* Token Badge */}
                                                    <div className="px-3 py-1.5 rounded-lg bg-[#2C3F4D] text-white font-extrabold text-sm tracking-wide shadow-sm flex items-center gap-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-gray-300">No.</span>
                                                        {appointment.tokenNumber}
                                                    </div>

                                                    {/* Voice Announce Button */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleAnnounce(appointment)}
                                                                    className={`h-9 w-9 rounded-xl border border-gray-100 transition-all duration-300 ${
                                                                        isAnnouncing 
                                                                            ? "bg-[#008B89]/10 border-[#008B89]/30 text-[#008B89]" 
                                                                            : "hover:bg-[#E0F7F7] hover:text-[#008B89] text-gray-400"
                                                                    }`}
                                                                >
                                                                    {isSpeaking && isAnnouncing ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin text-[#008B89]"/>
                                                                    ) : isAnnouncing ? (
                                                                        <div className="flex items-center gap-0.5 h-3.5">
                                                                            <span className="w-0.5 h-2 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s]"></span>
                                                                            <span className="w-0.5 h-3 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                                                                            <span className="w-0.5 h-1.5 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></span>
                                                                        </div>
                                                                    ) : (
                                                                        <Volume2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Announce Patient</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                <div className="text-center space-y-1">
                                                    <CardTitle className="text-base font-bold text-[#2C3F4D] line-clamp-1">{appointment.patientName}</CardTitle>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F7F7] text-[#008B89] text-xs font-semibold border border-[#A3D8E1]/30">
                                                        <Sparkles className="h-3 w-3" />
                                                        {appointment.treatment || "Consultation"}
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-grow space-y-2.5 text-xs p-5 text-gray-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Appt Time</span>
                                                    <span className="font-bold text-[#2C3F4D] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{appointment.time}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Doctor</span>
                                                    <span className="font-medium text-[#2C3F4D]">{appointment.doctorName}</span>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="flex-col items-stretch gap-3 bg-gray-50/50 border-t border-gray-100 p-4">
                                                {/* Toolbar actions */}
                                                <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-gray-100 shadow-inner">
                                                    <TooltipProvider>
                                                         <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className={`h-8 w-8 rounded-lg transition-all ${
                                                                        appointment.status === 'Waiting' 
                                                                            ? "bg-sky-50 text-sky-600 shadow-sm" 
                                                                            : "text-gray-400 hover:text-sky-500 hover:bg-sky-50/50"
                                                                    }`} 
                                                                    onClick={() => handleStatusChange(appointment, 'Waiting')} 
                                                                    disabled={!canUpdateAppointments}
                                                                >
                                                                    <Clock className="h-4 w-4"/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Set as Waiting</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className={`h-8 w-8 rounded-lg transition-all ${
                                                                        appointment.status === 'In Session' 
                                                                            ? "bg-amber-50 text-amber-600 shadow-sm" 
                                                                            : "text-gray-400 hover:text-amber-500 hover:bg-amber-50/50"
                                                                    }`}
                                                                    onClick={() => handleStatusChange(appointment, 'In Session')} 
                                                                    disabled={!canUpdateAppointments}
                                                                >
                                                                    <UserCheck className="h-4 w-4"/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Call In Session</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                         <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className={`h-8 w-8 rounded-lg transition-all ${
                                                                        appointment.status === 'On Hold' 
                                                                            ? "bg-orange-50 text-orange-600 shadow-sm" 
                                                                            : "text-gray-400 hover:text-orange-500 hover:bg-orange-50/50"
                                                                    }`}
                                                                    onClick={() => handleStatusChange(appointment, 'On Hold')} 
                                                                    disabled={!canUpdateAppointments}
                                                                >
                                                                    <PauseCircle className="h-4 w-4"/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Put on Hold</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                         <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className={`h-8 w-8 rounded-lg transition-all ${
                                                                        appointment.status === 'Completed' 
                                                                            ? "bg-emerald-50 text-emerald-600 shadow-sm" 
                                                                            : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/50"
                                                                    }`}
                                                                    onClick={() => handleStatusChange(appointment, 'Completed')} 
                                                                    disabled={!canUpdateAppointments}
                                                                >
                                                                    <CheckCircle className="h-4 w-4"/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Mark Completed</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                         <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100" 
                                                                    onClick={() => handleStatusChange(appointment, 'Scheduled')} 
                                                                    disabled={!canUpdateAppointments}
                                                                >
                                                                    <Ban className="h-4 w-4"/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg">
                                                                <p>Remove from Queue</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                <Button 
                                                    onClick={() => router.push(`/patients/${appointment.patientId}/charting`)}
                                                    className="w-full h-9 bg-[#008B89] hover:bg-[#008B89]/90 text-white text-xs font-semibold rounded-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    Chart Patient
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </CardFooter>
                                         </Card>
                                    );
                                })}

                                {colAppointments.length === 0 && (
                                     <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center">
                                         <p className="text-xs text-muted-foreground font-medium">No patients in status</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}
