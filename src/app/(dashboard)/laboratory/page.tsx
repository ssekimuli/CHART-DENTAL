
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
import { LabTable } from "./components/lab-table";
import type { LaboratoryOrder, Patient, PaginatedArray } from "@/lib/types";
import { LabOrderForm } from "./components/lab-order-form";
import { useBranch } from "@/context/branch-context";
import { createLabOrder, getLabOrders, getPatientList } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {  hasPermission, hasRole , getCurrentUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { getPatientFullName } from "@/lib/utils";
import { PaginationControl } from "@/components/ui/pagination-control";

export default function LaboratoryPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [labOrders, setLabOrders] = useState<PaginatedArray<LaboratoryOrder>>([] as unknown as PaginatedArray<LaboratoryOrder>);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    
    useEffect(() => {
        setPage(1);
    }, [selectedBranch]);

    useEffect(() => {
        if (!hasPermission("laboratory:read")) {
            router.replace("/dashboard");
            return;
        }

        const branchToFetch = hasRole('Super Admin') ? selectedBranch : getCurrentUser()?.branchId;
        const fetchData = async () => {
            setIsLoading(true);
            const [orders, patientsData] = await Promise.all([
                getLabOrders(branchToFetch, page, 10), 
                getPatientList()
            ]);
            setLabOrders(orders);
            setPatients(patientsData as unknown as Patient[]);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, page, router]);

    const normalizedSelectedBranch = String(selectedBranch || '');
    const normalizedUserBranch = getCurrentUser()?.branchId ? String(getCurrentUser()?.branchId) : '';

    const filteredPatients = useMemo(() => {
        if (hasRole('Super Admin')) {
            return patients.filter(p => String(p.branchId) === normalizedSelectedBranch);
        }
        return patients.filter(p => String(p.branchId) === normalizedUserBranch);
    }, [normalizedSelectedBranch, normalizedUserBranch, patients]);

    const handleSaveOrder = async (data: Omit<LaboratoryOrder, 'id' | 'branchId' | 'patientName'>) => {
        const patient = filteredPatients.find(p => String(p.id) === String(data.patientId));
        if (!patient) return;

        const newOrder = await createLabOrder({ ...data, branchId: selectedBranch, patientName: getPatientFullName(patient) });
        if(newOrder) {
            setLabOrders(prev => {
                const updatedList = [newOrder, ...prev] as PaginatedArray<LaboratoryOrder>;
                updatedList.meta = prev.meta;
                return updatedList;
            });
        }
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Laboratory</CardTitle>
            <CardDescription>
                Track and manage dental lab orders.
            </CardDescription>
            </div>
            {hasPermission('laboratory:create') && (
                <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2" />
                Add Order
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
                <>
                    <LabTable data={labOrders} />
                    <PaginationControl
                        currentPage={page}
                        lastPage={labOrders.meta?.last_page || 1}
                        onPageChange={setPage}
                    />
                </>
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <LabOrderForm 
                patients={filteredPatients}
                onSave={handleSaveOrder}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
