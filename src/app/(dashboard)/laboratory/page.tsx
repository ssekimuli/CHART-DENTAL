
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { labOrders as initialLabOrders, patients as allPatients } from "@/lib/data";
import { LabTable } from "./components/lab-table";
import type { LaboratoryOrder, Patient } from "@/lib/types";
import { LabOrderForm } from "./components/lab-order-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function LaboratoryPage() {
    const { selectedBranch } = useBranch();
    const [allLabOrders, setAllLabOrders] = useState<LaboratoryOrder[]>(initialLabOrders);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const filteredPatients = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allPatients.filter(p => p.branchId === selectedBranch);
        }
        return allPatients.filter(p => p.branchId === currentUser.branchId);
      }, [selectedBranch]);

    const labOrders = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
            return allLabOrders.filter(l => l.branchId === selectedBranch);
        }
        return allLabOrders.filter(l => l.branchId === currentUser.branchId);
    }, [selectedBranch, allLabOrders]);

    const handleSaveOrder = (data: Omit<LaboratoryOrder, 'id' | 'branchId' | 'patientName'>) => {
        const patient = filteredPatients.find(p => p.id === data.patientId);
        if (!patient) return;

        const newOrder: LaboratoryOrder = {
            ...data,
            id: `lab${allLabOrders.length + 1}`,
            branchId: selectedBranch,
            patientName: patient.name,
        };
        setAllLabOrders(prev => [...prev, newOrder]);
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
            <LabTable data={labOrders} />
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
