
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
import {
  Activity,
  CalendarCheck,
  DollarSign,
  Users,
  Send,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBranch } from "@/context/branch-context";
import { useMemo, useState, useEffect } from "react";
import type { Patient, Appointment, ChartData, AppointmentStatus } from "@/lib/types";
import { getPatients, getAppointments, getChartData, updateAppointment } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  newPatients: {
    label: "New Patients",
    color: "hsl(var(--chart-1))",
  },
  newAppointments: {
    label: "New Appointments",
    color: "hsl(var(--chart-2))",
  },
};

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allRecentPatients, setAllRecentPatients] = useState<Patient[]>([]);
  const [allChartData, setAllChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [appointmentsData, patientsData, chartDataResult] = await Promise.all([
        getAppointments(),
        getPatients(), 
        getChartData()
      ]);
      setAllAppointments(appointmentsData);
      setAllRecentPatients(patientsData);
      setAllChartData(chartDataResult);
      setIsLoading(false);
    };
    fetchData();
  }, [selectedBranch]);

  const { recentPatients, appointments, chartData, totalRevenue, activePatients, newAppointments, newPatients } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredAppointments = allAppointments.filter(a => a.branchId === selectedBranch && new Date(a.date) >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filteredPatients = allRecentPatients.filter(p => p.branchId === selectedBranch);
    const filteredChartData = allChartData.filter(c => c.branchId === selectedBranch);
    
    const totalRevenue = filteredChartData.reduce((acc, item) => acc + item.revenue, 0);

    return {
      recentPatients: filteredPatients.sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()).slice(0, 5),
      appointments: filteredAppointments,
      chartData: filteredChartData,
      totalRevenue: totalRevenue,
      activePatients: filteredPatients.filter(p => p.status === 'Active').length,
      newAppointments: filteredAppointments.filter(a => new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      newPatients: filteredPatients.filter(p => new Date(p.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    }
  }, [selectedBranch, allAppointments, allRecentPatients, allChartData]);

  const handleSendToQueue = async (appointment: Appointment) => {
    const updated = await updateAppointment(appointment.id, { status: "Waiting" });
    if (updated) {
      setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
  };

  const getStatusVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "Scheduled":
      case "Waiting":
        return "outline";
      case "Completed":
        return "secondary";
      case "Cancelled":
        return "destructive";
      case "In Session":
      case "On Hold":
        return "default";
    }
  };

  const canReadAccounting = hasPermission('accounting:read');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canReadAccounting && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>}
                <p className="text-xs text-muted-foreground">
                For selected branch
                </p>
            </CardContent>
            </Card>
        )}
        {hasPermission('patients:read') && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Active Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{activePatients}</div>}
                <p className="text-xs text-muted-foreground">
                In selected branch
                </p>
            </CardContent>
            </Card>
        )}
        {hasPermission('appointments:read') && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{newAppointments}</div>}
                <p className="text-xs text-muted-foreground">
                in the last 30 days
                </p>
            </CardContent>
            </Card>
        )}
        {hasPermission('patients:read') && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Patients</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{newPatients}</div>}
                <p className="text-xs text-muted-foreground">
                in the last 30 days
                </p>
            </CardContent>
            </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {canReadAccounting ? (
            <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value / 1000}K`}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                    />
                    <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={8}
                    />
                </BarChart>
                </ChartContainer>
                )}
            </CardContent>
            </Card>
        ) : (
            <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Patient Activity Overview</CardTitle>
                <CardDescription>New patients and appointments over the last few months.</CardDescription>
            </CardHeader>
             <CardContent className="pl-2">
                {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="newPatients"
                            fill="var(--color-newPatients)"
                            radius={8}
                        />
                        <Bar
                            dataKey="newAppointments"
                            fill="var(--color-newAppointments)"
                            radius={8}
                        />
                    </BarChart>
                </ChartContainer>
                )}
            </CardContent>
            </Card>
        )}

        {hasPermission('patients:read') && (
            <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Patients</CardTitle>
                <CardDescription asChild>
                {isLoading ? <div className="text-sm text-muted-foreground"><Skeleton className="h-4 w-1/2" /></div> : <p className="text-sm text-muted-foreground">{`You have ${recentPatients.length} recent patients in this branch.`}</p>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {isLoading ? (
                    <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    </>
                ) : recentPatients.map((patient) => (
                    <div className="flex items-center" key={patient.id}>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={patient.avatar} alt="Avatar" />
                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                        {patient.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                        {patient.email}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">{patient.lastVisit}</div>
                    </div>
                ))}
                {recentPatients.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground text-center">No recent patients in this branch.</p>
                    )}
                </div>
            </CardContent>
            </Card>
        )}
      </div>

       { canReadAccounting &&
         <Card>
            <CardHeader>
                <CardTitle>Patient Activity Overview</CardTitle>
                <CardDescription>New patients and appointments over the last few months.</CardDescription>
            </CardHeader>
             <CardContent className="pl-2">
                {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="newPatients"
                            fill="var(--color-newPatients)"
                            radius={8}
                        />
                        <Bar
                            dataKey="newAppointments"
                            fill="var(--color-newAppointments)"
                            radius={8}
                        />
                    </BarChart>
                </ChartContainer>
                )}
            </CardContent>
            </Card>
       }


        {hasPermission('appointments:read') && (
            <Card>
                <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
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
                    {appointments.slice(0, 5).map((appointment) => (
                        <TableRow key={appointment.id}>
                        <TableCell>
                            <div className="font-medium">{appointment.patientName}</div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{appointment.doctorName}</div>
                        </TableCell>
                        <TableCell>{appointment.treatment}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
                        </TableCell>
                        <TableCell>{appointment.date}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell className="text-right">
                           {hasPermission('appointments:update') && (
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSendToQueue(appointment)}
                                disabled={appointment.status !== 'Scheduled'}
                                >
                                <Send className="mr-2 h-4 w-4" />
                                Send to Queue
                                </Button>
                           )}
                        </TableCell>
                        </TableRow>
                    ))}
                    {appointments.length === 0 && !isLoading && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No upcoming appointments in this branch.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                )}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
