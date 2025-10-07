
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
import { currentUser } from "@/lib/user";
import { createLabOrder, getLabOrders, getPatients } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function LaboratoryPage() {
    const { selectedBranch } = useBranch();
    const [allLabOrders, setAllLabOrders] = useState<LaboratoryOrder[]>([]);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [orders, patients] = await Promise.all([getLabOrders(), getPatients()]);
            setAllLabOrders(orders);
            setAllPatients(patients);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const filteredPatients = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allPatients.filter(p => p.branchId === selectedBranch);
        }
        return allPatients.filter(p => p.branchId === currentUser.branchId);
      }, [selectedBranch, allPatients]);

    const labOrders = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
            return allLabOrders.filter(l => l.branchId === selectedBranch);
        }
        return allLabOrders.filter(l => l.branchId === currentUser.branchId);
    }, [selectedBranch, allLabOrders]);

    const handleSaveOrder = async (data: Omit<LaboratoryOrder, 'id' | 'branchId' | 'patientName'>) => {
        const patient = filteredPatients.find(p => p.id === data.patientId);
        if (!patient) return;

        const newOrder = await createLabOrder({ ...data, branchId: selectedBranch, patientName: patient.name });
        if(newOrder) {
            setAllLabOrders(prev => [...prev, newOrder]);
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
            <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            New Lab Order
            </Button>
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
                patients={filteredPatients}
                onSave={handleSaveOrder}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
