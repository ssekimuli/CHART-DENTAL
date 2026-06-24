
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
import { useEffect, useState, use } from "react";
import type { Patient, Treatment, BasePatient, PatientImage, DentalCondition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, Pencil, FileText, Loader2, Upload, MoreHorizontal } from "lucide-react";
import { TreatmentPlanForm } from "./components/treatment-plan-form";
import { PatientForm } from "../components/patient-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deletePatient, getPatientById, updatePatient, addTreatment, updateTreatment, deleteTreatment, addImageToPatient } from "@/lib/api";
import { ImageUploadForm } from "./components/image-upload-form";
import { hasPermission, getCurrentUser } from "@/lib/user";
import { getPatientFullName } from "@/lib/utils";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  const canUpdatePatient = hasPermission('patients:update');
  const canDeletePatient = hasPermission('patients:delete');
  const currentUser = getCurrentUser();
  const isReceptionist = currentUser?.role === 'Receptionist';

  useEffect(() => {
    if (typeof id !== "string") return;
    const fetchData = async () => {
        setIsLoading(true);
        const patientData = await getPatientById(id);
        setPatient(patientData);
        if (patientData && !isReceptionist && patientData.history) {
            summarizePatientHistory({ patientHistory: patientData.history }).then(setHistorySummary);
        }
        setIsLoading(false);
    }
    fetchData();
  }, [id, isReceptionist]);


  if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-start gap-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                     <div className="flex-1 space-y-2">
                        <div className="h-8 w-1/2 bg-gray-200 rounded-animate-pulse"></div>
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
    await deletePatient(id);
    router.push('/patients');
    setIsDeleteAlertOpen(false);
  }

  const handleSaveTreatment = async (treatmentData: Omit<Treatment, 'id' | 'date'>) => {
    if (!patient) return;

    if (selectedTreatment) {
        const updatedPatient = await updateTreatment(patient.id, { ...selectedTreatment, ...treatmentData });
        if (updatedPatient) {
            setPatient(updatedPatient);
        }
    } else {
        const savedTreatment = await addTreatment(patient.id, treatmentData);
        if (savedTreatment) {
            // Update the patient's treatment plans with the saved treatment
            setPatient({
                ...patient,
                treatmentPlans: [...patient.treatmentPlans, savedTreatment]
            });
        }
    }

    handleCloseTreatmentForm();
  }
  
  const handleDeleteTreatment = async (treatmentId: string | number) => {
     if (!patient) return;
     const updatedPatient = await deleteTreatment(patient.id, treatmentId);
      if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleAddImage = async (newImage: Omit<PatientImage, 'date'>) => {
    if (!patient) return;
    const updatedPatient = await addImageToPatient(patient.id, newImage);
     if (updatedPatient) {
        setPatient(updatedPatient);
    }
    setIsImageFormOpen(false);
  };
  
  const handleOpenTreatmentForm = (treatment?: Treatment) => {
    setSelectedTreatment(treatment);
    setIsTreatmentFormOpen(true);
  }

  const handleCloseTreatmentForm = () => {
    setSelectedTreatment(undefined);
    setIsTreatmentFormOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={patient.avatar} />
            <AvatarFallback>{patient.first_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{getPatientFullName(patient)}</CardTitle>
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
            {!isReceptionist && (
                <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}/charting`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Charting
                </Button>
            )}
            {canUpdatePatient && (
                <Button variant="outline" size="icon" onClick={() => setIsPatientFormOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Patient</span>
                </Button>
            )}
            {canDeletePatient && (
                 <Button variant="destructive" size="icon" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete Patient</span>
                </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {!isReceptionist && (
        <Tabs defaultValue="treatment">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
            <TabsTrigger value="imaging">Imaging</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="treatment">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Treatment Plan</CardTitle>
                  <CardDescription>
                    List of proposed and ongoing treatments.
                  </CardDescription>
                </div>
                {canUpdatePatient && (
                    <Button size="sm" onClick={() => handleOpenTreatmentForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Treatment
                    </Button>
                )}
              </CardHeader>
              <CardContent className="max-h-[480px] overflow-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Procedure</TableHead>
                        <TableHead>Tooth</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cost</TableHead>
                        {canUpdatePatient && <TableHead className="text-right">Actions</TableHead>}
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
                          <TableCell>
                            ${Number(plan.cost).toFixed(2)}
                          </TableCell>
                          {canUpdatePatient && (
                              <TableCell className="text-right">
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleOpenTreatmentForm(plan)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTreatment(plan.id)}>
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                  </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              </TableCell>
                          )}
                        </TableRow>
                      ))}
                       {patient.treatmentPlans.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No treatment plans yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
                 {canUpdatePatient && (
                      <Button size="sm" onClick={() => setIsImageFormOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                      </Button>
                 )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {patient.imaging.map((image, index) => (
                    <div key={index} className="overflow-hidden rounded-lg border group relative">
                      <Image
                        src={image.url}
                        alt={image.description || `Patient image ${index + 1}`}
                        width={400}
                        height={300}
                        className="aspect-video h-auto w-full object-cover"
                        data-ai-hint="dental xray"
                      />
                       <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="text-xs font-bold">{image.description}</p>
                          <p className="text-xs">{image.date}</p>
                      </div>
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
      )}
      {isTreatmentFormOpen && (
        <TreatmentPlanForm
            treatment={selectedTreatment}
            onSave={handleSaveTreatment as any}
            onOpenChange={handleCloseTreatmentForm}
        />
      )}
      {isPatientFormOpen && (
        <PatientForm
            patient={patient}
            onSave={handleUpdatePatient}
            onOpenChange={setIsPatientFormOpen}
        />
      )}
       {isImageFormOpen && (
        <ImageUploadForm
            onSave={handleAddImage}
            onOpenChange={setIsImageFormOpen}
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
