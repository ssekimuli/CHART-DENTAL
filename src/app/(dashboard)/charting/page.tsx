
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { PatientsTable } from "../patients/components/patients-table";
import { useBranch } from "@/context/branch-context";
import { useState, useMemo } from "react";
import { currentUser } from "@/lib/user";
import type { Patient, BasePatient } from "@/lib/types";
import { patients as allPatients } from "@/lib/data";
import { useRouter } from "next/navigation";


export default function ChartingOverviewPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [patientsData, setPatientsData] = useState(allPatients);

    const patients = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return patientsData.filter(p => p.branchId === selectedBranch);
        }
        return patientsData.filter(p => p.branchId === currentUser.branchId);
      }, [selectedBranch, patientsData]);

    const handleViewPatient = (patientId: string) => {
        router.push(`/patients/${patientId}/charting`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Charting</CardTitle>
                <CardDescription>Select a patient to view their detailed charts.</CardDescription>
            </CardHeader>
            <CardContent>
                <PatientsTable 
                    data={patients} 
                    onView={handleViewPatient}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            </CardContent>
        </Card>
    )
}
