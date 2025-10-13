
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
    const canCreate = hasPermission('hrm:create');
    const canUpdate = hasPermission('hrm:update');

    useEffect(() => {
        if (!hasPermission('hrm:read')) {
            router.replace('/dashboard');
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            const [advancesData, employeesData] = await Promise.all([
                getStaffAdvances(selectedBranch), 
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Advances</CardTitle>
            <CardDescription>
              Manage and track salary advances for staff.
            </CardDescription>
          </div>
          {canCreate && (
            <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2" />
                New Advance
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
