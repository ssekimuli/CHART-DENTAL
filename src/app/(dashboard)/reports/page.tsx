"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/branch-context";
import { useCurrency } from "@/hooks/use-currency";
import { getReportsOverview } from "@/lib/api";
import { hasPermission } from "@/lib/user";
import type { ReportsOverview } from "@/lib/types";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  ArrowUpRight, 
  TrendingDown, 
  TrendingUp,
  Percent,
  CalendarCheck,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission("reports:read")) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const fetchOverview = async () => {
      setIsLoading(true);
      const overview = await getReportsOverview(selectedBranch);
      setData(overview);
      setIsLoading(false);
    };

    if (selectedBranch) {
      fetchOverview();
    }
  }, [selectedBranch]);

  if (!hasPermission("reports:read")) {
    return null;
  }

  // Calculate profit margin
  const profitMargin = data?.financial_summary?.total_income
    ? Math.round((data.financial_summary.net_profit / data.financial_summary.total_income) * 100)
    : 0;

  // Calculate expense ratio
  const expenseRatio = data?.financial_summary?.total_income
    ? Math.min(Math.round((data.financial_summary.total_expenses / data.financial_summary.total_income) * 100), 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Consolidated practice intelligence and summaries for your active branch.
          </p>
        </div>
      </div>

      {isLoading ? (
        // Loading State
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Top Level Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-full dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data?.financial_summary?.total_income || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All processed invoice payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <div className="p-2 bg-orange-500/10 text-orange-600 rounded-full dark:text-orange-400">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(data?.financial_summary?.total_expenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Operations and staff payroll costs
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-full dark:text-blue-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data?.financial_summary?.net_profit || 0)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profitMargin >= 20 ? "secondary" : "outline"} className="text-xs">
                    {profitMargin}% margin
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Financial Card */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <CardTitle>{data?.categories?.financial?.title || "Financial Reports"}</CardTitle>
                </div>
                <CardDescription>
                  {data?.categories?.financial?.description || "Analyze clinic income, expenses, and net profit trends."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expense to Income Ratio</span>
                    <span className="font-semibold">{expenseRatio}%</span>
                  </div>
                  <Progress value={expenseRatio} className="bg-orange-100 dark:bg-orange-950/20" />
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <div className="flex justify-between text-xs border-b pb-2">
                    <span className="text-muted-foreground">Operating profit</span>
                    <span className="font-semibold">{formatCurrency(data?.financial_summary?.net_profit || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Income</span>
                    <span className="font-semibold">{formatCurrency(data?.financial_summary?.total_income || 0)}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={() => router.push("/accounting")}
                >
                  Go to Accounting
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Appointments Card */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <CardTitle>{data?.categories?.appointments?.title || "Appointment Statistics"}</CardTitle>
                </div>
                <CardDescription>
                  {data?.categories?.appointments?.description || "Track appointment volumes, status distribution, and attendance."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Total Scheduled</span>
                  <Badge variant="outline" className="text-sm font-semibold">
                    {data?.appointment_summary?.total_appointments || 0}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(data?.appointment_summary?.status_distribution || {}).map(([status, count]) => {
                    const total = data?.appointment_summary?.total_appointments || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{status}</span>
                          <span className="text-muted-foreground">{count} ({percent}%)</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    );
                  })}
                  {Object.keys(data?.appointment_summary?.status_distribution || {}).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      No appointment records found.
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  onClick={() => router.push("/appointments")}
                >
                  Manage Appointments
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Demographics Card */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <CardTitle>{data?.categories?.demographics?.title || "Patient Demographics"}</CardTitle>
                </div>
                <CardDescription>
                  {data?.categories?.demographics?.description || "Understand patient distributions by age, gender, and status."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">Total Register</span>
                  <span className="text-lg font-bold">{data?.patient_summary?.total_patients || 0} patients</span>
                </div>

                {/* Gender Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Gender</h4>
                  {Object.entries(data?.patient_summary?.gender_distribution || {}).map(([gender, count]) => {
                    const total = data?.patient_summary?.total_patients || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={gender} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{gender}</span>
                          <span className="text-muted-foreground">{count} ({percent}%)</span>
                        </div>
                        <Progress value={percent} className="h-1.5 bg-indigo-50 dark:bg-indigo-950/20" />
                      </div>
                    );
                  })}
                </div>

                {/* Age Groups */}
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Age Distribution</h4>
                  {Object.entries(data?.patient_summary?.age_distribution || {}).map(([range, count]) => {
                    const total = data?.patient_summary?.total_patients || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={range} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{range}</span>
                          <span className="text-muted-foreground">{count} ({percent}%)</span>
                        </div>
                        <Progress value={percent} className="h-1.5 bg-purple-50 dark:bg-purple-950/20" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  onClick={() => router.push("/patients")}
                >
                  View Patients List
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
