
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
import { PlusCircle } from "lucide-react";
import type { Employee, LeaveRequest } from "@/lib/types";
import { useBranch } from "@/context/branch-context";
import { getEmployees, getLeaveRequests, createLeaveRequest, updateLeaveRequestStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestForm } from "../components/leave-request-form";
import { LeaveTable } from "../components/leave-table";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LeavePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { selectedBranch } = useBranch();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const canCreate = hasPermission('hrm:create');
    const canUpdate = hasPermission('hrm:update');

    useEffect(() => {
        if (!hasPermission('hrm:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            const [requests, employeesData] = await Promise.all([
                getLeaveRequests(selectedBranch), 
                getEmployees(selectedBranch)
            ]);
            setLeaveRequests(requests);
            setEmployees(employeesData);
            setIsLoading(false);
        }
        fetchData();
    }, [selectedBranch, router]);

    const handleSaveRequest = async (data: Omit<LeaveRequest, 'id' | 'status'>) => {
        const employee = employees.find(e => String(e.id) === String(data.employeeId));
        if (!employee) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Selected employee not found.",
            });
            return;
        };
    
        try {
            const newRequest = await createLeaveRequest({ ...data, employeeName: employee.name, branchId: employee.branchId });
            if (newRequest) {
                setLeaveRequests(prev => [newRequest, ...prev].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
                toast({
                    title: "Success",
                    description: "Leave request submitted successfully.",
                });
                setIsFormOpen(false);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Could not submit the leave request. Please try again.",
            });
        }
    };

    const handleStatusChange = async (id: string, status: LeaveRequest['status']) => {
        const updated = await updateLeaveRequestStatus(id, status);
        if (updated) {
            setLeaveRequests(prev => prev.map(req => req.id === id ? updated : req));
        }
    };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Leave Management</CardTitle>
            <CardDescription>
              Track and manage employee leave requests.
            </CardDescription>
          </div>
          {canCreate && (
            <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2" />
                New Request
            </Button>
          )}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <LeaveTable data={leaveRequests} onStatusChange={handleStatusChange} canUpdate={canUpdate} />
            )}
        </CardContent>
      </Card>
      {isFormOpen && (
        <LeaveRequestForm
            employees={employees}
            onSave={handleSaveRequest}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
