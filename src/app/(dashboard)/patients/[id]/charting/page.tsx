
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
import { useState, useEffect } from "react";
import type { Patient, DentalRecord, Treatment, PeriodontalRecord, OcclusalRecord, OrthodonticRecord, SoftTissueRecord, DentalCondition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PeriodontalChart } from "./components/periodontal-chart";
import { OcclusalChart } from "./components/occlusal-chart";
import { SoftTissueChart } from "./components/soft-tissue-chart";
import { TreatmentPlanForm } from "../components/treatment-plan-form";
import { OrthodonticChart } from "./components/orthodontic-chart";
import { getPatientById, addTreatment, saveDentalRecord, savePeriodontalRecord, saveOcclusalRecord, saveOrthodonticRecord, updateOrthodonticRecord, deleteOrthodonticRecord, saveSoftTissueRecord, updateSoftTissueRecord, deleteSoftTissueRecord } from "@/lib/api";

export default function PatientChartingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedToothForTreatment, setSelectedToothForTreatment] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof params.id !== 'string') return;
    const fetchData = async () => {
        setIsLoading(true);
        const patientData = await getPatientById(params.id);
        setPatient(patientData);
        setIsLoading(false);
    }
    fetchData();
  }, [params.id]);


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
    notFound();
  }

  const handleAddTreatment = async (newTreatment: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => {
    const updatedPatient = await addTreatment(patient.id, newTreatment, condition);
    if (updatedPatient) {
      setPatient(updatedPatient);
    }
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
  }

  const handleSaveDentalRecord = async (record: DentalRecord) => {
    if (!patient) return;
    const updatedPatient = await saveDentalRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
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

  const handleOpenTreatmentForm = (toothId?: number) => {
    setSelectedToothForTreatment(toothId);
    setIsTreatmentFormOpen(true);
  }
  
  const handleCloseTreatmentForm = () => {
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
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
            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {patient.name} - Charting
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
    </div>
  );
}
