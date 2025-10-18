
"use client";

import { notFound, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DentalChart } from "../components/dental-chart";
import { useState, useEffect, use } from "react";
import type { Patient, DentalRecord, Treatment, PeriodontalRecord, OcclusalRecord, OrthodonticRecord, SoftTissueRecord, DentalCondition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PeriodontalChart } from "./components/periodontal-chart";
import { OcclusalChart } from "./components/occlusal-chart";
import { SoftTissueChart } from "./components/soft-tissue-chart";
import { TreatmentPlanForm } from "../components/treatment-plan-form";
import { OrthodonticChart } from "./components/orthodontic-chart";
import { ConditionLogger } from "../components/condition-logger";
import { getPatientById, addTreatment, saveDentalRecord, savePeriodontalRecord, saveOcclusalRecord, saveOrthodonticRecord, updateOrthodonticRecord, deleteOrthodonticRecord, saveSoftTissueRecord, updateSoftTissueRecord, deleteSoftTissueRecord } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { getPatientFullName } from "@/lib/utils";

export default function PatientChartingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedToothForTreatment, setSelectedToothForTreatment] = useState<number | undefined>(undefined);

  const [isConditionLoggerOpen, setIsConditionLoggerOpen] = useState(false);
  const [selectedToothForCondition, setSelectedToothForCondition] = useState<number | undefined>(undefined);


  useEffect(() => {
    const user = getCurrentUser();
    if (user && (user.role === 'Receptionist' || user.role === 'Account')) {
        router.replace('/dashboard');
        return;
    }

    if (typeof id !== 'string') return;
    const fetchData = async () => {
        setIsLoading(true);
        const patientData = await getPatientById(id);
        setPatient(patientData);
        setIsLoading(false);
    }
    fetchData();
  }, [id, router]);


  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <h1 className="text-xl font-semibold">Loading Charting...</h1>
            </div>
            <Card>
                <CardHeader>
                    <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!patient) {
    // This could be because of loading, redirection, or not found.
    // If not loading and no patient, it's a 404.
    if (!isLoading) {
       notFound();
    }
    return null; // Return null during the loading/redirect state
  }

  const handleAddTreatment = async (newTreatment: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => {
    const savedTreatment = await addTreatment(patient.id, newTreatment, condition);
    if (savedTreatment) {
      // Update the patient's treatment plans and dental records
      const updatedDentalRecords = [...patient.dentalRecords];

      // If a tooth is specified and condition is provided, update the dental record
      if (newTreatment.tooth && condition) {
        const recordIndex = updatedDentalRecords.findIndex(r => r.toothId === newTreatment.tooth);
        const newRecord: DentalRecord = {
          toothId: newTreatment.tooth,
          condition: condition,
          notes: savedTreatment.procedure || ''
        };

        if (recordIndex > -1) {
          updatedDentalRecords[recordIndex] = newRecord;
        } else {
          updatedDentalRecords.push(newRecord);
        }
      }

      setPatient({
        ...patient,
        treatmentPlans: [...patient.treatmentPlans, savedTreatment],
        dentalRecords: updatedDentalRecords
      });
    }
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
  }

  const handleSaveDentalRecord = async (record: DentalRecord) => {
    if (!patient) return;
    const savedRecord = await saveDentalRecord(patient.id, record);
    if (savedRecord) {
        // Update the patient's dental records with the saved record
        const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === savedRecord.toothId);
        const newRecords = [...patient.dentalRecords];

        if (recordIndex > -1) {
            newRecords[recordIndex] = savedRecord;
        } else {
            newRecords.push(savedRecord);
        }

        setPatient({ ...patient, dentalRecords: newRecords });
    }
    setIsConditionLoggerOpen(false);
    setSelectedToothForCondition(undefined);
  }
  
  const handleSavePeriodontalRecord = async (records: PeriodontalRecord) => {
     if (!patient) return;
     const updatedPatient = await savePeriodontalRecord(patient.id, records);
     if (updatedPatient) {
         setPatient(updatedPatient);
     }
  }

  const handleSaveOcclusalRecord = async (record: OcclusalRecord) => {
    if (!patient) return;
    const updatedPatient = await saveOcclusalRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  };

  const handleSaveOrthoRecord = async (record: Omit<OrthodonticRecord, 'id'>) => {
    if (!patient) return;
    const updatedPatient = await saveOrthodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleUpdateOrthoRecord = async (record: OrthodonticRecord) => {
    if (!patient) return;
    const updatedPatient = await updateOrthodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }
  
  const handleDeleteOrthoRecord = async (recordId: string) => {
    if (!patient) return;
    const updatedPatient = await deleteOrthodonticRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleSaveSoftTissueRecord = async (record: Omit<SoftTissueRecord, 'id'>) => {
    if (!patient) return;
    const updatedPatient = await saveSoftTissueRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
 }

 const handleUpdateSoftTissueRecord = async (record: SoftTissueRecord) => {
    if (!patient) return;
    const updatedPatient = await updateSoftTissueRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
 }

 const handleDeleteSoftTissueRecord = async (recordId: string) => {
    if (!patient) return;
    const updatedPatient = await deleteSoftTissueRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
 }

  const handleOpenTreatmentForm = (toothId: number) => {
    setSelectedToothForTreatment(toothId);
    setIsTreatmentFormOpen(true);
  }
  
  const handleCloseTreatmentForm = () => {
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
  }
  
  const handleOpenConditionLogger = (toothId: number) => {
    setSelectedToothForCondition(toothId);
    setIsConditionLoggerOpen(true);
  }


  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push(`/patients/${patient.id}`)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <Avatar className="h-9 w-9 border">
            <AvatarImage src={patient.avatar} />
            <AvatarFallback>{patient.first_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {getPatientFullName(patient)} - Charting
        </h1>
      </div>
      <Tabs defaultValue="odontogram">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="odontogram">Odontogram</TabsTrigger>
          <TabsTrigger value="periodontal">Periodontal</TabsTrigger>
          <TabsTrigger value="occlusal">Occlusal</TabsTrigger>
          <TabsTrigger value="soft-tissue">Soft Tissue</TabsTrigger>
          <TabsTrigger value="orthodontic">Orthodontic</TabsTrigger>
        </TabsList>

        <TabsContent value="odontogram">
            <Card>
                <CardHeader>
                    <CardTitle>Odontogram (Dental Chart)</CardTitle>
                    <CardDescription>
                        Interactive chart of each tooth and its condition. Click a tooth to log conditions or add treatments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DentalChart 
                        initialRecords={patient.dentalRecords}
                        treatmentPlans={patient.treatmentPlans}
                        onAddTreatment={handleOpenTreatmentForm}
                        onLogCondition={handleOpenConditionLogger}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="periodontal">
            <PeriodontalChart initialRecords={patient.periodontalRecords} onSave={handleSavePeriodontalRecord} />
        </TabsContent>
        <TabsContent value="occlusal">
            <OcclusalChart initialRecord={patient.occlusalRecords} onSave={handleSaveOcclusalRecord} />
        </TabsContent>
        <TabsContent value="soft-tissue">
            <SoftTissueChart
              initialRecords={patient.softTissueRecords}
              onSave={handleSaveSoftTissueRecord}
              onUpdate={handleUpdateSoftTissueRecord}
              onDelete={handleDeleteSoftTissueRecord}
            />
        </TabsContent>
        <TabsContent value="orthodontic">
            <OrthodonticChart 
              initialRecords={patient.orthodonticRecords} 
              onSave={handleSaveOrthoRecord}
              onUpdate={handleUpdateOrthoRecord}
              onDelete={handleDeleteOrthoRecord}
            />
        </TabsContent>
      </Tabs>
      {isTreatmentFormOpen && (
        <TreatmentPlanForm
            onSave={handleAddTreatment}
            onOpenChange={handleCloseTreatmentForm}
            toothId={selectedToothForTreatment}
            currentCondition={patient.dentalRecords.find(r => r.toothId === selectedToothForTreatment)?.condition}
        />
      )}
      {isConditionLoggerOpen && selectedToothForCondition && (
        <ConditionLogger
            toothId={selectedToothForCondition}
            currentRecord={patient.dentalRecords.find(r => r.toothId === selectedToothForCondition)}
            onSave={(toothId, condition, notes) => handleSaveDentalRecord({ toothId, condition, notes })}
            onOpenChange={setIsConditionLoggerOpen}
        />
      )}
    </div>
  );
}
