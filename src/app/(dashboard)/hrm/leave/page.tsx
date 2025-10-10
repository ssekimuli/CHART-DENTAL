
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
import { currentUser } from "@/lib/user";
import { getEmployees, getLeaveRequests, createLeaveRequest, updateLeaveRequestStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestForm } from "../components/leave-request-form";
import { LeaveTable } from "../components/leave-table";

export default function LeavePage() {
    const { selectedBranch } = useBranch();
    const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [requests, employees] = await Promise.all([getLeaveRequests(), getEmployees()]);
            setAllLeaveRequests(requests);
            setAllEmployees(employees);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const filteredEmployees = useMemo(() => {
      if (currentUser.role === 'Super Admin') {
        return allEmployees.filter(e => e.branchId === selectedBranch);
      }
      return allEmployees.filter(e => e.branchId === currentUser.branchId);
    }, [selectedBranch, allEmployees]);

    const leaveRequests = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
         return allLeaveRequests.filter(p => p.branchId === selectedBranch);
       }
       return allLeaveRequests.filter(p => p.branchId === currentUser.branchId);
     }, [selectedBranch, allLeaveRequests]);


    const handleSaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>) => {
        const newRequest = await createLeaveRequest(data);
        if (newRequest) {
            setAllLeaveRequests(prev => [...prev, newRequest]);
        }
        setIsFormOpen(false);
    };

    const handleStatusChange = async (id: string, status: LeaveRequest['status']) => {
        const updated = await updateLeaveRequestStatus(id, status);
        if (updated) {
            setAllLeaveRequests(prev => prev.map(req => req.id === id ? updated : req));
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
            employees={filteredEmployees}
            onSave={handleSaveRequest}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
