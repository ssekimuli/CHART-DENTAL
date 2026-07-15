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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMedicines, getDoctorsList, storePrescription } from "@/lib/api";
import type { Medicine, Employee } from "@/lib/types";

type PrescriptionFormProps = {
  patientId: string | number;
  patientName: string;
  branchId: string | number;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
};

export function PrescriptionForm({
  patientId,
  patientName,
  branchId,
  onOpenChange,
  onSave,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [notes, setNotes] = useState("");
  const [billToInvoice, setBillToInvoice] = useState(true);
  const [items, setItems] = useState<
    Array<{
      medicine_id: string;
      medicine_unit_id: string;
      dosage: string;
      quantity: number;
      price: number;
    }>
  >([{ medicine_id: "", medicine_unit_id: "", dosage: "", quantity: 1, price: 0 }]);

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
        console.error("Error prefetching prescription form data:", error);
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
        patient_id: Number(patientId),
        doctor_id: doctorId ? Number(doctorId) : undefined,
        prescription_date: new Date().toISOString().split("T")[0],
        notes,
        branch_id: Number(branchId),
        bill_to_invoice: billToInvoice,
        items: items.map((item) => ({
          medicine_id: Number(item.medicine_id),
          medicine_unit_id: Number(item.medicine_unit_id),
          dosage: item.dosage,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      };

      await storePrescription(payload);
      toast({
        title: "Prescribed Successfully",
        description: billToInvoice
          ? "Prescription saved and billed to the current pending invoice."
          : "Prescription saved successfully.",
      });
      if (onSave) onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit prescription.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Prescription</DialogTitle>
          <DialogDescription>
            Prescribe medicines to <strong>{patientName}</strong>. This will deduct stock from the inventory and optionally add a bill to the patient's invoice.
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
                <select
                  id="doctor"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.role})
                    </option>
                  ))}
                </select>
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
                            {u.unit_name} (${Number(u.price).toFixed(2)})
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bill"
                checked={billToInvoice}
                onCheckedChange={(checked) => setBillToInvoice(!!checked)}
              />
              <Label htmlFor="bill" className="text-sm font-medium cursor-pointer">
                Automatically add prescription items to the patient's billing invoice
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Prescription
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
