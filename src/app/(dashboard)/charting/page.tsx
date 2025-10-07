
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
import { useState, useMemo, useEffect } from "react";
import { currentUser } from "@/lib/user";
import type { Patient } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getPatients } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";


export default function ChartingOverviewPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [patientsData, setPatientsData] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getPatients();
            setPatientsData(data);
            setIsLoading(false);
        }
        fetchData();
    }, []);

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
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <PatientsTable 
                    data={patients} 
                    onView={handleViewPatient}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
                )}
            </CardContent>
        </Card>
    )
}
