
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
import type { Patient, DentalRecord, Treatment, PeriodontalRecord, OcclusalRecord, OrthodonticRecord, SoftTissueRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PeriodontalChart } from "./components/periodontal-chart";
import { OcclusalChart } from "./components/occlusal-chart";
import { SoftTissueChart } from "./components/soft-tissue-chart";
import { TreatmentPlanForm } from "../components/treatment-plan-form";
import { OrthodonticChart } from "./components/orthodontic-chart";
import { getPatientById, updatePatient } from "@/lib/api";

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

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    setPatient(updatedPatient); // Optimistic update
    await updatePatient(updatedPatient.id, updatedPatient);
  }

  const handleAddTreatment = (newTreatment: Omit<Treatment, 'id' | 'date'>) => {
    setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const newPlan: Treatment = {
        ...newTreatment,
        id: `t${prevPatient.treatmentPlans.length + 1}`,
        date: new Date().toISOString().split('T')[0],
      };
      const updatedPatient = {
        ...prevPatient,
        treatmentPlans: [...prevPatient.treatmentPlans, newPlan],
      };
      handleUpdatePatient(updatedPatient);
      return updatedPatient;
    });
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
  }

  const handleSaveDentalRecord = (record: DentalRecord) => {
    setPatient(prevPatient => {
        if (!prevPatient) return prevPatient;
        const newRecords = [...prevPatient.dentalRecords];
        const existingRecordIndex = newRecords.findIndex(r => r.toothId === record.toothId);
        if (existingRecordIndex > -1) {
            newRecords[existingRecordIndex] = record;
        } else {
            newRecords.push(record);
        }
        const updatedPatient = {
            ...prevPatient,
            dentalRecords: newRecords,
        };

        handleUpdatePatient(updatedPatient);
        
        return updatedPatient;
    });
  }
  
  const handleSavePeriodontalRecord = (records: PeriodontalRecord) => {
     setPatient(prevPatient => {
        if (!prevPatient) return prevPatient;
        const updatedPatient = {
            ...prevPatient,
            periodontalRecords: records,
        };
        handleUpdatePatient(updatedPatient);
        return updatedPatient;
    });
  }

  const handleSaveOcclusalRecord = (record: OcclusalRecord) => {
    setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const updatedPatient = {
        ...prevPatient,
        occlusalRecords: record,
      };
      handleUpdatePatient(updatedPatient);
      return updatedPatient;
    });
  };

  const handleSaveOrthoRecord = (record: Omit<OrthodonticRecord, 'id'>) => {
     setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const newRecord: OrthodonticRecord = {
        ...record,
        id: `ortho${prevPatient.orthodonticRecords.length + 1}`,
      };
      const updatedPatient = {
        ...prevPatient,
        orthodonticRecords: [...prevPatient.orthodonticRecords, newRecord].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
      handleUpdatePatient(updatedPatient);
      return updatedPatient;
    });
  }

  const handleUpdateOrthoRecord = (record: OrthodonticRecord) => {
    setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const updatedPatient = {
        ...prevPatient,
        orthodonticRecords: prevPatient.orthodonticRecords.map(r => r.id === record.id ? record : r).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
      handleUpdatePatient(updatedPatient);
      return updatedPatient;
    });
  }
  
  const handleDeleteOrthoRecord = (recordId: string) => {
     setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const updatedPatient = {
        ...prevPatient,
        orthodonticRecords: prevPatient.orthodonticRecords.filter(r => r.id !== recordId),
      };
      handleUpdatePatient(updatedPatient);
      return updatedPatient;
    });
  }

  const handleSaveSoftTissueRecord = (record: Omit<SoftTissueRecord, 'id'>) => {
    setPatient(prevPatient => {
     if (!prevPatient) return prevPatient;
     const newRecord: SoftTissueRecord = {
       ...record,
       id: `soft${prevPatient.softTissueRecords.length + 1}`,
     };
     const updatedPatient = {
       ...prevPatient,
       softTissueRecords: [...prevPatient.softTissueRecords, newRecord].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
     };
     handleUpdatePatient(updatedPatient);
     return updatedPatient;
   });
 }

 const handleUpdateSoftTissueRecord = (record: SoftTissueRecord) => {
   setPatient(prevPatient => {
     if (!prevPatient) return prevPatient;
     const updatedPatient = {
       ...prevPatient,
       softTissueRecords: prevPatient.softTissueRecords.map(r => r.id === record.id ? record : r).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
     };
     handleUpdatePatient(updatedPatient);
     return updatedPatient;
   });
 }

 const handleDeleteSoftTissueRecord = (recordId: string) => {
    setPatient(prevPatient => {
     if (!prevPatient) return prevPatient;
     const updatedPatient = {
       ...prevPatient,
       softTissueRecords: prevPatient.softTissueRecords.filter(r => r.id !== recordId),
     };
     handleUpdatePatient(updatedPatient);
     return updatedPatient;
   });
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
                        onSaveRecord={handleSaveDentalRecord}
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
        />
      )}
    </div>
  );
}
