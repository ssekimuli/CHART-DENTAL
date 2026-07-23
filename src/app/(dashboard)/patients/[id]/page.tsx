
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
import type { Patient, Treatment, BasePatient, PatientImage, DentalCondition, SystemTreatment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, Pencil, FileText, Loader2, Upload, MoreHorizontal, HandCoins, Search } from "lucide-react";
import { TreatmentPlanForm } from "./components/treatment-plan-form";
import { PatientForm } from "../components/patient-form";
import { PrescriptionForm } from "./components/prescription-form";
import { EditPrescriptionForm } from "./components/edit-prescription-form";
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
import { deletePatient, getPatientById, updatePatient, addTreatment, updateTreatment, deleteTreatment, addImageToPatient, getTreatments, getPatientInvoices, processPayment, getPatientPrescriptions, deletePrescription, getPatientImages } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ImageUploadForm } from "./components/image-upload-form";
import { hasPermission, getCurrentUser, hasRole } from "@/lib/user";
import { getPatientFullName } from "@/lib/utils";
import { NextVisitButton } from "./components/next-visit-button";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "../../billing/components/payment-form";
import moment from "moment";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<any | undefined>(undefined);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isRxFormOpen, setIsRxFormOpen] = useState(false);
  const [isEditRxFormOpen, setIsEditRxFormOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);

  const handleOpenPaymentForm = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPaymentFormOpen(true);
  };

  const handleClosePaymentForm = () => {
    setSelectedInvoice(undefined);
    setIsPaymentFormOpen(false);
  };

  const handleProcessPayment = async (invoiceId: string, amount: number, method: string) => {
    try {
      const updated = await processPayment(invoiceId, amount, method);
      if (updated) {
        setInvoices((prev) =>
          prev.map((inv) => (String(inv.id) === String(updated.id) ? { ...inv, ...updated, paidAmount: Number(updated.paidAmount), amount: Number(updated.amount) } : inv))
        );
        toast({
          title: "Payment Recorded",
          description: `Recorded payment of ${formatCurrency(amount)} via ${method}.`,
        });
      }
      handleClosePaymentForm();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing the payment.",
        variant: "destructive",
      });
      console.error('Error processing payment:', error);
    }
  };

  const handleDeletePrescription = async (prescriptionId: string | number) => {
    if (confirm("Are you sure you want to delete this prescription?")) {
      const success = await deletePrescription(prescriptionId);
      if (success) {
        setPrescriptions(prev => prev.filter(p => String(p.id) !== String(prescriptionId)));
        toast({ title: "Deleted", description: "Prescription deleted successfully." });
      } else {
        toast({ title: "Error", description: "Failed to delete prescription.", variant: "destructive" });
      }
    }
  };

  const canUpdatePatient = hasPermission('patients:update');
  const canDeletePatient = hasPermission('patients:delete');
  const currentUser = getCurrentUser();
  const isReceptionist = hasRole('Receptionist');

  useEffect(() => {
    if (typeof id !== "string") return;
    const fetchData = async () => {
        setIsLoading(true);
        const [patientData, treatmentsData, invoicesData, prescriptionsData, imagesData] = await Promise.all([
            getPatientById(id),
            getTreatments(),
            getPatientInvoices(id),
            getPatientPrescriptions(id),
            getPatientImages(id)
        ]);
        setPatient(patientData);
        setSystemTreatments(treatmentsData);
        setInvoices(invoicesData);
        setPrescriptions(prescriptionsData);
        setPatientImages(imagesData);
        if (patientData && !isReceptionist && patientData.history) {
            summarizePatientHistory({ patientHistory: patientData.history }).then(setHistorySummary);
        }
        setIsLoading(false);
    }
    fetchData();
  }, [id, isReceptionist]);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchImages = async () => {
        const images = await getPatientImages(id, { search: imageSearchQuery });
        setPatientImages(images);
    };
    const timeoutId = setTimeout(fetchImages, 300);
    return () => clearTimeout(timeoutId);
  }, [imageSearchQuery, id]);


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

  const handleAddImage = async (newImage: FormData) => {
    if (!patient) return;
    const updatedPatient = await addImageToPatient(patient.id, newImage);
     if (updatedPatient) {
        setPatient(updatedPatient);
        // refresh images
        const images = await getPatientImages(patient.id, { search: imageSearchQuery });
        setPatientImages(images);
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
            <div className="mt-2 flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
              <span>DOB: {patient.dateOfBirth}</span>
              <span>Last Visit: {patient.lastVisit || 'Never'}</span>
              {patient.nextVisit && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">Next Visit: {patient.nextVisit}</span>
              )}
              <Badge variant={patient.status === 'Active' ? 'default' : 'outline'}>{patient.status}</Badge>
              {canUpdatePatient && (
                 <NextVisitButton patient={patient} onUpdate={setPatient} />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isReceptionist && (
                <Button variant="outline" onClick={() => setIsRxFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Give Prescription
                </Button>
            )}
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
        <Tabs defaultValue="documents">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Patient documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>
          

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Patient Documents</CardTitle>
                  <CardDescription>
                    Images, X-Rays, and other patient documents.
                  </CardDescription>
                </div>
                 {canUpdatePatient && (
                      <Button size="sm" onClick={() => setIsImageFormOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                      </Button>
                 )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="Image">
                  <TabsList className="mb-4">
                    <TabsTrigger value="Image">Images</TabsTrigger>
                    <TabsTrigger value="X-Ray">X-Rays</TabsTrigger>
                    <TabsTrigger value="Other Doc">Other Docs</TabsTrigger>
                  </TabsList>
                  {['Image', 'X-Ray', 'Other Doc'].map((cat) => (
                    <TabsContent key={cat} value={cat}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`Search ${cat.toLowerCase()}s...`}
                            className="pl-8"
                            value={imageSearchQuery}
                            onChange={(e) => setImageSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {patientImages.filter(img => (img.category || 'Image') === cat).map((image, index) => (
                          <div key={index} className="overflow-hidden rounded-lg border group relative">
                            <img
                              src={image.url}
                              alt={image.description || `Patient document ${index + 1}`}
                              className="aspect-video h-auto w-full object-cover"
                              data-ai-hint="dental xray"
                            />
                             <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <p className="text-xs font-bold">{image.description}</p>
                                <p className="text-xs">{image.date}</p>
                            </div>
                          </div>
                        ))}
                         {patientImages.filter(img => (img.category || 'Image') === cat).length === 0 && (
                              <div className="col-span-full h-48 flex items-center justify-center">
                                <p className="text-muted-foreground">No {cat.toLowerCase()}s found.</p>
                              </div>
                            )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  View and track billing invoices and payment statuses for this patient.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.issueDate ? moment(invoice.issueDate).format("MMM DD, YYYY") : '-'}</TableCell>
                          <TableCell>{invoice.dueDate ? moment(invoice.dueDate).format("MMM DD, YYYY") : '-'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(invoice.paidAmount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "Paid"
                                  ? "secondary"
                                  : invoice.status === "Unpaid" || invoice.status === "Overdue"
                                  ? "destructive"
                                  : "outline"
                              }
                              className={
                                invoice.status === "Paid"
                                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                  : ""
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenPaymentForm(invoice)} disabled={invoice.status === 'Paid'}>
                                  <HandCoins className="mr-2 h-4 w-4" />
                                  Pay
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {invoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No invoices found for this patient.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions</CardTitle>
                <CardDescription>
                  View and manage patient's prescription history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((rx) => (
                        <TableRow key={rx.id}>
                          <TableCell>{rx.prescriptionDate || rx.prescription_date ? moment(rx.prescriptionDate || rx.prescription_date).format("MMM DD, YYYY") : '-'}</TableCell>
                          <TableCell>{rx.doctorName || rx.doctor_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={rx.status === 'Dispensed' ? 'secondary' : 'outline'}>{rx.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{rx.notes || '-'}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPrescription(rx);
                                  setIsEditRxFormOpen(true);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeletePrescription(rx.id)} className="text-destructive focus:text-destructive">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {prescriptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No prescriptions found for this patient.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
      {isPaymentFormOpen && selectedInvoice && (
        <PaymentForm
          invoice={selectedInvoice}
          onSave={handleProcessPayment as any}
          onOpenChange={handleClosePaymentForm}
        />
      )}
      {isRxFormOpen && patient && (
        <PrescriptionForm
          patientId={patient.id}
          patientName={getPatientFullName(patient)}
          branchId={patient.branchId}
          onOpenChange={setIsRxFormOpen}
          onSave={() => {
            const fetchInvoices = async () => {
              const invList = await getPatientInvoices(patient.id);
              setInvoices(invList);
            };
            const fetchRx = async () => {
              const rxList = await getPatientPrescriptions(patient.id);
              setPrescriptions(rxList);
            };
            fetchInvoices();
            fetchRx();
          }}
        />
      )}
      {isEditRxFormOpen && selectedPrescription && patient && (
        <EditPrescriptionForm
          prescription={selectedPrescription}
          patientName={getPatientFullName(patient)}
          branchId={patient.branchId}
          onOpenChange={setIsEditRxFormOpen}
          onSave={() => {
            const fetchRx = async () => {
              const rxList = await getPatientPrescriptions(patient.id);
              setPrescriptions(rxList);
            };
            fetchRx();
          }}
        />
      )}
    </div>
  );
}
