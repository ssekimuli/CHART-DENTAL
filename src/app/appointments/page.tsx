
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
import { appointments as initialAppointments, patients as allPatients } from "@/lib/data";
import { useState, useMemo } from "react";
import type { Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AppointmentForm } from "./components/appointment-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function AppointmentsPage() {
  const { selectedBranch } = useBranch();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(initialAppointments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const filteredPatients = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch]);
  
  const appointments = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allAppointments.filter(a => a.branchId === selectedBranch);
    }
    return allAppointments.filter(a => a.branchId === currentUser.branchId);
  }, [selectedBranch, allAppointments]);


  const handleSaveAppointment = (data: Omit<Appointment, 'id' | 'branchId'>) => {
    const newAppointment: Appointment = {
      ...data,
      id: `a${allAppointments.length + 1}`,
      branchId: selectedBranch,
    };
    setAllAppointments(prev => [...prev, newAppointment]);
    setIsFormOpen(false);
  };

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
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Appointment
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{appointment.patientName}</div>
                      </TableCell>
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
                      <TableCell className="text-right">
                        {appointment.time}
                      </TableCell>
                    </TableRow>
                  ))}
                  {appointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
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
            patients={filteredPatients}
            onSave={handleSaveAppointment}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
