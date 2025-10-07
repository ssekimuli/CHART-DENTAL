
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
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { recentPatients as allRecentPatients, appointments as allAppointments, chartData as allChartData } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBranch } from "@/context/branch-context";
import { useMemo } from "react";
import type { Patient, Appointment } from "@/lib/types";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

export default function DashboardPage() {
  const { selectedBranch } = useBranch();

  const { recentPatients, appointments, chartData, totalRevenue, activePatients, newAppointments, newPatients } = useMemo(() => {
    const filteredAppointments = allAppointments.filter(a => a.branchId === selectedBranch);
    const filteredPatients = allRecentPatients.filter(p => p.branchId === selectedBranch);
    const filteredChartData = allChartData.filter(c => c.branchId === selectedBranch);
    
    const totalRevenue = filteredChartData.reduce((acc, item) => acc + item.revenue, 0);

    return {
      recentPatients: filteredPatients.slice(0, 5),
      appointments: filteredAppointments,
      chartData: filteredChartData,
      totalRevenue: totalRevenue,
      activePatients: filteredPatients.filter(p => p.status === 'Active').length,
      newAppointments: filteredAppointments.filter(a => new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      newPatients: filteredPatients.filter(p => new Date(p.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    }
  }, [selectedBranch]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">
              For selected branch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activePatients}</div>
            <p className="text-xs text-muted-foreground">
              In selected branch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newAppointments}</div>
            <p className="text-xs text-muted-foreground">
              in the last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Patients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newPatients}</div>
            <p className="text-xs text-muted-foreground">
             in the last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>
              You have {recentPatients.length} recent patients in this branch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
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
               {recentPatients.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center">No recent patients in this branch.</p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.slice(0, 5).map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="font-medium">{appointment.patientName}</div>
                  </TableCell>
                  <TableCell>{appointment.treatment}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{appointment.status}</Badge>
                  </TableCell>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No upcoming appointments in this branch.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
