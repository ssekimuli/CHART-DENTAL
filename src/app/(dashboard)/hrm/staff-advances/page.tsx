
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
import type { Employee, StaffAdvance } from "@/lib/types";
import { useBranch } from "@/context/branch-context";
import { getEmployees, getStaffAdvances, createStaffAdvance, updateStaffAdvanceStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancesTable } from "../components/advances-table";
import { AdvanceForm } from "../components/advance-form";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function StaffAdvancesPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [advances, setAdvances] = useState<StaffAdvance[]>([]);
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

    const fetchStaffAdvances = async () => {
        setIsLoading(true);
        const filterParams = {
            branchId: typeof selectedBranch === 'number' ? selectedBranch : parseInt(String(selectedBranch), 10),
            ...(filters.status && filters.status !== 'all' && { status: filters.status }),
            ...(filters.startDate && { startDate: filters.startDate }),
            ...(filters.endDate && { endDate: filters.endDate }),
        };
        const advancesData = await getStaffAdvances(filterParams);
        setAdvances(advancesData);
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
            const [advancesData, employeesData] = await Promise.all([
                getStaffAdvances(filterParams),
                getEmployees(selectedBranch)
            ]);
            setAdvances(advancesData);
            setEmployees(employeesData);
            setIsLoading(false);
        }
        fetchData();
    }, [selectedBranch, router]);

    const handleSaveRequest = async (data: Omit<StaffAdvance, 'id' | 'employeeName' | 'status'>) => {
        const newAdvance = await createStaffAdvance(data);
        if (newAdvance) {
            setAdvances(prev => [...prev, newAdvance]);
        }
        setIsFormOpen(false);
    };

    const handleStatusChange = async (id: string, status: StaffAdvance['status']) => {
        const updated = await updateStaffAdvanceStatus(id, status);
        if (updated) {
            setAdvances(prev => prev.map(req => req.id === id ? updated : req));
        }
    };

    const handleApplyFilters = () => {
        fetchStaffAdvances();
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
            const advancesData = await getStaffAdvances(filterParams);
            setAdvances(advancesData);
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
              <CardTitle>Staff Advances</CardTitle>
              <CardDescription>
                Manage and track salary advances for staff.
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
                  New Advance
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
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date-filter">Date From</Label>
                  <Input
                    id="start-date-filter"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date-filter">Date To</Label>
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
                <AdvancesTable data={advances} onStatusChange={handleStatusChange} canUpdate={canUpdate} />
            )}
        </CardContent>
      </Card>
      {isFormOpen && (
        <AdvanceForm
            employees={employees}
            onSave={handleSaveRequest}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
