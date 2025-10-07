
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { patients as allPatients } from "@/lib/data";
import { PatientsTable } from "./components/patients-table";
import { useBranch } from "@/context/branch-context";
import { useState, useMemo } from "react";
import { currentUser } from "@/lib/user";
import type { Patient, BasePatient } from "@/lib/types";
import { PatientForm } from "./components/patient-form";

export default function PatientsPage() {
  const { selectedBranch } = useBranch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientsData, setPatientsData] = useState(allPatients);

  const patients = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return patientsData.filter(p => p.branchId === selectedBranch);
    }
    return patientsData.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch, patientsData]);

  const handleSavePatient = (data: BasePatient) => {
    const newPatient: Patient = {
      ...data,
      id: `p${patientsData.length + 1}`,
      dentalRecords: [],
      treatmentPlans: [],
      imaging: [],
      lastVisit: new Date().toISOString().split('T')[0],
      branchId: selectedBranch,
    };
    setPatientsData(prev => [...prev, newPatient]);
    setIsFormOpen(false);
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            Manage your patients and view their records.
          </CardDescription>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2" />
          Add Patient
        </Button>
      </CardHeader>
      <CardContent>
        <PatientsTable data={patients} />
      </CardContent>
    </Card>
    {isFormOpen && (
      <PatientForm
        onSave={handleSavePatient}
        onOpenChange={setIsFormOpen}
      />
    )}
    </>
  );
}
