
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, PlusCircle } from "lucide-react";
import { payrolls as initialPayrolls, employees as allEmployees } from "@/lib/data";
import { PayrollTable } from "./components/payroll-table";
import type { Payroll } from "@/lib/types";
import { PayrollForm } from "./components/payroll-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function PayrollPage() {
  const { selectedBranch } = useBranch();
  const [allPayrolls, setAllPayrolls] = useState<Payroll[]>(initialPayrolls);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allEmployees.filter(e => e.branchId === selectedBranch);
    }
    return allEmployees.filter(e => e.branchId === currentUser.branchId);
  }, [selectedBranch]);

  const payrolls = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPayrolls.filter(p => p.branchId === selectedBranch);
    }
    return allPayrolls.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch, allPayrolls]);

  const handleSavePayroll = (data: Omit<Payroll, 'id' | 'employeeName' | 'branchId'>) => {
    const employee = filteredEmployees.find(e => e.id === data.employeeId);
    if (!employee) return;

    const newPayroll: Payroll = {
        ...data,
        id: `pay${allPayrolls.length + 1}`,
        employeeName: employee.name,
        branchId: selectedBranch,
    };
    setAllPayrolls(prev => [newPayroll, ...prev]);
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
            <PayrollTable data={payrolls} />
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
