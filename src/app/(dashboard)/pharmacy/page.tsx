"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, Pill, FileText, ShoppingBag, Eye, Trash2, Edit, Loader2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { 
  getMedicines, 
  storeMedicine, 
  updateMedicine, 
  deleteMedicine, 
  getPrescriptions, 
  storePrescription, 
  updatePrescriptionStatus,
  getDoctorsList,
  getPatientsList
} from "@/lib/api";
import type { Medicine, MedicineUnit, Prescription, Employee } from "@/lib/types";

export default function PharmacyPage() {
  const { selectedBranch } = useBranch();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("inventory");

  // Inventory State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medMeta, setMedMeta] = useState<any>({ current_page: 1, last_page: 1 });
  const [medPage, setMedPage] = useState(1);
  const [medSearch, setMedSearch] = useState("");
  const [isMedLoading, setIsMedLoading] = useState(true);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [rxMeta, setRxMeta] = useState<any>({ current_page: 1, last_page: 1 });
  const [rxPage, setRxPage] = useState(1);
  const [isRxLoading, setIsRxLoading] = useState(true);

  // Lists for dropdowns
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);

  // Modals
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isViewRxOpen, setIsViewRxOpen] = useState(false);
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Add/Edit Medicine Form State
  const [medForm, setMedForm] = useState({
    name: "",
    description: "",
    category: "",
    units: [{ unit_name: "", price: 0, stock_quantity: 0 }]
  });

  // Add Prescription Form State
  const [rxForm, setRxForm] = useState({
    patient_id: "",
    doctor_id: "",
    prescription_date: new Date().toISOString().split("T")[0],
    notes: "",
    bill_to_invoice: true,
    items: [{ medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 }]
  });

  // Fetch Inventory
  const fetchInventory = async () => {
    setIsMedLoading(true);
    const res = await getMedicines(selectedBranch, medSearch, medPage, 10);
    setMedicines(res || []);
    setMedMeta(res.meta || { current_page: 1, last_page: 1 });
    setIsMedLoading(false);
  };

  // Fetch Prescriptions
  const fetchPrescriptions = async () => {
    setIsRxLoading(true);
    const res = await getPrescriptions(selectedBranch, undefined, rxPage, 10);
    setPrescriptions(res || []);
    setRxMeta(res.meta || { current_page: 1, last_page: 1 });
    setIsRxLoading(false);
  };

  // Fetch Patients & Doctors (once or on modal open)
  const fetchDropdowns = async () => {
    const [pList, dList] = await Promise.all([getPatientsList(), getDoctorsList()]);
    setPatients(pList || []);
    setDoctors(dList || []);
  };

  useEffect(() => {
    setMedPage(1);
    fetchInventory();
  }, [selectedBranch, medSearch]);

  useEffect(() => {
    fetchInventory();
  }, [medPage]);

  useEffect(() => {
    fetchPrescriptions();
  }, [selectedBranch, rxPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Handle Add Unit in Medicine Form
  const addMedUnitRow = () => {
    setMedForm(prev => ({
      ...prev,
      units: [...prev.units, { unit_name: "", price: 0, stock_quantity: 0 }]
    }));
  };

  // Handle Remove Unit in Medicine Form
  const removeMedUnitRow = (index: number) => {
    setMedForm(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  // Save Medicine (Create or Update)
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMed(true);
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, {
          ...medForm,
          branch_id: Number(selectedBranch),
        });
        toast({ title: "Success", description: "Medicine updated successfully." });
      } else {
        await storeMedicine({
          ...medForm,
          branch_id: Number(selectedBranch),
        });
        toast({ title: "Success", description: "Medicine added successfully." });
      }
      setIsMedModalOpen(false);
      setEditingMedicine(null);
      setMedForm({
        name: "",
        description: "",
        category: "",
        units: [{ unit_name: "", price: 0, stock_quantity: 0 }]
      });
      fetchInventory();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save medicine." });
    } finally {
      setIsSubmittingMed(false);
    }
  };

  // Open Edit Medicine
  const openEditMedicine = (med: Medicine) => {
    setEditingMedicine(med);
    setMedForm({
      name: med.name,
      description: med.description || "",
      category: med.category || "",
      units: med.units.map(u => ({ unit_name: u.unit_name, price: Number(u.price), stock_quantity: u.stock_quantity }))
    });
    setIsMedModalOpen(true);
  };

  // Delete Medicine
  const handleDeleteMedicine = async (id: number) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id);
        toast({ title: "Deleted", description: "Medicine deleted successfully." });
        fetchInventory();
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete medicine." });
      }
    }
  };

  // Add Prescription Item Row
  const addRxItemRow = () => {
    setRxForm(prev => ({
      ...prev,
      items: [...prev.items, { medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 }]
    }));
  };

  // Remove Prescription Item Row
  const removeRxItemRow = (index: number) => {
    setRxForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle Prescription Form input changes
  const handleRxItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...rxForm.items];
    if (field === "medicine_id") {
      updatedItems[index].medicine_id = value;
      // Auto select first unit if any
      const med = medicines.find(m => String(m.id) === String(value));
      if (med && med.units.length > 0) {
        updatedItems[index].medicine_unit_id = String(med.units[0].id);
        updatedItems[index].price = Number(med.units[0].price);
      } else {
        updatedItems[index].medicine_unit_id = "";
        updatedItems[index].price = 0;
      }
    } else if (field === "medicine_unit_id") {
      updatedItems[index].medicine_unit_id = value;
      const med = medicines.find(m => String(m.id) === String(updatedItems[index].medicine_id));
      const unit = med?.units.find(u => String(u.id) === String(value));
      if (unit) {
        updatedItems[index].price = Number(unit.price);
      }
    } else {
      (updatedItems[index] as any)[field] = value;
    }
    setRxForm(prev => ({ ...prev, items: updatedItems }));
  };

  // Save Prescription
  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRx(true);
    try {
      const payload = {
        patient_id: rxForm.patient_id ? Number(rxForm.patient_id) : 0,
        doctor_id: rxForm.doctor_id ? Number(rxForm.doctor_id) : undefined,
        prescription_date: rxForm.prescription_date,
        notes: rxForm.notes,
        branch_id: Number(selectedBranch),
        bill_to_invoice: rxForm.bill_to_invoice,
        items: rxForm.items.map(item => ({
          medicine_id: Number(item.medicine_id),
          medicine_unit_id: Number(item.medicine_unit_id),
          dosage: item.dosage,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))
      };

      await storePrescription(payload);
      toast({ title: "Prescribed", description: "Prescription recorded and billed to invoice." });
      setIsRxModalOpen(false);
      setRxForm({
        patient_id: "",
        doctor_id: "",
        prescription_date: new Date().toISOString().split("T")[0],
        notes: "",
        bill_to_invoice: true,
        items: [{ medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 }]
      });
      fetchPrescriptions();
      fetchInventory(); // Stock level changed
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save prescription." });
    } finally {
      setIsSubmittingRx(false);
    }
  };

  // Dispense Prescription status change
  const handleDispenseRx = async (id: number) => {
    try {
      await updatePrescriptionStatus(id, "Dispensed");
      toast({ title: "Dispensed", description: "Prescription marked as Dispensed." });
      fetchPrescriptions();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock < 50) return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">Low Stock ({stock})</Badge>;
    return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">In Stock ({stock})</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pharmacy</h1>
          <p className="text-muted-foreground">Manage medicine inventory, units, and patient prescriptions.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "inventory" ? (
            <Button onClick={() => { setEditingMedicine(null); setIsMedModalOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          ) : (
            <Button onClick={() => setIsRxModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Give Prescription
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 border border-border/20">
          <TabsTrigger value="inventory" className="gap-2">
            <Pill className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2">
            <FileText className="h-4 w-4" />
            Prescriptions
          </TabsTrigger>
        </TabsList>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="mt-4">
          <Card className="border-border/30 shadow-sm">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Medicine Stock</CardTitle>
                <CardDescription>Browse through available medicines, their unit packages, and prices.</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicine..."
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isMedLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : medicines.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No medicines found. Add some to get started.</div>
              ) : (
                <div className="border border-border/20 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Package Units & Prices</TableHead>
                        <TableHead>Total Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.map((med) => {
                        const totalStock = med.units.reduce((sum, u) => sum + u.stock_quantity, 0);
                        return (
                          <TableRow key={med.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-semibold">
                              <div>{med.name}</div>
                              {med.description && <span className="text-xs text-muted-foreground font-normal">{med.description}</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">{med.category || "General"}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5 py-1">
                                {med.units.map((unit) => (
                                  <div key={unit.id} className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-foreground/80">{unit.unit_name}:</span>
                                    <span className="text-muted-foreground">{formatCurrency(unit.price)}</span>
                                    <span>•</span>
                                    <span className="font-normal text-muted-foreground">{unit.stock_quantity} available</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{getStockBadge(totalStock)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditMedicine(med)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteMedicine(med.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!isMedLoading && medicines.length > 0 && (
                <div className="mt-4">
                  <PaginationControl
                    currentPage={medPage}
                    lastPage={medMeta.last_page}
                    onPageChange={setMedPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRESCRIPTIONS TAB */}
        <TabsContent value="prescriptions" className="mt-4">
          <Card className="border-border/30 shadow-sm">
            <CardHeader>
              <CardTitle>Prescription History</CardTitle>
              <CardDescription>Monitor patient prescriptions and billing invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              {isRxLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No prescriptions issued yet.</div>
              ) : (
                <div className="border border-border/20 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Billing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((rx) => (
                        <TableRow key={rx.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell>{new Date(rx.prescription_date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">{rx.patient_name || 'N/A'}</TableCell>
                          <TableCell>{rx.doctor_name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={rx.status === "Billed" ? "outline" : "secondary"} 
                              className={rx.status === "Dispensed" ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" : rx.status === "Billed" ? "" : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20"}
                            >
                              {rx.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {rx.invoice_id ? (
                              <Button variant="link" size="sm" className="h-auto p-0 font-normal" onClick={() => window.location.href = `/billing/${rx.invoice_id}`}>
                                Invoice #{rx.invoice_id}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Billing</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => { setSelectedRx(rx); setIsViewRxOpen(true); }}>
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                              {rx.status === "Pending" && (
                                <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => handleDispenseRx(rx.id)}>
                                  <ShoppingBag className="h-3.5 w-3.5" /> Dispense
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!isRxLoading && prescriptions.length > 0 && (
                <div className="mt-4">
                  <PaginationControl
                    currentPage={rxPage}
                    lastPage={rxMeta.last_page}
                    onPageChange={setRxPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MEDICINE CREATION/EDIT MODAL */}
      <Dialog open={isMedModalOpen} onOpenChange={setIsMedModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
            <DialogDescription>Setup medicine profile and package sizes with distinct prices.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMedicine} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="med-name">Medicine Name</Label>
                <Input
                  id="med-name"
                  placeholder="e.g. Paracetamol"
                  required
                  value={medForm.name}
                  onChange={(e) => setMedForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-category">Category</Label>
                <Input
                  id="med-category"
                  placeholder="e.g. Analgesics"
                  value={medForm.category}
                  onChange={(e) => setMedForm(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-desc">Description</Label>
              <Textarea
                id="med-desc"
                placeholder="Details of medicine..."
                value={medForm.description}
                onChange={(e) => setMedForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="border border-border/20 rounded-md p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Package Units & Pricing</Label>
                <Button type="button" size="sm" variant="outline" onClick={addMedUnitRow}>
                  + Add Unit
                </Button>
              </div>
              {medForm.units.map((unit, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Unit Name</Label>
                    <Input
                      placeholder="e.g. Tablet, Box"
                      required
                      value={unit.unit_name}
                      onChange={(e) => {
                        const updated = [...medForm.units];
                        updated[index].unit_name = e.target.value;
                        setMedForm(prev => ({ ...prev, units: updated }));
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={unit.price}
                      onChange={(e) => {
                        const updated = [...medForm.units];
                        updated[index].price = parseFloat(e.target.value) || 0;
                        setMedForm(prev => ({ ...prev, units: updated }));
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Stock Qty</Label>
                    <Input
                      type="number"
                      required
                      value={unit.stock_quantity}
                      onChange={(e) => {
                        const updated = [...medForm.units];
                        updated[index].stock_quantity = parseInt(e.target.value) || 0;
                        setMedForm(prev => ({ ...prev, units: updated }));
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-9" disabled={medForm.units.length === 1} onClick={() => removeMedUnitRow(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMedModalOpen(false)} disabled={isSubmittingMed}>Cancel</Button>
              <Button type="submit" disabled={isSubmittingMed}>
                {isSubmittingMed && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Medicine
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRESCRIPTION CREATION MODAL */}
      <Dialog open={isRxModalOpen} onOpenChange={setIsRxModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Prescription</DialogTitle>
            <DialogDescription>Write prescription items and bill them to the patient's invoice.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRx} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rx-patient">Patient</Label>
                <Combobox
                  options={patients.map(p => ({ value: String(p.id), label: `${p.first_name} ${p.last_name} (${p.email})` }))}
                  value={rxForm.patient_id}
                  onChange={(val) => setRxForm(prev => ({ ...prev, patient_id: val }))}
                  placeholder="Select Patient..."
                  searchPlaceholder="Search patients..."
                  emptyMessage="No patient found."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rx-doctor">Doctor</Label>
                <Combobox
                  options={doctors.map(d => ({ value: String(d.id), label: `${d.name} (${d.role})` }))}
                  value={rxForm.doctor_id}
                  onChange={(val) => setRxForm(prev => ({ ...prev, doctor_id: val }))}
                  placeholder="Select Doctor..."
                  searchPlaceholder="Search doctors..."
                  emptyMessage="No doctor found."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rx-date">Prescription Date</Label>
                <Input
                  id="rx-date"
                  type="date"
                  required
                  value={rxForm.prescription_date}
                  onChange={(e) => setRxForm(prev => ({ ...prev, prescription_date: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  id="rx-bill"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={rxForm.bill_to_invoice}
                  onChange={(e) => setRxForm(prev => ({ ...prev, bill_to_invoice: e.target.checked }))}
                />
                <Label htmlFor="rx-bill" className="font-normal cursor-pointer">Auto-bill to Patient Invoice</Label>
              </div>
            </div>

            <div className="border border-border/20 rounded-md p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Prescribed Medicines</Label>
                <Button type="button" size="sm" variant="outline" onClick={addRxItemRow}>
                  + Add Item
                </Button>
              </div>
              {rxForm.items.map((item, index) => {
                const selectedMed = medicines.find(m => String(m.id) === String(item.medicine_id));
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Medicine</Label>
                      <select
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background"
                        value={item.medicine_id}
                        onChange={(e) => handleRxItemChange(index, "medicine_id", e.target.value)}
                      >
                        <option value="">Select...</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Unit Size</Label>
                      <select
                        required
                        disabled={!item.medicine_id}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background"
                        value={item.medicine_unit_id}
                        onChange={(e) => handleRxItemChange(index, "medicine_unit_id", e.target.value)}
                      >
                        <option value="">Select...</option>
                        {selectedMed?.units.map(u => (
                          <option key={u.id} value={u.id}>{u.unit_name} ({formatCurrency(u.price)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Dosage Instructions</Label>
                      <Input
                        placeholder="e.g. 1x3 daily"
                        required
                        value={item.dosage}
                        onChange={(e) => handleRxItemChange(index, "dosage", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleRxItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-9" disabled={rxForm.items.length === 1} onClick={() => removeRxItemRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rx-notes">Notes / Doctor Instructions</Label>
              <Textarea
                id="rx-notes"
                placeholder="Special notes on usage..."
                value={rxForm.notes}
                onChange={(e) => setRxForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRxModalOpen(false)} disabled={isSubmittingRx}>Cancel</Button>
              <Button type="submit" disabled={isSubmittingRx}>
                {isSubmittingRx && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Prescription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW PRESCRIPTION DIALOG */}
      <Dialog open={isViewRxOpen} onOpenChange={setIsViewRxOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-border/10 pb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Patient</div>
                  <div className="font-semibold">{selectedRx.patient_name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Doctor</div>
                  <div className="font-semibold">{selectedRx.doctor_name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div>{new Date(selectedRx.prescription_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge 
                    variant="outline" 
                    className={selectedRx.status === "Dispensed" ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"}
                  >
                    {selectedRx.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Prescribed Items</Label>
                <div className="border border-border/20 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRx.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.medicine?.name || "Unknown Medicine"}</TableCell>
                          <TableCell>{item.unit?.unit_name || "Unknown"}</TableCell>
                          <TableCell>{item.dosage}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedRx.notes && (
                <div className="bg-muted/10 p-3 rounded-md border border-border/10">
                  <div className="text-xs text-muted-foreground mb-1">Doctor Notes</div>
                  <p className="text-sm font-normal text-foreground">{selectedRx.notes}</p>
                </div>
              )}

              {selectedRx.invoice_id && (
                <div className="flex items-center justify-between border-t border-border/10 pt-4">
                  <span className="text-sm text-muted-foreground">Linked Billing Invoice:</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/billing?id=${selectedRx.invoice_id}`}>
                    View Invoice #{selectedRx.invoice_id}
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewRxOpen(false)}>Close</Button>
            {selectedRx?.status === "Pending" && (
              <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => { handleDispenseRx(selectedRx.id); setIsViewRxOpen(false); }}>
                Dispense Medicine
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
