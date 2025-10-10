
"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle } from "lucide-react";
import type { AttendanceRecord, Employee, AttendanceStatus } from "@/lib/types";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import { getAttendance, getEmployees, markAttendance } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AttendanceForm } from "../components/attendance-form";


export default function AttendancePage() {
    const { selectedBranch } = useBranch();
    const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [attendance, employees] = await Promise.all([getAttendance(), getEmployees()]);
            setAllAttendance(attendance);
            setAllEmployees(employees);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const filteredEmployees = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allEmployees.filter(e => e.branchId === selectedBranch);
        }
        return allEmployees.filter(e => e.branchId === currentUser.branchId);
      }, [selectedBranch, allEmployees]);

      const attendanceForDate = useMemo(() => {
        if (!selectedDate) return [];
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        
        const dateRecords = new Map(
            allAttendance
                .filter(a => a.date === formattedDate && a.branchId === selectedBranch)
                .map(a => [a.employeeId, a])
        );

        return filteredEmployees.map(emp => {
            const record = dateRecords.get(emp.id);
            return {
                id: record?.id ?? `placeholder-${emp.id}`,
                employeeId: emp.id,
                employeeName: emp.name,
                date: formattedDate,
                status: record?.status ?? 'Absent',
                checkIn: record?.checkIn,
                checkOut: record?.checkOut,
                branchId: selectedBranch,
            };
        });

    }, [selectedDate, allAttendance, filteredEmployees, selectedBranch]);


    const handleSaveAttendance = async (data: Omit<AttendanceRecord, 'id' | 'employeeName'>) => {
        const newRecord = await markAttendance(data);
        if (newRecord) {
            setAllAttendance(prev => {
                const existingIndex = prev.findIndex(att => att.employeeId === newRecord.employeeId && att.date === newRecord.date);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = newRecord;
                    return updated;
                }
                return [...prev, newRecord];
            });
        }
        setIsFormOpen(false);
    };

    const handleQuickMark = async (employeeId: string, status: AttendanceStatus) => {
        if (!selectedDate) return;

        const employee = filteredEmployees.find(e => e.id === employeeId);
        if (!employee) return;

        const attendanceData: Omit<AttendanceRecord, 'id' | 'employeeName'> = {
            employeeId,
            date: format(selectedDate, "yyyy-MM-dd"),
            status,
            branchId: employee.branchId,
        };

        if (status === 'Present') {
            attendanceData.checkIn = "09:00 AM";
        }
        
        const newRecord = await markAttendance(attendanceData);
        if (newRecord) {
            setAllAttendance(prev => {
                const existingIndex = prev.findIndex(att => att.employeeId === newRecord.employeeId && att.date === newRecord.date);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = newRecord;
                    return updated;
                }
                return [...prev, newRecord];
            });
        }
    }


    const getStatusVariant = (status: AttendanceRecord['status']) => {
        switch (status) {
            case "Present": return "secondary";
            case "Absent": return "destructive";
            case "On Leave": return "outline";
        }
    }

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
                    />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                    <CardTitle>Attendance</CardTitle>
                    <CardDescription>
                        {selectedDate ? `Showing attendance for ${format(selectedDate, 'PPP')}` : 'Select a date'}
                    </CardDescription>
                    </div>
                    <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2" />
                    Mark Attendance
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
                                <TableHead>Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceForDate.map((record) => (
                                <TableRow key={record.employeeId}>
                                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                                    </TableCell>
                                    <TableCell>{record.checkIn || 'N/A'}</TableCell>
                                    <TableCell>{record.checkOut || 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickMark(record.employeeId, 'Present')}
                                            disabled={record.status === 'Present'}
                                        >
                                            Present
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickMark(record.employeeId, 'Absent')}
                                            disabled={record.status === 'Absent'}
                                        >
                                            Absent
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {attendanceForDate.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No employees in this branch.
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
            <AttendanceForm
                employees={filteredEmployees}
                onSave={handleSaveAttendance}
                onOpenChange={setIsFormOpen}
                selectedDate={selectedDate}
            />
        )}
    </>
  );
}
