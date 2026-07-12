
"use client";

import React, { useState, useMemo } from "react";
import type { DentalRecord, DentalCondition, Treatment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilePen, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";


const upperRightQuadrant = [18, 17, 16, 15, 14, 13, 12, 11];
const upperLeftQuadrant = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerLeftQuadrant = [31, 32, 33, 34, 35, 36, 37, 38];
const lowerRightQuadrant = [48, 47, 46, 45, 44, 43, 42, 41];

const conditionInfo: { condition: DentalCondition; color: string; twColor: string }[] = [
    { condition: 'Healthy', color: '#FFFFFF', twColor: 'bg-white' },
    { condition: 'Caries', color: '#FBBF24', twColor: 'bg-yellow-400' },
    { condition: 'Filling', color: '#60A5FA', twColor: 'bg-blue-400' },
    { condition: 'Crown', color: '#A78BFA', twColor: 'bg-purple-400' },
    { condition: 'Missing', color: '#6B7280', twColor: 'bg-gray-500' },
    { condition: 'Fracture', color: '#EF4444', twColor: 'bg-red-500' },
];

type DentalChartProps = {
  initialRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  onAddTreatment: (toothId: number) => void;
  onLogCondition: (toothId: number) => void;
};

export function DentalChart({ initialRecords, treatmentPlans, onAddTreatment, onLogCondition }: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Group conditions for react-odontogram
  const teethConditions = useMemo(() => {
    const conditionsMap: Record<string, string[]> = {
      Caries: [],
      Filling: [],
      Crown: [],
      Missing: [],
      Fracture: [],
    };
    
    const treatmentMap: string[] = []; // Teeth with treatments but no specific condition style

    initialRecords.forEach((record) => {
      if (record.condition !== 'Healthy' && conditionsMap[record.condition]) {
        conditionsMap[record.condition].push(`teeth-${record.toothId}`);
      }
    });

    treatmentPlans.forEach((plan) => {
      if (plan.tooth && (plan.status === 'Proposed' || plan.status === 'In Progress')) {
          const toothIdStr = `teeth-${plan.tooth}`;
          // Only add to treatment map if it doesn't already have a strong condition color, 
          // or we can just make a dedicated "Treatment" condition group that has a blue outline.
          // react-odontogram layers conditions by array order.
          treatmentMap.push(toothIdStr);
      }
    });

    const groups = [];
    
    if (conditionsMap.Caries.length > 0) groups.push({ label: 'Caries', teeth: conditionsMap.Caries, fillColor: '#FBBF24', outlineColor: '#B45309' });
    if (conditionsMap.Filling.length > 0) groups.push({ label: 'Filling', teeth: conditionsMap.Filling, fillColor: '#60A5FA', outlineColor: '#1D4ED8' });
    if (conditionsMap.Crown.length > 0) groups.push({ label: 'Crown', teeth: conditionsMap.Crown, fillColor: '#A78BFA', outlineColor: '#6D28D9' });
    if (conditionsMap.Missing.length > 0) groups.push({ label: 'Missing', teeth: conditionsMap.Missing, fillColor: '#6B7280', outlineColor: '#374151' });
    if (conditionsMap.Fracture.length > 0) groups.push({ label: 'Fracture', teeth: conditionsMap.Fracture, fillColor: '#EF4444', outlineColor: '#B91C1C' });

    // Treatments (blue outline)
    if (treatmentMap.length > 0) {
        groups.push({
            label: 'Treatment Plan',
            teeth: treatmentMap,
            fillColor: 'transparent',
            outlineColor: '#3B82F6', // Blue outline for treatments
        });
    }

    return groups;
  }, [initialRecords, treatmentPlans]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-muted/10 p-6 border overflow-x-auto flex justify-center">
        <div className="min-w-[700px]">
          <Odontogram 
            singleSelect 
            layout="square"
            teethConditions={teethConditions}
            onChange={(teeth: any) => {
              if (teeth && teeth.length > 0) {
                const fdi = parseInt(teeth[0].notations.fdi, 10);
                setSelectedTooth(fdi);
              }
            }}
          />
        </div>
      </div>

      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedTooth}
                    </span>
                    Tooth #{selectedTooth}
                </DialogTitle>
                <DialogDescription>
                    Select an action to perform on this tooth.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                        if (selectedTooth) onLogCondition(selectedTooth);
                        setSelectedTooth(null);
                    }}
                >
                    <FilePen className="mr-2 h-4 w-4" /> Log Condition
                </Button>
                <Button 
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                        if (selectedTooth) {
                            window.location.href = `/patients/${initialRecords[0]?.patient_id || window.location.pathname.split('/')[2]}/charting/tooth/${selectedTooth}`;
                        }
                    }}
                >
                    <FilePen className="mr-2 h-4 w-4" /> View History
                </Button>
                <Button 
                    className="flex-1"
                    onClick={() => {
                        if (selectedTooth) onAddTreatment(selectedTooth);
                        setSelectedTooth(null);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Treatment
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
        <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-blue-500 bg-transparent"></div>
            <span className="text-sm text-muted-foreground">Treatment Plan</span>
        </div>
        {conditionInfo.map(({ condition, twColor }) => (
          <div key={condition} className="flex items-center gap-2">
            <div className={cn('h-4 w-4 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
            <span className="text-sm text-muted-foreground">{condition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
