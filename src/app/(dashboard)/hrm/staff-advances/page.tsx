
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
import { currentUser } from "@/lib/user";
import { getEmployees, getStaffAdvances, createStaffAdvance, updateStaffAdvanceStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancesTable } from "../components/advances-table";
import { AdvanceForm } from "../components/advance-form";

export default function StaffAdvancesPage() {
    const { selectedBranch } = useBranch();
    const [allAdvances, setAllAdvances] = useState<StaffAdvance[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [advances, employees] = await Promise.all([getStaffAdvances(), getEmployees()]);
            setAllAdvances(advances);
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

    const advances = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
         return allAdvances.filter(p => p.branchId === selectedBranch);
       }
       return allAdvances.filter(p => p.branchId === currentUser.branchId);
     }, [selectedBranch, allAdvances]);


    const handleSaveRequest = async (data: Omit<StaffAdvance, 'id' | 'employeeName' | 'status'>) => {
        const newAdvance = await createStaffAdvance(data);
        if (newAdvance) {
            setAllAdvances(prev => [...prev, newAdvance]);
        }
        setIsFormOpen(false);
    };

    const handleStatusChange = async (id: string, status: StaffAdvance['status']) => {
        const updated = await updateStaffAdvanceStatus(id, status);
        if (updated) {
            setAllAdvances(prev => prev.map(req => req.id === id ? updated : req));
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
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            New Advance
          </Button>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <AdvancesTable data={advances} onStatusChange={handleStatusChange} />
            )}
        </CardContent>
      </Card>
      {isFormOpen && (
        <AdvanceForm
            employees={filteredEmployees}
            onSave={handleSaveRequest}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
