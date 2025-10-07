
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
import { appointments as initialAppointments, patients as allPatients, employees as allEmployees } from "@/lib/data";
import { useState, useMemo } from "react";
import type { Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash, Pencil } from "lucide-react";
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

export default function AppointmentsPage() {
  const { selectedBranch } = useBranch();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(initialAppointments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const filteredPatients = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch]);

  const filteredDoctors = useMemo(() => {
    const doctors = allEmployees.filter(e => e.role === 'Dentist');
    if (currentUser.role === 'Super Admin') {
      return doctors.filter(d => d.branchId === selectedBranch);
    }
    return doctors.filter(d => d.branchId === currentUser.branchId);
  }, [selectedBranch]);
  
  const appointments = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allAppointments.filter(a => a.branchId === selectedBranch);
    }
    return allAppointments.filter(a => a.branchId === currentUser.branchId);
  }, [selectedBranch, allAppointments]);

  const handleOpenForm = (appointment?: Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setSelectedAppointment(undefined);
    setIsFormOpen(false);
  }

  const handleSaveAppointment = (data: Omit<Appointment, 'id' | 'branchId'>) => {
    if (selectedAppointment) {
        // Update
        const updatedAppointment = { ...selectedAppointment, ...data };
        setAllAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
    } else {
        // Create
        const newAppointment: Appointment = {
            ...data,
            id: `a${allAppointments.length + 1}`,
            branchId: selectedBranch,
        };
        setAllAppointments(prev => [...prev, newAppointment]);
    }
    handleCloseForm();
  };

  const handleDeleteAppointment = () => {
    if (selectedAppointment) {
        setAllAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedAppointment(undefined);
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteAlertOpen(true);
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
                  Manage and view patient appointments.
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Appointment
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
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
                  {appointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No appointments scheduled for this branch.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
