"use client";

import { PatientForm } from "../components/patient-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createPatient } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import { BasePatient } from "@/lib/types";

export default function NewPatientPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();

    const handleSave = async (data: BasePatient) => {
        const newPatient = await createPatient({ ...data, branchId: selectedBranch });
        if (newPatient) {
            router.push("/patients");
            router.refresh();
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Patient</CardTitle>
                    <CardDescription>
                        Fill out the details for the new patient.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PatientForm 
                        onSave={handleSave} 
                        onOpenChange={(open) => {
                            if (!open) {
                                router.push("/patients");
                            }
                        }}
                        asModal={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
