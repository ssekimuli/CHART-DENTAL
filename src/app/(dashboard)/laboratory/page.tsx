
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
import { createLabOrder, getLabOrders, getClients, getEmployees } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, hasRole , getCurrentUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { PaginationControl } from "@/components/ui/pagination-control";
import type { Client } from "@/lib/types";

export default function LaboratoryPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [labOrders, setLabOrders] = useState<PaginatedArray<LaboratoryOrder>>([] as unknown as PaginatedArray<LaboratoryOrder>);
    const [clients, setClients] = useState<Client[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
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
            const [orders, clientsData, employeesData] = await Promise.all([
                getLabOrders(branchToFetch, page, 10), 
                getClients(),
                getEmployees(branchToFetch)
            ]);
            setLabOrders(orders);
            setClients(clientsData);
            setDoctors(employeesData.filter(emp => emp.role === 'Dentist' || emp.role === 'Hygienist'));
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, page, router]);

    const handleSaveOrder = async (data: Omit<LaboratoryOrder, 'id' | 'branchId'>) => {
        const client = clients.find(c => String(c.id) === String(data.clientId));
        if (!client) return;

        const newOrder = await createLabOrder({ ...data, branchId: selectedBranch });
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
                clients={clients}
                doctors={doctors}
                onSave={handleSaveOrder}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
