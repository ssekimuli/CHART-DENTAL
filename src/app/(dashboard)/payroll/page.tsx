
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, PlusCircle } from "lucide-react";
import { PayrollTable } from "./components/payroll-table";
import type { Employee, Payroll } from "@/lib/types";
import { PayrollForm } from "./components/payroll-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import { createPayroll, getEmployees, getPayrolls } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollPage() {
  const { selectedBranch } = useBranch();
  const [allPayrolls, setAllPayrolls] = useState<Payroll[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          const [payrolls, employees] = await Promise.all([getPayrolls(), getEmployees()]);
          setAllPayrolls(payrolls);
          setAllEmployees(employees);
          setIsLoading(false);
      }
      fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allEmployees.filter(e => String(e.branchId) === String(selectedBranch));
    }
    return allEmployees.filter(e => String(e.branchId) === String(currentUser.branchId));
  }, [selectedBranch, allEmployees]);

  const payrolls = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPayrolls.filter(p => String(p.branchId) === String(selectedBranch));
    }
    return allPayrolls.filter(p => String(p.branchId) === String(currentUser.branchId));
  }, [selectedBranch, allPayrolls]);

  const handleSavePayroll = async (data: Omit<Payroll, 'id' | 'employeeName' | 'branchId'>) => {
    const employee = filteredEmployees.find(e => String(e.id) === String(data.employeeId));
    if (!employee) return;

    const newPayroll = await createPayroll({ ...data, employeeName: employee.name, branchId: selectedBranch });
    if(newPayroll) {
        setAllPayrolls(prev => [newPayroll, ...prev]);
    }
    setIsFormOpen(false);
  }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Payroll</CardTitle>
                <CardDescription>
                    Manage and process employee payroll.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2" />
                    Run Payroll
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <PayrollTable data={payrolls} />
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <PayrollForm
                employees={filteredEmployees}
                onSave={handleSavePayroll}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
