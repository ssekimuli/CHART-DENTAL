
"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Employee, Payroll, AttendanceRecord, Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, DollarSign, UserCheck, CalendarDays, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getEmployeeById, getPayrolls, getAttendance, getAppointments } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/lib/user';
import { PayrollTable } from '../../payroll/components/payroll-table';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [employee, setEmployee] = useState<Employee | undefined>(undefined);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission('hrm:read')) {
      router.replace('/dashboard');
      return;
    }
    if (typeof id !== 'string') return;
    const fetchData = async () => {
        setIsLoading(true);
        const [employeeData, payrollData, attendanceData, appointmentData] = await Promise.all([
            getEmployeeById(id),
            getPayrolls(),
            getAttendance(),
            getAppointments()
        ]);
        setEmployee(employeeData);
        setPayrolls(payrollData);
        setAttendance(attendanceData);
        setAppointments(appointmentData);
        setIsLoading(false);
    }
    fetchData();
  }, [id, router]);

  const { stats, employeePayrolls } = useMemo(() => {
    if (!employee) return { stats: null, employeePayrolls: [] };

    const employeePayrolls = payrolls.filter(p => p.employee_id === employee.id);
    const totalPaid = employeePayrolls.reduce((sum, p) => sum + Number(p.net_pay), 0);

    const employeeAttendance = attendance.filter(a => a.employeeId === employee.id);
    const presentDays = employeeAttendance.filter(a => a.status === 'Present').length;
    const absentDays = employeeAttendance.filter(a => a.status === 'Absent').length;
    const onLeaveDays = employeeAttendance.filter(a => a.status === 'On Leave').length;

    const employeeAppointments = appointments.filter(a => a.doctorId === employee.id);
    const uniquePatients = new Set(employeeAppointments.map(a => a.patientId)).size;

    return {
      stats: {
        totalPaid,
        presentDays,
        absentDays,
        onLeaveDays,
        totalAppointments: employeeAppointments.length,
        uniquePatients,
        recentAppointments: employeeAppointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5),
      },
      employeePayrolls,
    }
  }, [employee, payrolls, attendance, appointments]);
  
  if (isLoading) {
      return (
          <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Back</span>
                  </Button>
                  <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Loading Employee...
                  </h1>
              </div>
              <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="h-24 w-24 border">
                          <AvatarFallback></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                           <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                           <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="h-40 w-full bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
              </Card>
          </div>
      )
  }

  if (!employee || !stats) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Employee Details
        </h1>
      </div>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-24 w-24 border">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-3xl">{employee.name}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{employee.email}</CardDescription>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{employee.role}</Badge>
                        <Badge
                            variant={employee.status === "Active" ? "secondary" : "outline"}
                            className={employee.status === 'Active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                            >
                            {employee.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="grid gap-1">
                        <span className="text-muted-foreground">Hire Date</span>
                        <span className="font-medium">{employee.hire_date}</span>
                    </div>
                    <div className="grid gap-1">
                        <span className="text-muted-foreground">Salary</span>
                        <span className="font-medium">${Number(employee.salary).toLocaleString()}</span>
                    </div>
                    <div className="grid gap-1">
                        <span className="text-muted-foreground">Branch ID</span>
                        <span className="font-medium">{employee.branchId}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total net salary paid to date</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.presentDays} <span className="text-base font-normal"> Days</span></div>
                    <p className="text-xs text-muted-foreground">{stats.absentDays} Absent, {stats.onLeaveDays} On Leave</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                     <p className="text-xs text-muted-foreground">Total appointments assigned</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Patients Treated</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.uniquePatients}</div>
                    <p className="text-xs text-muted-foreground">Unique patients seen</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
                <PayrollTable data={employeePayrolls} />
            </CardContent>
        </Card>
    </div>
  );
}
