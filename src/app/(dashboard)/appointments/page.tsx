
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
import type { Appointment, Employee, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash, Pencil, FileText } from "lucide-react";
import { AppointmentForm } from "./components/appointment-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
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
  import { getAppointments, getPatients, getEmployees, createAppointment, updateAppointment, deleteAppointment } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [appointmentsData, patientsData, employeesData] = await Promise.all([
            getAppointments(),
            getPatients(),
            getEmployees()
        ]);
        setAllAppointments(appointmentsData);
        setAllPatients(patientsData);
        setAllEmployees(employeesData);
        setIsLoading(false);
    };
    fetchData();
  }, []);

  const filteredPatients = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch, allPatients]);

  const filteredDoctors = useMemo(() => {
    const doctors = allEmployees.filter(e => e.role === 'Dentist');
    if (currentUser.role === 'Super Admin') {
      return doctors.filter(d => d.branchId === selectedBranch);
    }
    return doctors.filter(d => d.branchId === currentUser.branchId);
  }, [selectedBranch, allEmployees]);
  
  const branchAppointments = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allAppointments.filter(a => a.branchId === selectedBranch);
    }
    return allAppointments.filter(a => a.branchId === currentUser.branchId);
  }, [selectedBranch, allAppointments]);

  const appointmentsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    return branchAppointments.filter(a => a.date === formattedDate);
  }, [selectedDate, branchAppointments]);

  const appointmentDates = useMemo(() => {
    return branchAppointments.map(a => new Date(a.date));
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
    if (selectedAppointment) {
        // Update
        const updated = await updateAppointment(selectedAppointment.id, data);
        if (updated) {
          setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
    } else {
        // Create
        const newAppointment = await createAppointment({ ...data, branchId: selectedBranch });
        if (newAppointment) {
          setAllAppointments(prev => [...prev, newAppointment]);
        }
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

  const handleGoToChart = (patientId: string) => {
    router.push(`/patients/${patientId}/charting`);
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>
                  {selectedDate ? `Showing appointments for ${format(selectedDate, 'PPP')}` : 'Select a date to view appointments.'}
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Appointment
              </Button>
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
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{appointment.patientName}</div>
                      </TableCell>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>{appointment.treatment}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === "Scheduled"
                              ? "default"
                              : appointment.status === "Completed"
                              ? "secondary"
                              : "destructive"
                          }
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
                      <TableCell colSpan={6} className="h-24 text-center">
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
        <div>
          <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                modifiers={{
                    hasAppointment: appointmentDates
                }}
                modifiersClassNames={{
                    hasAppointment: 'has-appointment'
                }}
              />
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
    </>
  );
}
