"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { getMedicines, getDoctorsList, updatePrescription } from "@/lib/api";
import type { Medicine, Employee } from "@/lib/types";

type EditPrescriptionFormProps = {
  prescription: any;
  patientName: string;
  branchId: string | number;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
};

export function EditPrescriptionForm({
  prescription,
  patientName,
  branchId,
  onOpenChange,
  onSave,
}: EditPrescriptionFormProps) {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [doctorId, setDoctorId] = useState(prescription.doctorId ? String(prescription.doctorId) : (prescription.doctor_id ? String(prescription.doctor_id) : ""));
  const [notes, setNotes] = useState(prescription.notes || "");
  
  // Convert existing items to match state
  const initialItems = prescription.items?.length > 0 
    ? prescription.items.map((item: any) => ({
        medicine_id: String(item.medicineId || item.medicine_id || ""),
        medicine_unit_id: String(item.medicineUnitId || item.medicine_unit_id || ""),
        dosage: item.dosage || "",
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      }))
    : [{ medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 }];
    
  const [items, setItems] = useState<
    Array<{
      medicine_id: string;
      medicine_unit_id: string;
      dosage: string;
      quantity: number;
      price: number;
    }>
  >(initialItems);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [medsData, docsData] = await Promise.all([
          getMedicines(branchId),
          getDoctorsList(),
        ]);
        setMedicines(medsData);
        setDoctors(docsData);
      } catch (error) {
        console.error("Error prefetching edit prescription form data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load medicines or doctors.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [branchId, toast]);

  const addRxItemRow = () => {
    setItems((prev) => [
      ...prev,
      { medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 },
    ]);
  };

  const removeRxItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRxItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    if (field === "medicine_id") {
      updatedItems[index].medicine_id = value;
      // Auto-select first unit
      const med = medicines.find((m) => String(m.id) === String(value));
      if (med && med.units.length > 0) {
        updatedItems[index].medicine_unit_id = String(med.units[0].id);
        updatedItems[index].price = Number(med.units[0].price);
      } else {
        updatedItems[index].medicine_unit_id = "";
        updatedItems[index].price = 0;
      }
    } else if (field === "medicine_unit_id") {
      updatedItems[index].medicine_unit_id = value;
      const med = medicines.find((m) => String(m.id) === String(updatedItems[index].medicine_id));
      const unit = med?.units.find((u) => String(u.id) === String(value));
      if (unit) {
        updatedItems[index].price = Number(unit.price);
      }
    } else {
      (updatedItems[index] as any)[field] = value;
    }
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const invalidItem = items.some((item) => !item.medicine_id || !item.medicine_unit_id || !item.dosage || item.quantity <= 0);
    if (invalidItem) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all fields for each medicine item.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        doctor_id: doctorId ? Number(doctorId) : undefined,
        notes,
        items: items.map((item) => ({
          medicine_id: Number(item.medicine_id),
          medicine_unit_id: Number(item.medicine_unit_id),
          dosage: item.dosage,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      };

      await updatePrescription(prescription.id, payload);
      toast({
        title: "Prescription Updated",
        description: "The prescription details have been successfully updated.",
      });
      if (onSave) onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update prescription.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Prescription</DialogTitle>
          <DialogDescription>
            Modify prescription details for <strong>{patientName}</strong>. 
            Note: Billing will not be automatically updated from here.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading pharmacy inventory...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Input id="patient" value={patientName} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Prescribing Doctor</Label>
                <Combobox
                  options={doctors.map((doc) => ({ value: String(doc.id), label: `${doc.name} (${doc.role})` }))}
                  value={doctorId}
                  onChange={setDoctorId}
                  placeholder="Select a doctor"
                  searchPlaceholder="Search doctors..."
                  emptyMessage="No doctor found."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Medicines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRxItemRow}>
                  <Plus className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
              </div>

              {items.map((item, idx) => {
                const selectedMed = medicines.find((m) => String(m.id) === String(item.medicine_id));
                const availableUnits = selectedMed?.units || [];
                const selectedUnitObj = availableUnits.find((u) => String(u.id) === String(item.medicine_unit_id));

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/40 relative">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Medicine</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none"
                        value={item.medicine_id}
                        onChange={(e) => handleRxItemChange(idx, "medicine_id", e.target.value)}
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none"
                        value={item.medicine_unit_id}
                        disabled={!item.medicine_id}
                        onChange={(e) => handleRxItemChange(idx, "medicine_unit_id", e.target.value)}
                      >
                        <option value="">Select Unit</option>
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_name} ({formatCurrency(u.price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        className="text-xs h-10"
                        value={item.quantity}
                        onChange={(e) => handleRxItemChange(idx, "quantity", Number(e.target.value))}
                      />
                      {selectedUnitObj && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Stock: {selectedUnitObj.stock_quantity}
                        </div>
                      )}
                    </div>

                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Dosage Instructions</Label>
                      <Input
                        placeholder="e.g. 1 daily after dinner"
                        className="text-xs h-10"
                        value={item.dosage}
                        onChange={(e) => handleRxItemChange(idx, "dosage", e.target.value)}
                      />
                    </div>

                    <div className="col-span-1 flex justify-center pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-10 w-10"
                        disabled={items.length === 1}
                        onClick={() => removeRxItemRow(idx)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Prescription Notes</Label>
              <textarea
                id="notes"
                placeholder="Additional instructions..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Prescription
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
