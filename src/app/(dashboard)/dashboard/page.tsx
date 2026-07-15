
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
import moment from "moment";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Patient, Appointment, ChartData, AppointmentStatus, DashboardSummary, DashboardUpcomingAppointment, DashboardRecentPatient, PracticeTrendPoint } from "@/lib/types";
import { getPatients, getAppointments, getChartData, getDashboardSummary, getPracticeTrends, updateAppointment } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, hasRole } from "@/lib/user";
import { useCurrency } from "@/hooks/use-currency";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  newPatients: {
    label: "New Patients",
    color: "hsl(var(--chart-1))",
    icon: Users,
  },
  newAppointments: {
    label: "New Appointments",
    color: "hsl(var(--chart-2))",
    icon: CalendarCheck,
  },
};

type DashboardAppointmentRow = Appointment | DashboardUpcomingAppointment;
type DashboardPatientRow = Patient | DashboardRecentPatient;

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const { formatCurrency } = useCurrency();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allRecentPatients, setAllRecentPatients] = useState<Patient[]>([]);
  const [allChartData, setAllChartData] = useState<ChartData[]>([]);
  const [practiceTrends, setPracticeTrends] = useState<PracticeTrendPoint[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [appointmentsData, patientsData, chartDataResult, trendData, summaryData] = await Promise.all([
        getAppointments({ branch_id: selectedBranch }),
        getPatients({ branchId: selectedBranch }),
        getChartData(),
        getPracticeTrends(selectedBranch),
        getDashboardSummary(selectedBranch)
      ]);
      setAllAppointments(appointmentsData);
      setAllRecentPatients(patientsData);
      setAllChartData(chartDataResult);
      setPracticeTrends(trendData);
      setDashboardSummary(summaryData);
      setIsLoading(false);
    };
    fetchData();
  }, [selectedBranch]);

  const { recentPatients, appointments, chartData, totalRevenue, activePatients, newAppointments, newPatients } = useMemo(() => {
    const filteredChartData = allChartData.filter(c => c.branchId === selectedBranch);
    const totalRevenue = filteredChartData.reduce((acc, item) => acc + item.revenue, 0);

    return {
      recentPatients: dashboardSummary?.recentPatients ?? allRecentPatients.filter(p => p.branchId === selectedBranch).sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()).slice(0, 5),
      appointments: dashboardSummary?.upcomingAppointments ?? allAppointments.filter(a => a.branchId === selectedBranch),
      chartData: filteredChartData,
      totalRevenue: dashboardSummary?.totalRevenue ?? totalRevenue,
      activePatients: dashboardSummary?.activePatients ?? allRecentPatients.filter(p => p.branchId === selectedBranch && p.status === 'Active').length,
      newAppointments: dashboardSummary?.appointmentsLast30Days ?? allAppointments.filter(a => a.branchId === selectedBranch && new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      newPatients: dashboardSummary?.newPatientsLast30Days ?? allRecentPatients.filter(p => p.branchId === selectedBranch && new Date(p.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    }
  }, [selectedBranch, allAppointments, allRecentPatients, allChartData, dashboardSummary]);

  const practiceTrendData = practiceTrends;

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

  const router = useRouter();
  const canReadAccounting = hasRole(['Super Admin', 'Account']);

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
                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>}
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

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Practice Trends</CardTitle>
                <CardDescription>
                  Revenue and activity trends for the selected branch.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : practiceTrendData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">No trend data available.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <BarChart data={practiceTrendData} barGap={8} barCategoryGap="20%">
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => moment(value).format('MMM D')} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} barSize={28} />
                  <Bar dataKey="appointments" fill="var(--color-newPatients)" radius={8} barSize={28} />
                  <Bar dataKey="newPatients" fill="var(--color-newAppointments)" radius={8} barSize={28} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {hasPermission('appointments:read') && (
            <Card className="lg:col-span-3">
                <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                    Today's scheduled appointments for this branch.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {appointments.slice(0, 5).map((appointment) => (
                        <TableRow key={appointment.id}>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>
                            <div className="font-medium">{appointment.patientName}</div>
                            <div className="text-sm text-muted-foreground">{appointment.treatment ?? appointment.doctorName}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           {hasPermission('appointments:update') && (
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSendToQueue(appointment)}
                                disabled={appointment.status !== 'Scheduled'}
                                >
                                <Send className="mr-2 h-4 w-4" />
                                Queue
                                </Button>
                           )}
                        </TableCell>
                        </TableRow>
                    ))}
                    {appointments.length === 0 && !isLoading && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
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
      
       {hasPermission('patients:read') && (
            <Card>
            <CardHeader>
                <CardTitle>Recent Patients</CardTitle>
                <CardDescription>The last 5 patients with recent visits.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {isLoading ? (
                    <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    </>
                ) : recentPatients.map((patient) => {
                    const isSummaryPatient = 'firstName' in patient && 'lastName' in patient;
                    const fullName = isSummaryPatient ? `${patient.firstName} ${patient.lastName}` : `${patient.first_name} ${patient.last_name}`;

                    return (
                        <div className="flex items-center" key={patient.id}>
                            {isSummaryPatient ? (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                                    {patient.firstName.charAt(0)}
                                </div>
                            ) : (
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={patient.avatar} alt="Avatar" />
                                    <AvatarFallback>{patient.first_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {fullName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isSummaryPatient ? `Last Visit: ${patient.lastVisit ? moment(patient.lastVisit).format('ll') : 'No visit yet'}` : patient.email}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <div className="font-medium">{patient.lastVisit ? moment(patient.lastVisit).format('ll') : 'N/A'}</div>
                                <Button variant="outline" size="sm" onClick={() => router.push(`/patients/${patient.id}`)}>
                                    View
                                </Button>
                            </div>
                        </div>
                    );
                })}
                {recentPatients.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground text-center">No recent patients in this branch.</p>
                    )}
                </div>
            </CardContent>
            </Card>
        )}
    </div>
  );
}

    