
"use client";

import { notFound, useRouter } from "next/navigation";
import { patients as initialPatients } from "@/lib/data";
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
import { PlusCircle, Trash, Pencil, FileText } from "lucide-react";
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

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [allPatients, setAllPatients] = useState(initialPatients);
  const [patient, setPatient] = useState<Patient | undefined>(
    allPatients.find((p) => p.id === params.id)
  );

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  useEffect(() => {
    if (patient) {
      summarizePatientHistory({ patientHistory: patient.history }).then(setHistorySummary);
    } else {
        const foundPatient = allPatients.find(p => p.id === params.id);
        setPatient(foundPatient);
    }
  }, [patient, params.id, allPatients]);


  if (!patient) {
    // This will be caught by the notFound() call in the next render if patient is still not found
    return null; 
  }
  
  const handleUpdatePatient = (data: BasePatient) => {
    setPatient(prevPatient => {
        if (!prevPatient) return prevPatient;
        const updatedPatient = { ...prevPatient, ...data };
        
        setAllPatients(prevAll => prevAll.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        
        return updatedPatient;
    });
    setIsPatientFormOpen(false);
  }

  const handleDeletePatient = () => {
    setAllPatients(prevAll => prevAll.filter(p => p.id !== params.id));
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
      setAllPatients(prevAll => prevAll.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      return updatedPatient;
    });
    setIsTreatmentFormOpen(false);
  }
  
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
            <CardHeader>
              <CardTitle>Patient Imaging</CardTitle>
              <CardDescription>
                X-Rays and other patient images.
              </CardDescription>
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
