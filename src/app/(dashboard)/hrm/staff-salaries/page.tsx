
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Employee } from "@/lib/types";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import { getEmployees, updateEmployee } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SalaryTable } from "../components/salary-table";
import { SalaryForm } from "../components/salary-form";

export default function StaffSalariesPage() {
    const { selectedBranch } = useBranch();
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getEmployees();
            setAllEmployees(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const employees = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allEmployees.filter(e => e.branchId === selectedBranch);
        }
        return allEmployees.filter(e => e.branchId === currentUser.branchId);
      }, [selectedBranch, allEmployees]);

    const handleOpenForm = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(undefined);
        setIsFormOpen(false);
    };

    const handleSaveSalary = async (employeeId: string, newSalary: number) => {
        const updated = await updateEmployee(employeeId, { salary: newSalary });
        if(updated) {
            setAllEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        }
        handleCloseForm();
    };


  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Staff Salaries</CardTitle>
            <CardDescription>
                Manage and view employee salary information.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <SalaryTable 
                    data={employees}
                    onEdit={handleOpenForm}
                />
            )}
        </CardContent>
        </Card>
        {isFormOpen && selectedEmployee && (
            <SalaryForm
                employee={selectedEmployee}
                onSave={handleSaveSalary}
                onOpenChange={handleCloseForm}
            />
        )}
    </>
  );
}

