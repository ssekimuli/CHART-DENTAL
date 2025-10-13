
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
import { getEmployees, updateEmployee } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SalaryTable } from "../components/salary-table";
import { SalaryForm } from "../components/salary-form";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function StaffSalariesPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    const canUpdate = hasPermission('hrm:update');
    
    useEffect(() => {
        if (!hasPermission('hrm:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getEmployees(selectedBranch);
            setEmployees(data);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, router]);

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
            setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
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
                    canUpdate={canUpdate}
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
