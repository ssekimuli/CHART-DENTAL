
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
import { Calendar } from "@/components/ui/calendar";
import { useState, useMemo, useEffect } from "react";
import type { Appointment, Employee, Patient, AppointmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash, Pencil, FileText, Send, Share2 } from "lucide-react";
import { AppointmentForm } from "./components/appointment-form";
import { useBranch } from "@/context/branch-context";
import {  hasRole , getCurrentUser } from "@/lib/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { getAppointments, getPatientList, getDoctors, createAppointment, updateAppointment, deleteAppointment } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DayContent, DayContentProps } from "react-day-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [bookingLink, setBookingLink] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [appointmentsData, patientsData, employeesData] = await Promise.all([
            getAppointments({ branch_id: selectedBranch, perPage: 1000 }),
            getPatientList(),
            getDoctors(selectedBranch)
        ]);
        setAllAppointments(appointmentsData);
        setAllPatients(patientsData as unknown as Patient[]);
        setAllEmployees(employeesData);
        setIsLoading(false);
    };
    fetchData();
  }, [selectedBranch]);

  const normalizedSelectedBranch = String(selectedBranch || '');
  const normalizedUserBranch = getCurrentUser()?.branchId ? String(getCurrentUser()?.branchId) : '';

  const filteredPatients = useMemo(() => {
     if (hasRole('Super Admin')) {
      return allPatients.filter(p => String(p.branchId) === normalizedSelectedBranch);
    }
    return allPatients.filter(p => String(p.branchId) === normalizedUserBranch);
  }, [normalizedSelectedBranch, normalizedUserBranch, allPatients]);

  const filteredDoctors = useMemo(() => {
    const doctors = allEmployees.filter(e => e.role === 'Dentist');
    if (hasRole('Super Admin')) {
      return normalizedSelectedBranch
        ? doctors.filter(d => String(d.branchId) === normalizedSelectedBranch)
        : doctors;
    }
    return normalizedUserBranch
      ? doctors.filter(d => String(d.branchId) === normalizedUserBranch)
      : doctors;
  }, [normalizedSelectedBranch, normalizedUserBranch, allEmployees]);
  
  const branchAppointments = useMemo(() => {
    if (hasRole('Super Admin')) {
      return allAppointments.filter(a => String(a.branchId) === normalizedSelectedBranch);
    }
    return allAppointments.filter(a => String(a.branchId) === normalizedUserBranch);
  }, [normalizedSelectedBranch, normalizedUserBranch, allAppointments]);

  const appointmentsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    return branchAppointments.filter(a => a.date === formattedDate);
  }, [selectedDate, branchAppointments]);

  const appointmentsByDate = useMemo(() => {
    return branchAppointments.reduce((acc, appointment) => {
      const date = appointment.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);
  }, [branchAppointments]);

  const handleOpenForm = (appointment?: Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setSelectedAppointment(undefined);
    setIsFormOpen(false);
  }

  const handleSaveAppointment = async (data: Omit<Appointment, 'id' | 'branchId'>) => {
    try {
        if (selectedAppointment) {
            // Update
            const updated = await updateAppointment(selectedAppointment.id, data);
            if (updated) {
              setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
              toast({ title: "Success", description: "Appointment updated successfully." });
            }
        } else {
            // Create
            const payload = {
              patient_name: data.patientName,
              patient_id: data.patientId,
              doctor_name: data.doctorName,
              doctor_id: data.doctorId,
              treatment: data.treatment,
              date: data.date,
              time: data.time,
              branch_id: Number(selectedBranch || getCurrentUser()?.branchId),
            };

            const newAppointment = await createAppointment(payload);
            if (newAppointment) {
              setAllAppointments(prev => [...prev, newAppointment]);
              toast({ title: "Success", description: "Appointment created successfully." });
            }
        }
    } catch (e: any) {
        toast({ title: "Error", description: e.message || "Failed to save appointment.", variant: "destructive" });
    }
    handleCloseForm();
  };

  const handleDeleteAppointment = async () => {
    if (selectedAppointment) {
        await deleteAppointment(selectedAppointment.id);
        setAllAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedAppointment(undefined);
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteAlertOpen(true);
  }

  const handleGoToChart = (patientId: string | number) => {
    router.push(`/patients/${String(patientId)}/charting`);
  }

  const handleSendToQueue = async (appointment: Appointment) => {
    const updated = await updateAppointment(appointment.id, { status: "Waiting" });
    if (updated) {
      setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
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
        return "default"; // Or another color
    }
  };

  const getBadgeClassForCount = (count: number) => {
    if (count > 6) return 'appointment-count-high';
    if (count > 3) return 'appointment-count-medium';
    return 'appointment-count-low';
  }

  const CustomDay = (props: DayContentProps) => {
    const date = format(props.date, 'yyyy-MM-dd');
    const count = appointmentsByDate[date];
    const content = (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <span>{props.date.getDate()}</span>
        {count > 0 && (
          <div className={cn("appointment-indicator", getBadgeClassForCount(count))}></div>
        )}
      </div>
    );
  
    if (count > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p>{count} appointment{count > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  
    return <DayContent {...props} />;
  };


  return (
    <>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                components={{
                  DayContent: CustomDay,
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>
                  {selectedDate ? `Showing appointments for ${format(selectedDate, 'PPP')}` : 'Select a date to view appointments.'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || '';
                    const link = `${baseUrl}/book-appointment`;
                    setBookingLink(link);
                    setIsShareDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Booking Link
                </Button>
                <Button onClick={() => handleOpenForm()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentsForDate.map((appointment) => (
                    <TableRow 
                      key={appointment.id}
                      onDoubleClick={() => handleGoToChart(appointment.patientId)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                       <TableCell>
                        <div className="font-bold">{appointment.tokenNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{appointment.patientName}</div>
                      </TableCell>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>{appointment.treatment}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(appointment.status)}
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenForm(appointment)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendToQueue(appointment)} disabled={appointment.status !== 'Scheduled'}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send to Queue
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(appointment)}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {appointmentsForDate.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No appointments scheduled for this day.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {isFormOpen && (
        <AppointmentForm 
            appointment={selectedAppointment}
            patients={filteredPatients}
            doctors={filteredDoctors}
            appointments={branchAppointments}
            onSave={handleSaveAppointment}
            onOpenChange={handleCloseForm}
        />
      )}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAppointment(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Booking Link</DialogTitle>
            <DialogDescription>
              Copy and share this link with patients to book appointments
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="bg-muted p-3 rounded-md break-all text-sm font-mono">
              {bookingLink}
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(bookingLink);
                toast({
                  title: "Copied",
                  description: "Booking link copied to clipboard."
                });
                setIsShareDialogOpen(false);
              }}
              className="w-full"
            >
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    

    

    

    