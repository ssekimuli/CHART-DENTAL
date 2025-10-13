
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";

import { useBranch } from "@/context/branch-context";
import { getInvoices, getPayrolls, getExpenses, createExpense, getFinancialSummary } from "@/lib/api";
import type { Invoice, Payroll, Expense, FinancialSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseForm } from "./components/expense-form";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/user";

const chartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-1))" },
    expense: { label: "Expense", color: "hsl(var(--chart-2))" },
};

export default function AccountingPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (!hasPermission('accounting:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
          setIsLoading(true);
          const [invoicesData, payrollsData, expensesData, summaryData] = await Promise.all([
            getInvoices({ branchId: selectedBranch }),
            getPayrolls(selectedBranch),
            getExpenses(selectedBranch),
            getFinancialSummary(selectedBranch),
          ]);
          setInvoices(invoicesData);
          setPayrolls(payrollsData);
          setExpenses(expensesData);
          setFinancialSummary(summaryData);
          setIsLoading(false);
        };
        fetchData();
      }, [selectedBranch, router]);

    const paidInvoices = useMemo(() => {
        return invoices.filter(i => i.status === 'Paid');
    }, [invoices]);


      const handleSaveExpense = async (data: Omit<Expense, 'id'>) => {
        const newExpense = await createExpense(data);
        if (newExpense) {
            setExpenses(prev => [newExpense, ...prev]);
             // Re-fetch summary data after adding an expense
            const summaryData = await getFinancialSummary(selectedBranch);
            setFinancialSummary(summaryData);
        }
        setIsFormOpen(false);
      }


    return (
    <>
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
            <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">${financialSummary.totalIncome.toLocaleString()}</div>}
                        <p className="text-xs text-muted-foreground">From paid invoices</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">${financialSummary.totalExpenses.toLocaleString()}</div>}
                        <p className="text-xs text-muted-foreground">Includes payroll and other costs</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${financialSummary.netProfit.toLocaleString()}</div>}
                        <p className="text-xs text-muted-foreground">Total income minus total expenses</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Financial Summary</CardTitle>
                        <CardDescription>Income vs. Expenses for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoading || !financialSummary ? <Skeleton className="h-[350px] w-full" /> : (
                        <ChartContainer config={chartConfig} className="h-[350px] w-full">
                            <BarChart data={financialSummary.monthlyFinancials}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                                <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    )}
                    </CardContent>
                 </Card>
            </div>
        </TabsContent>
        <TabsContent value="income" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle>Income Records</CardTitle>
                    <CardDescription>All paid invoices for the selected branch.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Issue Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full"/></TableCell></TableRow>
                            ) : paidInvoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-mono">{invoice.id}</TableCell>
                                    <TableCell>{invoice.patientName}</TableCell>
                                    <TableCell>{invoice.issueDate}</TableCell>
                                    <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             {paidInvoices.length === 0 && !isLoading && (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No income records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </TabsContent>
         <TabsContent value="expenses" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Expense Records</CardTitle>
                        <CardDescription>All payroll and operational expenses for the selected branch.</CardDescription>
                    </div>
                    {hasPermission('accounting:create') && (
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add Expense
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoading ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full"/></TableCell></TableRow>
                            ) : [...expenses, ...payrolls.map(p => ({
                                id: p.id,
                                branchId: p.branchId,
                                date: p.payDate,
                                category: 'Salaries' as const,
                                description: `Payroll for ${p.employeeName} (${p.payPeriod})`,
                                amount: p.grossPay
                            }))]
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            {expenses.length === 0 && payrolls.length === 0 && !isLoading && (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No expense records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      {isFormOpen && (
        <ExpenseForm 
            onSave={(data) => handleSaveExpense({ ...data, branchId: selectedBranch })}
            onOpenChange={setIsFormOpen}
        />
      )}
      </>
    )
}
