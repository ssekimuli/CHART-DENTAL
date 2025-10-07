
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
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";

export default function PatientsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientsData, setPatientsData] = useState(allPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const patients = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return patientsData.filter(p => p.branchId === selectedBranch);
    }
    return patientsData.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch, patientsData]);
  
  const handleOpenForm = (patient?: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setSelectedPatient(undefined);
    setIsFormOpen(false);
  }

  const handleSavePatient = (data: BasePatient) => {
    if (selectedPatient) {
        // Update
        const updatedPatient = { ...selectedPatient, ...data };
        setPatientsData(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    } else {
        // Create
        const newPatient: Patient = {
        ...data,
        id: `p${patientsData.length + 1}`,
        dentalRecords: [],
        treatmentPlans: [],
        imaging: [],
        lastVisit: new Date().toISOString().split('T')[0],
        branchId: selectedBranch,
        periodontalRecords: { pockets: [], recession: {}, bleeding: [], mobility: {}, furcation: {} },
        occlusalRecords: { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' },
        softTissueRecords: [],
        };
        setPatientsData(prev => [...prev, newPatient]);
    }
    handleCloseForm();
  }
  
  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteAlertOpen(true);
  }

  const handleDeletePatient = () => {
    if (selectedPatient) {
        setPatientsData(prev => prev.filter(p => p.id !== selectedPatient.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedPatient(undefined);
  };
  
  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

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
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2" />
          Add Patient
        </Button>
      </CardHeader>
      <CardContent>
        <PatientsTable 
            data={patients} 
            onEdit={handleOpenForm}
            onDelete={openDeleteDialog}
            onView={handleViewPatient}
        />
      </CardContent>
    </Card>
    {isFormOpen && (
      <PatientForm
        patient={selectedPatient}
        onSave={handleSavePatient}
        onOpenChange={handleCloseForm}
      />
    )}
     <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
