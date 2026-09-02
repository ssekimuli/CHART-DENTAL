
"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Appointment, Employee, AppointmentStatus } from "@/lib/types";
import { getTodaysQueue, getEmployees, updateAppointment, announcePatientInQueue } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import {  hasPermission, hasRole , getCurrentUser } from "@/lib/user";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  UserCheck, 
  CheckCircle, 
  PauseCircle, 
  Loader2, 
  Volume2, 
  Activity, 
  UserRound, 
  ChevronRight, 
  Calendar,
  Sparkles,
  Move
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type StatusColumn = {
  title: string;
  statuses: AppointmentStatus[];
  icon: React.ReactNode;
  themeColor: string;
  borderHoverColor: string;
  badgeBg: string;
  textColor: string;
};

const statusColumns: StatusColumn[] = [
  { 
    title: "Waiting", 
    statuses: ["Waiting"], 
    icon: <Clock className="h-4 w-4" />, 
    themeColor: "border-t-sky-500", 
    borderHoverColor: "border-sky-300 bg-sky-50/20",
    badgeBg: "bg-sky-50 text-sky-600 border-sky-100",
    textColor: "text-sky-700"
  },
  { 
    title: "In Session", 
    statuses: ["In Session"], 
    icon: <UserCheck className="h-4 w-4 animate-pulse" />, 
    themeColor: "border-t-amber-500", 
    borderHoverColor: "border-amber-300 bg-amber-50/20",
    badgeBg: "bg-amber-50 text-amber-600 border-amber-100",
    textColor: "text-amber-700"
  },
  { 
    title: "On Hold", 
    statuses: ["On Hold"], 
    icon: <PauseCircle className="h-4 w-4" />, 
    themeColor: "border-t-orange-500", 
    borderHoverColor: "border-orange-300 bg-orange-50/20",
    badgeBg: "bg-orange-50 text-orange-600 border-orange-100",
    textColor: "text-orange-700"
  },
  { 
    title: "Completed", 
    statuses: ["Completed"], 
    icon: <CheckCircle className="h-4 w-4" />, 
    themeColor: "border-t-emerald-500", 
    borderHoverColor: "border-emerald-300 bg-emerald-50/20",
    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
    const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

    const canUpdateAppointments = hasPermission('appointments:update');

    useEffect(() => {
        const fetchEmployees = async () => {
            const employeesData = await getEmployees();
            setAllEmployees(employeesData);
             if (hasRole('Dentist')) {
                const currentUserEmployee = employeesData.find(e => e.email === getCurrentUser()?.email);
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
        return doctors.filter(d => String(d.branchId || '') === String(getCurrentUser()?.branchId));
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

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
        if (!canUpdateAppointments) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", String(appointment.id));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (columnTitle: string) => {
        setActiveDragCol(columnTitle);
    };

    const handleDrop = async (e: React.DragEvent, status: AppointmentStatus) => {
        e.preventDefault();
        setActiveDragCol(null);
        const appointmentId = e.dataTransfer.getData("text/plain");
        if (!appointmentId) return;
        
        const appointment = todaysAppointments.find(a => String(a.id) === appointmentId);
        if (appointment && appointment.status !== status) {
            await handleStatusChange(appointment, status);
        }
    };

  return (
    <div className="space-y-6">
        {/* Header Summary Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-[#A3D8E1]/30 rounded-3xl shadow-[0_10px_30px_rgba(44,63,77,0.02)]">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-[#2C3F4D] tracking-tight">Today's Queue</h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008B89]/10 text-[#008B89] text-[11px] font-bold animate-pulse border border-[#008B89]/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#008B89]"></span>
                        Live Dashboard
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-[#008B89]" />
                    <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
                </div>
            </div>

            {/* Top Toolbar filters */}
            <div className="flex flex-wrap items-center gap-3">
                {!hasRole('Dentist') && doctorsInBranch.length > 0 && (
                    <div className="w-full sm:w-60">
                        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                            <SelectTrigger className="h-10 bg-gray-50/50 border-[#A3D8E1]/40 rounded-xl focus:ring-[#008B89] focus:border-[#008B89] transition-all text-xs">
                                <div className="flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5 text-[#008B89]" />
                                    <SelectValue placeholder="Filter by Doctor" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#A3D8E1]/30 text-xs">
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
                <Skeleton className="h-[450px] w-full rounded-3xl" />
                <Skeleton className="h-[450px] w-full rounded-3xl" />
                <Skeleton className="h-[450px] w-full rounded-3xl" />
                <Skeleton className="h-[450px] w-full rounded-3xl" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                {statusColumns.map(column => {
                    const colAppointments = appointmentsByStatus(column.statuses);
                    const isDragOver = activeDragCol === column.title;
                    return (
                        <div 
                            key={column.title} 
                            onDragOver={handleDragOver}
                            onDragEnter={() => handleDragEnter(column.title)}
                            onDrop={(e) => handleDrop(e, column.statuses[0])}
                            className={`flex flex-col gap-3 rounded-2xl bg-[#E0F7F7]/30 border p-4 shadow-[0_5px_15px_rgba(44,63,77,0.01)] min-h-[480px] transition-all duration-200 ${
                                isDragOver 
                                    ? `${column.borderHoverColor} border-2 border-dashed scale-[1.01]` 
                                    : "border-[#A3D8E1]/20 bg-white"
                            }`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                               <div className="flex items-center gap-2">
                                   <div className={`p-1.5 rounded-lg ${column.badgeBg} border`}>
                                       {column.icon}
                                   </div>
                                   <h3 className="font-extrabold text-[#2C3F4D] text-sm tracking-tight">{column.title}</h3>
                               </div>
                               <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                   {colAppointments.length}
                               </span>
                            </div>

                            {/* Cards Stack */}
                            <div className="flex flex-col gap-3 overflow-y-auto max-h-[580px] pr-1">
                                {colAppointments.map(appointment => {
                                    const isAnnouncing = currentlySpeaking === appointment.id;
                                    return (
                                         <Card 
                                            key={appointment.id} 
                                            draggable={canUpdateAppointments}
                                            onDragStart={(e) => handleDragStart(e, appointment)}
                                            onDoubleClick={() => router.push(`/patients/${appointment.patientId}/charting`)}
                                            className={`relative flex flex-col bg-white border border-[#A3D8E1]/30 hover:border-[#008B89]/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing border-t-4 ${column.themeColor}`}
                                         >
                                            <div className="p-3.5 space-y-2.5">
                                                {/* Top row: Token badge, and voice call speaker button */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-extrabold bg-[#2C3F4D] text-white rounded-md flex items-center gap-0.5">
                                                        <Move className="h-2.5 w-2.5 text-gray-400" />
                                                        {appointment.tokenNumber}
                                                    </span>

                                                    {/* Voice Announce Button */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAnnounce(appointment);
                                                                    }}
                                                                    className={`h-7 w-7 rounded-lg border border-gray-100 flex-shrink-0 transition-all duration-300 ${
                                                                        isAnnouncing 
                                                                            ? "bg-[#008B89]/10 border-[#008B89]/20 text-[#008B89]" 
                                                                            : "hover:bg-[#E0F7F7] hover:text-[#008B89] text-gray-400"
                                                                    }`}
                                                                >
                                                                    {isSpeaking && isAnnouncing ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin text-[#008B89]"/>
                                                                    ) : isAnnouncing ? (
                                                                        <div className="flex items-center gap-0.5 h-2.5">
                                                                            <span className="w-0.5 h-1.5 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s]"></span>
                                                                            <span className="w-0.5 h-2.5 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                                                                            <span className="w-0.5 h-1 bg-[#008B89] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></span>
                                                                        </div>
                                                                    ) : (
                                                                        <Volume2 className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="rounded-lg text-[10px] p-2">
                                                                <p>Announce Patient</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                {/* Second row: Patient Name */}
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-extrabold text-[#2C3F4D] truncate" title={appointment.patientName}>
                                                        {appointment.patientName}
                                                    </h4>
                                                </div>

                                                {/* Third row: Treatment and Time */}
                                                <div className="flex items-center justify-between gap-1.5 text-xs text-gray-500 border-t border-gray-50 pt-2">
                                                    <span className="font-semibold text-gray-700 bg-[#E0F7F7] text-[#008B89] px-2 py-0.5 rounded-md truncate max-w-[130px] text-[10px]">
                                                        {appointment.treatment || "Consultation"}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium flex-shrink-0">
                                                        <Clock className="h-3 w-3 text-[#008B89]" />
                                                        <span>{appointment.time}</span>
                                                    </div>
                                                </div>

                                                {/* Third row: Doctor and Chart action */}
                                                <div className="flex items-center justify-between gap-2 border-t border-gray-50 pt-2">
                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[110px]" title={`Dr. ${appointment.doctorName}`}>
                                                        Dr. {appointment.doctorName.split(' ').pop()}
                                                    </span>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/patients/${appointment.patientId}/charting`);
                                                        }}
                                                        className="h-7 px-2.5 bg-[#008B89] hover:bg-[#008B89]/90 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-0.5"
                                                    >
                                                        Chart <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                         </Card>
                                    );
                                })}

                                {colAppointments.length === 0 && (
                                     <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center">
                                         <p className="text-[11px] text-muted-foreground font-medium">No patients in status</p>
                                         <p className="text-[9px] text-gray-400 mt-0.5">Drag card here to move</p>
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
