
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
import { PlusCircle, TrendingDown, TrendingUp, Download, Calendar as CalendarIcon, Edit2, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";

import { useBranch } from "@/context/branch-context";
import { getIncomeRecords, getExpenseSummary, createExpense, updateExpense, deleteExpense, getFinancialSummary } from "@/lib/api";
import type { IncomeRecord, Expense, ExpenseSummary, FinancialSummary, IncomeRecordsResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseForm } from "./components/expense-form";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/user";
import { useCurrency } from "@/hooks/use-currency";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
const chartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-1))" },
    expense: { label: "Expense", color: "hsl(var(--chart-2))" },
};

export default function AccountingPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const { formatCurrency } = useCurrency();
    const { toast } = useToast();
    const [incomeResponse, setIncomeResponse] = useState<IncomeRecordsResponse | null>(null);
    const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!hasPermission('accounting:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
          setIsLoading(true);
          const filters = {
              branchId: selectedBranch,
              dateFrom: dateRange?.from?.toISOString(),
              dateTo: dateRange?.to?.toISOString(),
          };
          const [incomeRecordsData, expenseSummaryData, summaryData] = await Promise.all([
            getIncomeRecords(filters),
            getExpenseSummary(filters),
            getFinancialSummary(filters),
          ]);
          setIncomeResponse(incomeRecordsData);
          setExpenseSummary(expenseSummaryData);
          setFinancialSummary(summaryData);
          setIsLoading(false);
        };
        fetchData();
      }, [selectedBranch, dateRange, router]);

    const paidIncomeRecords = useMemo(() => {
        return incomeResponse?.records?.filter((record: IncomeRecord) => record.status === 'Paid') || [];
    }, [incomeResponse]);


      const handleSaveExpense = async (data: Omit<Expense, 'id'>) => {
        try {
            if (isEditMode && selectedExpense) {
                await updateExpense(selectedExpense.id, data);
                toast({
                    title: "Success",
                    description: "Expense updated successfully",
                });
            } else {
                const newExpense = await createExpense(data);
                if (newExpense) {
                    toast({
                        title: "Success",
                        description: "Expense created successfully",
                    });
                }
            }
            const filters = {
                branchId: selectedBranch,
                dateFrom: dateRange?.from?.toISOString(),
                dateTo: dateRange?.to?.toISOString(),
            };
            const summaryData = await getExpenseSummary(filters);
            setExpenseSummary(summaryData);
            const financialData = await getFinancialSummary(filters);
            setFinancialSummary(financialData);
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedExpense(null);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save expense",
                variant: "destructive",
            });
        }
      }

      const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsEditMode(true);
        setIsFormOpen(true);
      }

      const handleDeleteExpense = async (expenseId: string | number) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            setIsDeleting(true);
            await deleteExpense(expenseId);
            toast({
                title: "Success",
                description: "Expense deleted successfully",
            });
            const filters = {
                branchId: selectedBranch,
                dateFrom: dateRange?.from?.toISOString(),
                dateTo: dateRange?.to?.toISOString(),
            };
            const summaryData = await getExpenseSummary(filters);
            setExpenseSummary(summaryData);
            const financialData = await getFinancialSummary(filters);
            setFinancialSummary(financialData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete expense",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
      }

      const downloadCSV = (data: any[], filename: string) => {
          if (!data || !data.length) return;
          const headers = Object.keys(data[0]).join(',');
          const csv = [
              headers,
              ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.setAttribute('href', url);
          a.setAttribute('download', filename);
          a.click();
      };


    return (
    <>
      <Tabs defaultValue="overview">
      <div className="flex justify-between items-center mb-4">
        <TabsList className="grid w-[400px] grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Filter by date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            <Button variant="ghost" onClick={() => setDateRange(undefined)} disabled={!dateRange}>Clear</Button>
        </div>
      </div>
        <TabsContent value="overview" className="mt-4">
            <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalIncome)}</div>}
                        <p className="text-xs text-muted-foreground">From paid invoices</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalExpenses)}</div>}
                        <p className="text-xs text-muted-foreground">Includes payroll and other costs</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {isLoading || !financialSummary ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.netProfit)}</div>}
                        <p className="text-xs text-muted-foreground">Total income minus total expenses</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Income by Category Cards */}
                {financialSummary && financialSummary.incomeByCategory && Object.keys(financialSummary.incomeByCategory).length > 0 && !isLoading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Income by Category</CardTitle>
                            <CardDescription>Revenue breakdown by income category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                                {Object.entries(financialSummary.incomeByCategory).map(([category, amount]) => (
                                    <div key={category} className="rounded-lg border bg-muted p-4">
                                        <p className="text-xs uppercase text-muted-foreground capitalize">
                                            {category.replace('-', ' ')}
                                        </p>
                                        <p className="mt-2 text-lg font-semibold">{formatCurrency(Number(amount))}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
            <div className="flex flex-col gap-6">
                {/* Category Summary Cards */}
                {incomeResponse && Object.keys(incomeResponse.summary).length > 0 && !isLoading && (
                    <div className="grid gap-4 md:grid-cols-4">
                        {Object.entries(incomeResponse.summary).map(([category, data]: [string, any]) => (
                            <Card key={category}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium capitalize">
                                        {category.replace('-', ' ')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
                                    <p className="text-xs text-muted-foreground">{data.count} invoice{data.count !== 1 ? 's' : ''}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Total Income Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Total Income by Category</CardTitle>
                            <CardDescription>{incomeResponse?.total ? formatCurrency(parseFloat(incomeResponse.total)) : 'No data'}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                {/* Income Records Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Income Records</CardTitle>
                            <CardDescription>All paid invoices for the selected branch.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => downloadCSV(paidIncomeRecords, 'income_records.csv')}>
                            <Download className="mr-2 h-4 w-4"/>
                            Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full"/></TableCell></TableRow>
                                ) : paidIncomeRecords.map((record: IncomeRecord) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-mono">{record.id}</TableCell>
                                        <TableCell>{record.patientName}</TableCell>
                                        <TableCell>
                                            <span className="capitalize">{(record.category || 'other').replace('-', ' ')}</span>
                                        </TableCell>
                                        <TableCell>{record.date}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(record.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                {paidIncomeRecords.length === 0 && !isLoading && (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No income records found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
         <TabsContent value="expenses" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Expense Records</CardTitle>
                        <CardDescription>All payroll and operational expenses for the selected branch.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => downloadCSV(expenseSummary?.records || [], 'expense_records.csv')}>
                            <Download className="mr-2 h-4 w-4"/>
                            Export CSV
                        </Button>
                        {hasPermission('accounting:create') && (
                            <Button onClick={() => setIsFormOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add Expense
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {expenseSummary && !isLoading ? (
                        <div className="mb-6 grid gap-4 md:grid-cols-4">
                            <div className="rounded-lg border bg-muted p-4">
                                <p className="text-xs uppercase text-muted-foreground">Branch</p>
                                <p className="mt-1 text-lg font-semibold">{expenseSummary.branch?.name || 'All branches'}</p>
                            </div>
                             <div className="rounded-lg border bg-muted p-4">
                                <p className="text-xs uppercase text-muted-foreground">Total</p>
                                <p className="mt-1 text-lg font-semibold">{formatCurrency(expenseSummary.total)}</p>
                            </div>
                            <div className="rounded-lg border bg-muted p-4">
                                <p className="text-xs uppercase text-muted-foreground">Payroll</p>
                                <p className="mt-1 text-lg font-semibold">{formatCurrency(expenseSummary.totalPayroll)}</p>
                            </div>
                            <div className="rounded-lg border bg-muted p-4">
                                <p className="text-xs uppercase text-muted-foreground">Operational</p>
                                <p className="mt-1 text-lg font-semibold">{formatCurrency(expenseSummary.totalOperationalExpenses)}</p>
                            </div>
                        </div>
                    ) : null}
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoading ? (
                                <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full"/></TableCell></TableRow>
                            ) : (expenseSummary?.records ?? [])
                            .slice()
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEditExpense(expense)}
                                                disabled={isDeleting}
                                                title="Edit expense"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                disabled={isDeleting}
                                                title="Delete expense"
                                            >
                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(expenseSummary?.records?.length ?? 0) === 0 && !isLoading && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No expense records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      {isFormOpen && (
        <ExpenseForm
            expense={isEditMode ? selectedExpense || undefined : undefined}
            onSave={(data) => handleSaveExpense({ ...data, branchId: selectedBranch })}
            onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) {
                    setIsEditMode(false);
                    setSelectedExpense(null);
                }
            }}
        />
      )}
      </>
    )
}
