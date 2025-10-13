
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { EmployeesTable } from "../components/employees-table";
import type { Employee } from "@/lib/types";
import { EmployeeForm } from "../components/employee-form";
import { useBranch } from "@/context/branch-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";

export default function StaffPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
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

    const handleOpenForm = (employee?: Employee) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(undefined);
        setIsFormOpen(false);
    };

    const handleSaveEmployee = async (data: Omit<Employee, 'id' | 'branchId'>) => {
        if (selectedEmployee) {
            const updated = await updateEmployee(selectedEmployee.id, data);
            if(updated) {
                setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
            }
        } else {
            const newEmployee = await createEmployee({ ...data, branchId: selectedBranch });
            if(newEmployee) {
                setEmployees(prev => [...prev, newEmployee]);
            }
        }
        handleCloseForm();
    };

    const openDeleteDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteAlertOpen(true);
    };
    
    const handleDeleteEmployee = async () => {
        if (selectedEmployee) {
            await deleteEmployee(selectedEmployee.id);
            setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
        }
        setIsDeleteAlertOpen(false);
        setSelectedEmployee(undefined);
    };

    const handleViewEmployee = (employeeId: string) => {
        router.push(`/hrm/staff/${employeeId}`);
    };

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Staff</CardTitle>
            <CardDescription>
                Manage your practice's staff members.
            </CardDescription>
            </div>
            {hasPermission('hrm:create') && (
                <Button onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2" />
                    Add Employee
                </Button>
            )}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <EmployeesTable 
                    data={employees}
                    onEdit={handleOpenForm}
                    onDelete={openDeleteDialog}
                    onView={handleViewEmployee}
                />
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <EmployeeForm
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                onOpenChange={handleCloseForm}
            />
        )}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the employee record.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedEmployee(undefined)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
