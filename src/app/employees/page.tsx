
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
import { PlusCircle } from "lucide-react";
import { employees as initialEmployees } from "@/lib/data";
import { EmployeesTable } from "./components/employees-table";
import type { Employee } from "@/lib/types";
import { EmployeeForm } from "./components/employee-form";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSaveEmployee = (data: Omit<Employee, 'id'>) => {
        const newEmployee: Employee = {
            ...data,
            id: `emp${employees.length + 1}`
        };
        setEmployees(prev => [...prev, newEmployee]);
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
