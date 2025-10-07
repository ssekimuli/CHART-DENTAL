
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
import { AITreatmentPlan } from "./components/ai-treatment-plan";
import Image from "next/image";
import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import type { Patient, Treatment, BasePatient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, Pencil, FileText, Loader2, Upload } from "lucide-react";
import { TreatmentPlanForm } from "./components/treatment-plan-form";
import { PatientForm } from "../components/patient-form";
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
import { deletePatient, getPatientById, updatePatient } from "@/lib/api";

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  useEffect(() => {
    if (typeof params.id !== "string") return;
    const fetchData = async () => {
        setIsLoading(true);
        const patientData = await getPatientById(params.id);
        setPatient(patientData);
        if (patientData) {
            summarizePatientHistory({ patientHistory: patientData.history }).then(setHistorySummary);
        }
        setIsLoading(false);
    }
    fetchData();
  }, [params.id]);


  if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-start gap-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                     <div className="flex-1 space-y-2">
                        <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                     </div>
                </CardHeader>
            </Card>
             <div className="h-48 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      )
  }

  if (!patient) {
    notFound(); 
  }
  
  const handleUpdatePatient = async (data: BasePatient) => {
    const updated = await updatePatient(patient.id, data);
    if(updated) {
        setPatient(updated);
    }
    setIsPatientFormOpen(false);
  }

  const handleDeletePatient = async () => {
    await deletePatient(params.id as string);
    router.push('/patients');
    setIsDeleteAlertOpen(false);
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
      updatePatient(updatedPatient.id, updatedPatient);
      return updatedPatient;
    });
    setIsTreatmentFormOpen(false);
  }
  
  const handleUploadImage = () => {
    setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const newImage = `https://picsum.photos/seed/newxray${Date.now()}/800/600`;
      const updatedPatient = {
        ...prevPatient,
        imaging: [...prevPatient.imaging, newImage],
      };
      updatePatient(updatedPatient.id, updatedPatient);
      return updatedPatient;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={patient.avatar} />
            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription className="text-base">
              {patient.email}
            </CardDescription>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span>DOB: {patient.dateOfBirth}</span>
              <span>Last Visit: {patient.lastVisit}</span>
              <Badge variant={patient.status === 'Active' ? 'default' : 'outline'}>{patient.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}/charting`)}>
                <FileText className="mr-2 h-4 w-4" />
                Charting
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsPatientFormOpen(true)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Patient</span>
            </Button>
             <Button variant="destructive" size="icon" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete Patient</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="treatment">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="treatment">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AITreatmentPlan
              patientHistory={patient.history}
              dentalRecords={patient.dentalRecords}
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Treatment Plan</CardTitle>
                  <CardDescription>
                    List of proposed and ongoing treatments.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsTreatmentFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Treatment
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Tooth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.treatmentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.procedure}
                        </TableCell>
                        <TableCell>{plan.tooth || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${plan.cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                     {patient.treatmentPlans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No treatment plans yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Patient Imaging</CardTitle>
                <CardDescription>
                  X-Rays and other patient images.
                </CardDescription>
              </div>
               <Button size="sm" onClick={handleUploadImage}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {patient.imaging.map((src, index) => (
                  <div key={index} className="overflow-hidden rounded-lg border">
                    <Image
                      src={src}
                      alt={`Patient image ${index + 1}`}
                      width={400}
                      height={300}
                      className="aspect-video h-auto w-full object-cover"
                      data-ai-hint="dental xray"
                    />
                  </div>
                ))}
                 {patient.imaging.length === 0 && (
                      <div className="col-span-full h-48 flex items-center justify-center">
                        <p className="text-muted-foreground">No images found.</p>
                      </div>
                    )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Patient History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold">AI Summary</h3>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {historySummary?.summary || "Generating summary..."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Full History</h3>
                <div className="mt-1 rounded-md border bg-secondary/30 p-4 text-sm text-muted-foreground">
                    <p className="whitespace-pre-wrap">{patient.history}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {isTreatmentFormOpen && (
        <TreatmentPlanForm
            onSave={handleAddTreatment}
            onOpenChange={setIsTreatmentFormOpen}
        />
      )}
      {isPatientFormOpen && (
        <PatientForm
            patient={patient}
            onSave={handleUpdatePatient}
            onOpenChange={setIsPatientFormOpen}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
