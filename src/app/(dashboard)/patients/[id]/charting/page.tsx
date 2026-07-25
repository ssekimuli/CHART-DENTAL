
"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Trash, Pencil, MoreHorizontal } from "lucide-react";
import { getTreatments, deleteTreatment } from "@/lib/api";
import type { SystemTreatment } from "@/lib/types";


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
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ChartLoader = () => <Skeleton className="w-full h-[400px] rounded-lg" />;

const DentalChart = dynamic(() => import("../components/dental-chart").then(mod => mod.DentalChart), { ssr: false, loading: ChartLoader });
const PeriodontalChart = dynamic(() => import("./components/periodontal-chart").then(mod => mod.PeriodontalChart), { ssr: false, loading: ChartLoader });
const OcclusalChart = dynamic(() => import("./components/occlusal-chart").then(mod => mod.OcclusalChart), { ssr: false, loading: ChartLoader });
const SoftTissueChart = dynamic(() => import("./components/soft-tissue-chart").then(mod => mod.SoftTissueChart), { ssr: false, loading: ChartLoader });
const OrthodonticChart = dynamic(() => import("./components/orthodontic-chart").then(mod => mod.OrthodonticChart), { ssr: false, loading: ChartLoader });
const EndodonticChart = dynamic(() => import("./components/endodontic-chart").then(mod => mod.EndodonticChart), { ssr: false, loading: ChartLoader });

const TreatmentPlanForm = dynamic(() => import("../components/treatment-plan-form").then(mod => mod.TreatmentPlanForm), { ssr: false });
const RestorativeRecordForm = dynamic(() => import("./components/restorative-record-form").then(mod => mod.RestorativeRecordForm), { ssr: false });
const PrescriptionForm = dynamic(() => import("../components/prescription-form").then(mod => mod.PrescriptionForm), { ssr: false });
const ConditionLogger = dynamic(() => import("../components/condition-logger").then(mod => mod.ConditionLogger), { ssr: false });
import { useState, useEffect, use } from "react";
import type { Patient, DentalRecord, Treatment, PeriodontalRecord, OcclusalRecord, OrthodonticRecord, SoftTissueRecord, DentalCondition, EndodonticRecord, RestorativeRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pill, Upload } from "lucide-react";
import { getPatientById, addTreatment, updateTreatment, saveDentalRecord, savePeriodontalRecord, saveOcclusalRecord, saveOrthodonticRecord, updateOrthodonticRecord, deleteOrthodonticRecord, saveSoftTissueRecord, updateSoftTissueRecord, deleteSoftTissueRecord, saveEndodonticRecord, updateEndodonticRecord, deleteEndodonticRecord, saveRestorativeRecord, updateRestorativeRecord, deleteRestorativeRecord } from "@/lib/api";
import { getCurrentUser, hasRole, hasPermission } from "@/lib/user";
import { getPatientFullName } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";

