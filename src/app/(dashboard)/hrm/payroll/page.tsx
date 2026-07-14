
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
import { PayrollTable } from "../components/payroll-table";
import type { Employee, Payroll } from "@/lib/types";
import { PayrollForm } from "../components/payroll-form";
import { useBranch } from "@/context/branch-context";
import { createPayroll, getEmployees, getPayrolls, approvePayroll } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";


export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const canCreate = hasPermission('hrm:create');
  const canUpdate = hasPermission('hrm:update');
  const canDelete = hasPermission('hrm:delete');

  useEffect(() => {
    if (!hasPermission('hrm:read')) {
        router.replace('/dashboard');
        return;
    }
      const fetchData = async () => {
          setIsLoading(true);
          const [payrollsData, employeesData] = await Promise.all([
            getPayrolls(selectedBranch), 
            getEmployees(selectedBranch)
        ]);
          setPayrolls(payrollsData);
          setEmployees(employeesData);
          setIsLoading(false);
      }
      fetchData();
  }, [selectedBranch, router]);

  const handleOpenForm = (payroll?: Payroll) => {
    setSelectedPayroll(payroll);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedPayroll(undefined);
    setIsFormOpen(false);
  };

  const handleSavePayroll = async (data: Omit<Payroll, 'id' | 'employeeName' | 'branchId'>) => {
    const employee = employees.find(e => String(e.id) === String(data.employeeId));
    if (!employee) return;

    if (selectedPayroll) {
        // Update logic will go here
        toast({ title: "Payroll Updated", description: "The record has been updated." });
    } else {
        // Create
        const newPayroll = await createPayroll({ ...data, employeeName: employee.name, branchId: selectedBranch });
        if(newPayroll) {
            setPayrolls(prev => [newPayroll, ...prev]);
            toast({ title: "Payroll Created", description: "The new payroll record has been added." });
        }
    }
    handleCloseForm();
  }

  const handleViewEmployee = (employeeId: string | number) => {
    router.push(`/hrm/staff/${employeeId}`);
  };

  const openDeleteDialog = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDeleteAlertOpen(true);
  };

  const handleDeletePayroll = async () => {
    if (selectedPayroll) {
        // Delete logic will go here
        toast({ title: "Payroll Deleted", description: "The record has been deleted." });
        setPayrolls(prev => prev.filter(p => p.id !== selectedPayroll.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedPayroll(undefined);
  };

  const handleApprovePayroll = async (payroll: Payroll) => {
    try {
        const updated = await approvePayroll(payroll.id, 'Approved');
        if (updated) {
            setPayrolls(prev => prev.map(p => p.id === payroll.id ? updated : p));
            toast({ title: "Payroll Approved", description: `Payroll for ${payroll.employeeName} has been approved and marked as Paid.` });
        } else {
            toast({ variant: "destructive", title: "Approval Failed", description: "Could not approve the payroll record." });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "An error occurred while approving the payroll."
        });
    }
  };

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
                {canCreate && (
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2" />
                        Run Payroll
                    </Button>
                )}
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
                <PayrollTable 
                  data={payrolls} 
                  onView={handleViewEmployee}
                  onEdit={handleOpenForm}
                  onDelete={openDeleteDialog}
                  onApprove={handleApprovePayroll}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <PayrollForm
                payroll={selectedPayroll}
                employees={employees}
                onSave={handleSavePayroll}
                onOpenChange={handleCloseForm}
            />
        )}
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the payroll record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedPayroll(undefined)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayroll} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
