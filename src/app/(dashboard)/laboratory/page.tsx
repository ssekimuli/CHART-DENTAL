
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
import type { LaboratoryOrder, Patient } from "@/lib/types";
import { LabOrderForm } from "./components/lab-order-form";
import { useBranch } from "@/context/branch-context";
import { createLabOrder, getLabOrders, getPatients } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { currentUser, hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function LaboratoryPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [labOrders, setLabOrders] = useState<LaboratoryOrder[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        if (!hasPermission("laboratory:read")) {
            router.replace("/dashboard");
            return;
        }

        const branchToFetch = currentUser.role === 'Super Admin' ? selectedBranch : currentUser.branchId;
        const fetchData = async () => {
            setIsLoading(true);
            const [orders, patientsData] = await Promise.all([
                getLabOrders(branchToFetch), 
                getPatients(branchToFetch)
            ]);
            setLabOrders(orders);
            setPatients(patientsData);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, router]);

    const handleSaveOrder = async (data: Omit<LaboratoryOrder, 'id' | 'branchId' | 'patientName'>) => {
        const patient = patients.find(p => p.id === data.patientId);
        if (!patient) return;

        const newOrder = await createLabOrder({ ...data, branchId: selectedBranch, patientName: patient.name });
        if(newOrder) {
            setLabOrders(prev => [newOrder, ...prev]);
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
                    New Lab Order
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
                <LabTable data={labOrders} />
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <LabOrderForm 
                patients={patients}
                onSave={handleSaveOrder}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