export default function PatientChartingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency } = useCurrency();
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const canUpdatePatient = hasPermission('patients:update');
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);

  const handleDeleteTreatment = async (treatmentId: string | number) => {
     if (!patient) return;
     const updatedPatient = await deleteTreatment(patient.id, treatmentId);
      if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleOpenTreatmentFormForEdit = (treatment?: Treatment) => {
    setSelectedTreatment(treatment);
    setSelectedToothForTreatment(undefined);
    setIsTreatmentFormOpen(true);
  }


  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedToothForTreatment, setSelectedToothForTreatment] = useState<number | undefined>(undefined);

  const [isConditionLoggerOpen, setIsConditionLoggerOpen] = useState(false);
  const [selectedToothForCondition, setSelectedToothForCondition] = useState<number | undefined>(undefined);

  const [isRestorativeFormOpen, setIsRestorativeFormOpen] = useState(false);
  const [selectedToothForRestorative, setSelectedToothForRestorative] = useState<number | undefined>(undefined);
  const [selectedSurfaceForRestorative, setSelectedSurfaceForRestorative] = useState<string | undefined>(undefined);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);

  const handleOpenRestorativeForm = (toothId: number, surface?: string) => {
    setSelectedToothForRestorative(toothId);
    setSelectedSurfaceForRestorative(surface);
    setIsRestorativeFormOpen(true);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (hasRole(['Receptionist', 'Account'])) {
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

  const handleSaveTreatment = async (treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => {
    if (!patient) return;
    
    if (selectedTreatment) {
        // It's an update
        const updatedTreatmentObj = {
            ...selectedTreatment,
            ...treatmentData,
        } as Treatment;
        
        const updatedPatient = await updateTreatment(patient.id, updatedTreatmentObj);
        if (updatedPatient) {
            setPatient(updatedPatient);
        }
    } else {
        // It's a new treatment
        const savedTreatment = await addTreatment(patient.id, treatmentData, condition);
        if (savedTreatment) {
            // Update the patient's treatment plans and dental records
            const updatedDentalRecords = [...patient.dentalRecords];

            // If a tooth is specified and condition is provided, update the dental record
            if (treatmentData.tooth && condition) {
                const recordIndex = updatedDentalRecords.findIndex(r => r.toothId === treatmentData.tooth);
                const newRecord: DentalRecord = {
                toothId: treatmentData.tooth,
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
                treatmentPlans: [savedTreatment, ...patient.treatmentPlans],
                dentalRecords: updatedDentalRecords
            });
        }
    }
    
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
    setSelectedTreatment(undefined);
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
  
  const handleDeleteOrthoRecord = async (recordId: string | number) => {
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

  const handleDeleteSoftTissueRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteSoftTissueRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleSaveEndoRecord = async (record: Omit<EndodonticRecord, 'id' | 'date'>) => {
    if (!patient) return;
    const updatedPatient = await saveEndodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleUpdateEndoRecord = async (record: EndodonticRecord) => {
    if (!patient) return;
    const updatedPatient = await updateEndodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleDeleteEndoRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteEndodonticRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleSaveRestorativeRecord = async (record: Omit<RestorativeRecord, 'id' | 'createdAt' | 'updatedAt'> & { procedureCost?: number, materialCost?: number, otherCharges?: number }) => {
    if (!patient) return;
    const updatedPatient = await saveRestorativeRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleUpdateRestorativeRecord = async (record: RestorativeRecord) => {
    if (!patient) return;
    const updatedPatient = await updateRestorativeRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleDeleteRestorativeRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteRestorativeRecord(patient.id, recordId);
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

  const handleQuickLogCondition = async (toothId: number, condition: DentalCondition) => {
    handleSaveDentalRecord({
        toothId,
        condition,
        notes: ''
    });
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
        <h1 className="shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight">
          {getPatientFullName(patient)} - Charting
        </h1>
        <Button size="sm" onClick={() => setIsPrescriptionFormOpen(true)} className="ml-2">
          <Pill className="mr-2 h-4 w-4" />
          Give prescription
        </Button>
        <Button size="sm" onClick={() => router.push(`/patients/${patient.id}`)} className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Upload className="mr-2 h-4 w-4" />
          Upload documents
        </Button>
      </div>
      <Tabs defaultValue="odontogram">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="odontogram">Odontogram</TabsTrigger>
          <TabsTrigger value="periodontal">Periodontal</TabsTrigger>
          <TabsTrigger value="occlusal">Occlusal</TabsTrigger>
          <TabsTrigger value="soft-tissue">Soft Tissue</TabsTrigger>
          <TabsTrigger value="orthodontic">Orthodontic</TabsTrigger>
          <TabsTrigger value="endodontic">Endodontic</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
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
                        restorativeRecords={patient.restorativeRecords || []}
                        onAddTreatment={handleOpenTreatmentForm}
                        onLogCondition={handleOpenConditionLogger}
                        onQuickLogCondition={handleQuickLogCondition}
                        onAddRestorativeRecord={handleOpenRestorativeForm}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="periodontal">
            <PeriodontalChart 
                initialRecords={patient.periodontalRecords} 
                dentalRecords={patient.dentalRecords}
                patient={patient}
                onSave={handleSavePeriodontalRecord} 
            />
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
        <TabsContent value="endodontic">
            <EndodonticChart 
              initialRecords={patient.endodonticRecords || []}
              onSave={handleSaveEndoRecord}
              onUpdate={handleUpdateEndoRecord}
              onDelete={handleDeleteEndoRecord}
            />
        </TabsContent>

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
                    <Button size="sm" onClick={() => handleOpenTreatmentFormForEdit()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Treatment
                    </Button>
                )}
              </CardHeader>
              <CardContent className="overflow-auto max-h-[480px]">
                {patient.treatmentPlans.length > 0 ? (
                  <Table className="min-w-full border rounded-md">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                            {formatCurrency(Number(plan.cost))}
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
                                  <DropdownMenuItem onClick={() => handleOpenTreatmentFormForEdit(plan)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTreatment(plan.id)}>
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                  </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[200px] border rounded-md">
                    <p>No treatments found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      {isTreatmentFormOpen && (
        <TreatmentPlanForm
            treatment={selectedTreatment}
            onSave={handleSaveTreatment}
            onOpenChange={handleCloseTreatmentForm}
            toothId={selectedToothForTreatment}
            currentCondition={patient.dentalRecords.find(r => r.toothId === (selectedToothForTreatment || selectedTreatment?.tooth))?.condition}
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
      <RestorativeRecordForm
         open={isRestorativeFormOpen}
         onOpenChange={setIsRestorativeFormOpen}
         initialData={{ toothId: selectedToothForRestorative || 1, surface: selectedSurfaceForRestorative || 'Whole Tooth', material: '' } as RestorativeRecord}
         onSave={handleSaveRestorativeRecord}
         onUpdate={handleUpdateRestorativeRecord}
      />
      {isPrescriptionFormOpen && (
        <PrescriptionForm
          patientId={patient.id}
          patientName={getPatientFullName(patient)}
          branchId={patient.branch_id || getCurrentUser()?.branchId || 1}
          onOpenChange={setIsPrescriptionFormOpen}
          onSave={() => {
            setIsPrescriptionFormOpen(false);
          }}
        />
      )}
    </div>
  );
}
