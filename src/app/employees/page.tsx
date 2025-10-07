
"use client";

import { useState, useMemo } from "react";
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
import { employees as initialEmployees } from "@/lib/data";
import { EmployeesTable } from "./components/employees-table";
import type { Employee } from "@/lib/types";
import { EmployeeForm } from "./components/employee-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
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

export default function EmployeesPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [allEmployees, setAllEmployees] = useState<Employee[]>(initialEmployees);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    const employees = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allEmployees.filter(e => e.branchId === selectedBranch);
        }
        return allEmployees.filter(e => e.branchId === currentUser.branchId);
      }, [selectedBranch, allEmployees]);

    const handleOpenForm = (employee?: Employee) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(undefined);
        setIsFormOpen(false);
    };

    const handleSaveEmployee = (data: Omit<Employee, 'id' | 'branchId'>) => {
        if (selectedEmployee) {
            const updatedEmployee = { ...selectedEmployee, ...data };
            setAllEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        } else {
            const newEmployee: Employee = {
                ...data,
                id: `emp${allEmployees.length + 1}`,
                branchId: selectedBranch,
            };
            setAllEmployees(prev => [...prev, newEmployee]);
        }
        handleCloseForm();
    };

    const openDeleteDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteAlertOpen(true);
    };
    
    const handleDeleteEmployee = () => {
        if (selectedEmployee) {
            setAllEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
        }
        setIsDeleteAlertOpen(false);
        setSelectedEmployee(undefined);
    };

    const handleViewEmployee = (employeeId: string) => {
        router.push(`/employees/${employeeId}`);
    };

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
            <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2" />
            Add Employee
            </Button>
        </CardHeader>
        <CardContent>
            <EmployeesTable 
                data={employees}
                onEdit={handleOpenForm}
                onDelete={openDeleteDialog}
                onView={handleViewEmployee}
            />
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
