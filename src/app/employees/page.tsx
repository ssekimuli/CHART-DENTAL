
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
import { PlusCircle } from "lucide-react";
import { employees as initialEmployees } from "@/lib/data";
import { EmployeesTable } from "./components/employees-table";
import type { Employee } from "@/lib/types";
import { EmployeeForm } from "./components/employee-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function EmployeesPage() {
    const { selectedBranch } = useBranch();
    const [allEmployees, setAllEmployees] = useState<Employee[]>(initialEmployees);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const employees = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allEmployees.filter(e => e.branchId === selectedBranch);
        }
        return allEmployees.filter(e => e.branchId === currentUser.branchId);
      }, [selectedBranch, allEmployees]);

    const handleSaveEmployee = (data: Omit<Employee, 'id' | 'branchId'>) => {
        const newEmployee: Employee = {
            ...data,
            id: `emp${allEmployees.length + 1}`,
            branchId: selectedBranch,
        };
        setAllEmployees(prev => [...prev, newEmployee]);
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
                Manage your practice's staff members.
            </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Employee
            </Button>
        </CardHeader>
        <CardContent>
            <EmployeesTable data={employees} />
        </CardContent>
        </Card>
        {isFormOpen && (
            <EmployeeForm 
                onSave={handleSaveEmployee}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
