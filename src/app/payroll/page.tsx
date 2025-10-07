
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, PlusCircle } from "lucide-react";
import { payrolls as initialPayrolls, employees } from "@/lib/data";
import { PayrollTable } from "./components/payroll-table";
import type { Payroll } from "@/lib/types";
import { PayrollForm } from "./components/payroll-form";

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>(initialPayrolls);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSavePayroll = (data: Omit<Payroll, 'id' | 'employeeName'>) => {
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) return;

    const newPayroll: Payroll = {
        ...data,
        id: `pay${payrolls.length + 1}`,
        employeeName: employee.name,
    };
    setPayrolls(prev => [newPayroll, ...prev]);
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
                employees={employees}
                onSave={handleSavePayroll}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
