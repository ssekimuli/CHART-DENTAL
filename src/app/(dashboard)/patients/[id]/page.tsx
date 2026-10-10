
"use client";

import { notFound, useRouter } from "next/navigation";
import customAxios from "@/lib/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirm } from "@/hooks/use-confirm";
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
import { AttachPolicyForm } from "./components/attach-policy-form";
import { insuranceApi } from "@/services/api/insurance";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, Pencil, FileText, Loader2, Upload, MoreHorizontal, HandCoins, Search, Send, Mail, MessageCircle, Camera, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { deletePatient, getPatientById, updatePatient, addTreatment, addTreatmentsBatch, updateTreatment, deleteTreatment, addImageToPatient, getTreatments, getPatientInvoices, processPayment, getPatientPrescriptions, deletePrescription, getPatientImages, sendPatientDocuments } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ImageUploadForm } from "./components/image-upload-form";
import { AvatarUploadModal } from "./components/avatar-upload-modal";
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
  const { confirm, ConfirmDialog } = useConfirm();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [systemTreatments, setSystemTreatments] = useState<SystemTreatment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [isSendingDocs, setIsSendingDocs] = useState(false);
  const [isSendDocDialogOpen, setIsSendDocDialogOpen] = useState(false);
  const [sendDocChannel, setSendDocChannel] = useState<'email' | 'whatsapp'>('email');
  const [sendDocRecipient, setSendDocRecipient] = useState('');
  const [sendDocMessage, setSendDocMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [isAvatarUploadModalOpen, setIsAvatarUploadModalOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<any | undefined>(undefined);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isRxFormOpen, setIsRxFormOpen] = useState(false);
  const [isEditRxFormOpen, setIsEditRxFormOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  
  // Claim form states
  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
  const [selectedInvoiceForClaim, setSelectedInvoiceForClaim] = useState<any>(null);
  const [patientInsurances, setPatientInsurances] = useState<any[]>([]);
  const [claimFormData, setClaimFormData] = useState({
    patient_insurance_id: '',
    claim_number: '',
    total_amount: '',
    claimed_amount: '',
    status: 'pending'
  });

  const [isAttachPolicyModalOpen, setIsAttachPolicyModalOpen] = useState(false);

  const fetchPatientInsurances = async () => {
    if (!id) return;
    try {
      const res = await insuranceApi.getPatientPolicies(Number(id));
      setPatientInsurances(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenClaimForm = async (invoice: any) => {
    setSelectedInvoiceForClaim(invoice);
    try {
      const res = await customAxios.get('/patient-insurances');
      const policies = res.data.filter((ins: any) => String(ins.patient_id) === String(patient?.id));
      setPatientInsurances(policies);
    } catch (e) {
      console.error(e);
    }
    setClaimFormData({
      patient_insurance_id: '',
      claim_number: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
      total_amount: invoice.amount,
      claimed_amount: invoice.amount,
      status: 'pending'
    });
    setIsClaimFormOpen(true);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customAxios.post('/insurance-claims', {
        ...claimFormData,
        invoice_id: selectedInvoiceForClaim.id
      });
      toast({ title: 'Success', description: 'Claim generated successfully!' });
      setIsClaimFormOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate claim.', variant: 'destructive' });
    }
  };

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

  const executeDeletePrescription = async (prescriptionId: string | number) => {
      const success = await deletePrescription(prescriptionId);
      if (success) {
        setPrescriptions(prev => prev.filter(p => String(p.id) !== String(prescriptionId)));
        toast({ title: "Deleted", description: "Prescription deleted successfully." });
      } else {
        toast({ title: "Error", description: "Failed to delete prescription.", variant: "destructive" });
      }
  };

  const handleDeletePrescription = (prescriptionId: string | number) => {
    confirm({
      description: "Are you sure you want to delete this prescription?",
      onConfirm: () => executeDeletePrescription(prescriptionId)
    });
  };

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocumentIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleOpenSendDocDialog = (channel: 'email' | 'whatsapp') => {
    setSendDocChannel(channel);
    setSendDocRecipient(channel === 'email' ? (patient?.email || '') : (patient?.phone || ''));
    setSendDocMessage('');
    setIsSendDocDialogOpen(true);
  };

  const handleSendDocuments = async () => {
    if (selectedDocumentIds.length === 0 || !sendDocRecipient) return;
    setIsSendingDocs(true);
    const success = await sendPatientDocuments(id as string, selectedDocumentIds, sendDocChannel, sendDocRecipient, sendDocMessage);
    if (success) {
      toast({ title: "Sent", description: `Documents successfully sent via ${sendDocChannel === 'email' ? 'Email' : 'WhatsApp'}.` });
      setSelectedDocumentIds([]);
      setIsSendDocDialogOpen(false);
    } else {
      toast({ title: "Failed", description: "Failed to send documents.", variant: "destructive" });
    }
    setIsSendingDocs(false);
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
        await fetchPatientInsurances();
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
    try {
        const updated = await updatePatient(patient.id, data);
        if(updated) {
            setPatient(updated);
            toast({ title: "Success", description: "Patient updated successfully." });
        }
    } catch (e: any) {
        const errorMessage = e?.message || "Failed to update patient.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
    setIsPatientFormOpen(false);
  }

  const handleDeletePatient = async () => {
    try {
        await deletePatient(id);
        toast({ title: "Success", description: "Patient deleted successfully." });
        router.push('/patients');
    } catch (e: any) {
        toast({ title: "Error", description: e.message || "Failed to delete patient.", variant: "destructive" });
    }
    setIsDeleteAlertOpen(false);
  }

  const handleSaveTreatment = async (treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition) => {
    if (!patient) return;
    try {
        if (selectedTreatment) {
            const updatedPatient = await updateTreatment(patient.id, { ...selectedTreatment, ...treatmentData });
            if (updatedPatient) {
                setPatient(updatedPatient);
                toast({ title: "Success", description: "Treatment updated successfully." });
            }
        } else {
            const savedTreatment = await addTreatment(patient.id, treatmentData, condition);
            if (savedTreatment) {
                // Update the patient's treatment plans with the saved treatment
                setPatient({
                    ...patient,
                    treatmentPlans: [savedTreatment, ...patient.treatmentPlans]
                });
                toast({ title: "Success", description: "Treatment added successfully." });
            }
        }
    } catch (e: any) {
        toast({ title: "Error", description: e.message || "Failed to save treatment.", variant: "destructive" });
    }

    handleCloseTreatmentForm();
  }

  const handleSaveTreatmentsBatch = async (items: Array<{ data: Omit<Treatment, 'id' | 'date'>; condition?: DentalCondition }>) => {
    if (!patient) return;
    try {
      const savedList = await addTreatmentsBatch(patient.id, items);
      if (savedList && savedList.length > 0) {
        setPatient({
          ...patient,
          treatmentPlans: [...savedList, ...patient.treatmentPlans]
        });
        toast({ title: "Success", description: `${savedList.length} treatments added successfully.` });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save treatments.", variant: "destructive" });
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
      <ConfirmDialog />
      <AvatarUploadModal 
        patientId={patient.id} 
        isOpen={isAvatarUploadModalOpen} 
        onClose={() => setIsAvatarUploadModalOpen(false)} 
        onAvatarUpdated={(newAvatarUrl) => setPatient({ ...patient, avatar: newAvatarUrl })}
      />
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="relative group cursor-pointer" onClick={() => setIsAvatarUploadModalOpen(true)}>
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={patient.avatar} />
              <AvatarFallback>{patient.first_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="documents">Patient documents</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
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
                <div className="flex items-center gap-2">
                  {selectedDocumentIds.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSendDocDialog('email')} disabled={isSendingDocs}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email Docs ({selectedDocumentIds.length})
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSendDocDialog('whatsapp')} disabled={isSendingDocs}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp Docs ({selectedDocumentIds.length})
                      </Button>
                    </>
                  )}
                  {canUpdatePatient && (
                      <Button size="sm" onClick={() => setIsImageFormOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                      </Button>
                  )}
                </div>
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
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox 
                                checked={selectedDocumentIds.includes(image.id as number)}
                                onCheckedChange={() => toggleDocumentSelection(image.id as number)}
                                className="bg-white/80 data-[state=checked]:bg-primary"
                              />
                            </div>
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

          <TabsContent value="treatment">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Treatment Plans</CardTitle>
                  <CardDescription>
                    Manage treatment plans for this patient.
                  </CardDescription>
                </div>
                {canUpdatePatient && (
                  <Button size="sm" onClick={() => handleOpenTreatmentForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Treatment
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Procedure</TableHead>
                        <TableHead>Tooth #</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patient.treatmentPlans && patient.treatmentPlans.length > 0 ? (
                        patient.treatmentPlans.map((treatment) => (
                          <TableRow key={treatment.id}>
                            <TableCell className="font-medium">{treatment.procedure}</TableCell>
                            <TableCell>{treatment.tooth || '-'}</TableCell>
                            <TableCell>
                              {treatment.doctorName || treatment.doctor_name || treatment.doctor?.name ? (
                                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                                  <User className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span>{treatment.doctorName || treatment.doctor_name || treatment.doctor?.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  treatment.status === 'Completed'
                                    ? 'secondary'
                                    : treatment.status === 'Cancelled'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {treatment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(treatment.cost)}
                            </TableCell>
                            <TableCell>{treatment.date ? moment(treatment.date).format("MMM DD, YYYY") : '-'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {canUpdatePatient && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleOpenTreatmentForm(treatment)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        confirm({
                                          description: "Are you sure you want to delete this treatment plan?",
                                          onConfirm: () => handleDeleteTreatment(treatment.id)
                                        });
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No treatment plans found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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

          <TabsContent value="insurance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Insurance Policies</CardTitle>
                  <CardDescription>
                    Manage insurance coverages assigned to this patient.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAttachPolicyModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Assign Policy
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy #</TableHead>
                        <TableHead>Package / Company</TableHead>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Primary?</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientInsurances.map((ins: any) => (
                        <TableRow key={ins.pivot.id}>
                          <TableCell className="font-bold">{ins.policy_number}</TableCell>
                          <TableCell>{ins.package?.name}</TableCell>
                          <TableCell>{ins.pivot.subscriber_id}</TableCell>
                          <TableCell className="capitalize">{ins.pivot.relationship_to_subscriber}</TableCell>
                          <TableCell>
                            {ins.pivot.is_primary ? (
                              <Badge className="bg-primary text-primary-foreground">Primary</Badge>
                            ) : (
                              <Badge variant="outline">Secondary</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ins.pivot.status === 'active' ? 'default' : 'secondary'}>{ins.pivot.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {!ins.pivot.is_primary && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async () => {
                                        await insuranceApi.setPrimaryPolicy(Number(id), ins.pivot.id);
                                        fetchPatientInsurances();
                                    }}
                                >
                                    Make Primary
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    confirm({
                                        description: "Are you sure you want to remove this policy from this patient?",
                                        onConfirm: async () => {
                                            try {
                                                await insuranceApi.removePolicyFromPatient(Number(id), ins.pivot.id);
                                                toast({ title: "Success", description: "Policy removed from patient" });
                                                fetchPatientInsurances();
                                            } catch (error) {
                                                toast({ title: "Error", description: "Failed to remove policy", variant: "destructive" });
                                            }
                                        }
                                    });
                                }}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {patientInsurances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No active insurance policies found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
                                <DropdownMenuItem onClick={() => handleOpenClaimForm(invoice)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  File Claim
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
            onSaveBatch={handleSaveTreatmentsBatch}
            onOpenChange={handleCloseTreatmentForm}
        />
      )}
      
      {isAttachPolicyModalOpen && patient && (
        <AttachPolicyForm 
            patientId={patient.id} 
            onSave={fetchPatientInsurances} 
            onOpenChange={setIsAttachPolicyModalOpen} 
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
      
      <Dialog open={isClaimFormOpen} onOpenChange={setIsClaimFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Insurance Claim for Invoice #{selectedInvoiceForClaim?.id}</DialogTitle>
            <DialogDescription>Create a claim linked directly to this invoice.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Insurance Policy</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={claimFormData.patient_insurance_id}
                onChange={(e) => setClaimFormData({...claimFormData, patient_insurance_id: e.target.value})}
                required
              >
                <option value="">Select a policy...</option>
                {patientInsurances.map((ins: any) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.provider_name} ({ins.policy_number})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim Number</label>
              <Input required value={claimFormData.claim_number} onChange={(e) => setClaimFormData({...claimFormData, claim_number: e.target.value})} placeholder="CLM-XXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Invoice Amount</label>
                <Input required type="number" step="0.01" value={claimFormData.total_amount} onChange={(e) => setClaimFormData({...claimFormData, total_amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Claimed Amount</label>
                <Input required type="number" step="0.01" value={claimFormData.claimed_amount} onChange={(e) => setClaimFormData({...claimFormData, claimed_amount: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full">Submit Claim</Button>
          </form>
        </DialogContent>
      </Dialog>
      
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
      
      <Dialog open={isSendDocDialogOpen} onOpenChange={setIsSendDocDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Documents via {sendDocChannel === 'email' ? 'Email' : 'WhatsApp'}</DialogTitle>
            <DialogDescription>
              Sending {selectedDocumentIds.length} document(s). You can specify a custom recipient and add an optional message.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="recipient" className="text-sm font-medium leading-none">
                {sendDocChannel === 'email' ? 'Email Address' : 'WhatsApp Number (Intl format, no +)'}
              </label>
              <Input
                id="recipient"
                value={sendDocRecipient}
                onChange={(e) => setSendDocRecipient(e.target.value)}
                placeholder={sendDocChannel === 'email' ? 'patient@example.com' : '256701234567'}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium leading-none">
                Custom Message (Optional)
              </label>
              <textarea
                id="message"
                value={sendDocMessage}
                onChange={(e) => setSendDocMessage(e.target.value)}
                placeholder="Type an optional message..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDocDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendDocuments} disabled={!sendDocRecipient || isSendingDocs}>
              {isSendingDocs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
