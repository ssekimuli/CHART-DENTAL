
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
import { getAttendance, getEmployees, markAttendance } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AttendanceForm } from "../components/attendance-form";
import { Checkbox } from "@/components/ui/checkbox";
import { MassAttendanceForm } from "../components/mass-attendance-form";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";


export default function AttendancePage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMassFormOpen, setIsMassFormOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    
    useEffect(() => {
        if (!hasPermission('hrm:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchInitialData = async () => {
            setIsLoading(true);
            const [attendanceData, employeesData] = await Promise.all([
                getAttendance(selectedBranch),
                getEmployees(selectedBranch),
            ]);
            setAllAttendance(attendanceData);
            setEmployees(employeesData);
            setIsLoading(false);
        };
        fetchInitialData();
    }, [selectedBranch, router]);

    useEffect(() => {
        if (!selectedDate || !selectedBranch) return;
        const fetchAttendanceForDate = async () => {
             setIsLoading(true);
             const attendanceData = await getAttendance(selectedBranch);
             setAllAttendance(attendanceData);
             setIsLoading(false);
        }
        fetchAttendanceForDate();
    }, [selectedDate]);


      const attendanceForDate = useMemo(() => {
        if (!selectedDate) return [];
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        
        const dateRecords = new Map(
            allAttendance
                .filter(a => a.date === formattedDate)
                .map(a => [a.employeeId, a])
        );

        return employees.map(emp => {
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

    }, [selectedDate, allAttendance, employees, selectedBranch]);

    useEffect(() => {
        setSelectedEmployeeIds([]);
    }, [selectedDate, selectedBranch]);

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

    const handleMarkStatus = async (employeeIds: string[], status: AttendanceStatus, checkIn?: string, checkOut?: string) => {
        if (!selectedDate) return;
        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        const recordsToUpdate = employeeIds.map(empId => {
            const employee = employees.find(e => e.id === empId);
            if (!employee) return null;
            const record: Omit<AttendanceRecord, 'id' | 'employeeName'> = {
                employeeId: empId,
                date: formattedDate,
                status,
                branchId: employee.branchId,
                checkIn,
                checkOut,
            }
            if (status === 'Present' && !checkIn) {
                record.checkIn = "09:00 AM";
            }
            return record;
        }).filter(Boolean) as Omit<AttendanceRecord, 'id' | 'employeeName'>[];

        const updatedRecords = await Promise.all(recordsToUpdate.map(markAttendance));
        
        setAllAttendance(prev => {
            const newAttendance = [...prev];
            updatedRecords.forEach(newRecord => {
                if (newRecord) {
                    const existingIndex = newAttendance.findIndex(att => att.employeeId === newRecord.employeeId && att.date === newRecord.date);
                    if (existingIndex > -1) {
                        newAttendance[existingIndex] = newRecord;
                    } else {
                        newAttendance.push(newRecord);
                    }
                }
            })
            return newAttendance;
        });

        setSelectedEmployeeIds([]);
        setIsMassFormOpen(false);
    }


    const getStatusVariant = (status: AttendanceRecord['status']) => {
        switch (status) {
            case "Present": return "secondary";
            case "Absent": return "destructive";
            case "On Leave": return "outline";
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEmployeeIds(attendanceForDate.map(a => a.employeeId));
        } else {
            setSelectedEmployeeIds([]);
        }
    }

    const handleSelectSingle = (employeeId: string, checked: boolean) => {
        if (checked) {
            setSelectedEmployeeIds(prev => [...prev, employeeId]);
        } else {
            setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
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
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                    <CardTitle>Attendance</CardTitle>
                    <CardDescription>
                        {selectedDate ? `Showing attendance for ${format(selectedDate, 'PPP')}` : 'Select a date'}
                    </CardDescription>
                    </div>
                    {hasPermission('hrm:create') && (
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2" />
                            Mark Attendance
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                    <>
                    {hasPermission('hrm:update') && (
                        <div className="mb-4 flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsMassFormOpen(true)}
                                disabled={selectedEmployeeIds.length === 0}
                            >
                                Mark Selected as Present
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleMarkStatus(selectedEmployeeIds, 'Absent')}
                                disabled={selectedEmployeeIds.length === 0}
                            >
                                Mark Selected as Absent
                            </Button>
                            <span className="text-sm text-muted-foreground ml-auto">{selectedEmployeeIds.length} selected</span>
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {hasPermission('hrm:update') && (
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedEmployeeIds.length === attendanceForDate.length && attendanceForDate.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                )}
                                <TableHead>Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceForDate.map((record) => (
                                <TableRow key={record.employeeId}>
                                     {hasPermission('hrm:update') && (
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedEmployeeIds.includes(record.employeeId)}
                                                onCheckedChange={(checked) => handleSelectSingle(record.employeeId, !!checked)}
                                                aria-label={`Select ${record.employeeName}`}
                                            />
                                        </TableCell>
                                     )}
                                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                                    </TableCell>
                                    <TableCell>{record.checkIn || 'N/A'}</TableCell>
                                    <TableCell>{record.checkOut || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                            {attendanceForDate.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={hasPermission('hrm:update') ? 5 : 4} className="h-24 text-center">
                                        No employees in this branch.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </>
                    )}
                </CardContent>
                </Card>
            </div>
        </div>
        {isFormOpen && (
            <AttendanceForm
                employees={employees}
                onSave={handleSaveAttendance}
                onOpenChange={setIsFormOpen}
                selectedDate={selectedDate}
            />
        )}
        {isMassFormOpen && (
            <MassAttendanceForm
                onSave={(checkIn, checkOut) => handleMarkStatus(selectedEmployeeIds, 'Present', checkIn, checkOut)}
                onOpenChange={setIsMassFormOpen}
                employeeCount={selectedEmployeeIds.length}
            />
        )}
    </>
  );
}
