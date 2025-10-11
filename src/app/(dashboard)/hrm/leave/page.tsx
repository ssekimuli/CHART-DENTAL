
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

export default function LeavePage() {
    const { selectedBranch } = useBranch();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
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
    }, [selectedBranch]);

    const handleSaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>) => {
        const newRequest = await createLeaveRequest(data);
        if (newRequest) {
            setLeaveRequests(prev => [...prev, newRequest]);
        }
        setIsFormOpen(false);
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
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            New Request
          </Button>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <LeaveTable data={leaveRequests} onStatusChange={handleStatusChange} />
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
