
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Filter, X } from "lucide-react";
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
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
    });
    const canCreate = hasPermission('hrm:create');
    const canUpdate = hasPermission('hrm:update');

    const fetchLeaveRequests = async () => {
        setIsLoading(true);
        const filterParams = {
            branchId: typeof selectedBranch === 'number' ? selectedBranch : parseInt(String(selectedBranch), 10),
            ...(filters.status && filters.status !== 'all' && { status: filters.status }),
            ...(filters.startDate && { startDate: filters.startDate }),
            ...(filters.endDate && { endDate: filters.endDate }),
        };
        const requests = await getLeaveRequests(filterParams);
        setLeaveRequests(requests);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!hasPermission('hrm:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            const filterParams = {
                branchId: typeof selectedBranch === 'number' ? selectedBranch : parseInt(String(selectedBranch), 10),
            };
            const [requests, employeesData] = await Promise.all([
                getLeaveRequests(filterParams),
                getEmployees(selectedBranch)
            ]);
            setLeaveRequests(requests);
            setEmployees(employeesData);
            setIsLoading(false);
        }
        fetchData();
    }, [selectedBranch, router]);

    const handleSaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>) => {
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

    const handleApplyFilters = () => {
        fetchLeaveRequests();
    };

    const handleClearFilters = () => {
        setFilters({
            status: 'all',
            startDate: '',
            endDate: '',
        });
        // Fetch data without filters
        setTimeout(async () => {
            setIsLoading(true);
            const filterParams = {
                branchId: typeof selectedBranch === 'number' ? selectedBranch : parseInt(String(selectedBranch), 10),
            };
            const requests = await getLeaveRequests(filterParams);
            setLeaveRequests(requests);
            setIsLoading(false);
        }, 0);
    };

    const hasActiveFilters = (filters.status && filters.status !== 'all') || filters.startDate || filters.endDate;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>
                Track and manage employee leave requests.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {canCreate && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date-filter">Start Date From</Label>
                  <Input
                    id="start-date-filter"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date-filter">End Date To</Label>
                  <Input
                    id="end-date-filter"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
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
