"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DentalCondition, DentalRecord } from "@/lib/types";

type ConditionLoggerProps = {
  toothId: number;
  currentRecord?: DentalRecord;
  onSave: (
    toothId: number,
    condition: DentalCondition,
    notes: string
  ) => void;
  onOpenChange: (open: boolean) => void;
};

const conditions: DentalCondition[] = [
  "Healthy",
  "Caries",
  "Filling",
  "Crown",
  "Missing",
  "Fracture",
];

export function ConditionLogger({
  toothId,
  currentRecord,
  onSave,
  onOpenChange,
}: ConditionLoggerProps) {
  const [condition, setCondition] = useState<DentalCondition>(
    currentRecord?.condition ?? "Healthy"
  );
  const [notes, setNotes] = useState(currentRecord?.notes ?? "");

  const handleSave = () => {
    onSave(toothId, condition, notes);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Condition for Tooth #{toothId}</DialogTitle>
          <DialogDescription>
            Select a condition and add any relevant notes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition" className="text-right">
              Condition
            </Label>
            <Select
              value={condition}
              onValueChange={(value) => setCondition(value as DentalCondition)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((cond) => (
                  <SelectItem key={cond} value={cond}>
                    {cond}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Add notes about the condition..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Condition</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
