
"use client";

import React, { useState, useMemo } from "react";
import type { DentalRecord, DentalCondition, Treatment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilePen, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";


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
  onQuickLogCondition?: (toothId: number, condition: DentalCondition) => void;
};

import { Odontogram } from "../charting/components/odontogram";

export function DentalChart({ initialRecords, treatmentPlans, onAddTreatment, onLogCondition, onQuickLogCondition }: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-muted/10 p-6 border overflow-x-auto flex justify-center items-center min-h-[450px]">
        <div className="w-full scale-100 origin-center py-4 flex flex-col relative">
          <Odontogram 
            dentalRecords={initialRecords}
            treatmentPlans={treatmentPlans}
            onToothClick={(toothId) => setSelectedTooth(toothId)}
          />
        </div>
      </div>

      <Sheet open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedTooth}
                    </span>
                    Tooth #{selectedTooth}
                </SheetTitle>
                <SheetDescription>
                    Quickly log a condition or treatment for this tooth.
                </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6">
                <div>
                    <h4 className="text-sm font-medium mb-3">Quick Log Condition</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {conditionInfo.map(({ condition, twColor }) => (
                           <Button 
                                key={condition}
                                variant="outline" 
                                size="sm" 
                                className="justify-start"
                                onClick={() => {
                                    if (selectedTooth && onQuickLogCondition) onQuickLogCondition(selectedTooth, condition);
                                    setSelectedTooth(null);
                                }}
                            >
                                <div className={cn('mr-2 h-3 w-3 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
                                {condition}
                            </Button>
                        ))}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                            if (selectedTooth) onLogCondition(selectedTooth);
                            setSelectedTooth(null);
                        }}
                    >
                        <FilePen className="mr-2 h-4 w-4" /> Add Detailed Note
                    </Button>
                </div>
                
                <div className="border-t pt-4">
                     <h4 className="text-sm font-medium mb-3">Treatment Plan</h4>
                     <Button 
                        className="w-full"
                        onClick={() => {
                            if (selectedTooth) onAddTreatment(selectedTooth);
                            setSelectedTooth(null);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Treatment
                    </Button>
                </div>
                
                <div className="border-t pt-4">
                    <Button 
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            window.location.href = `/patients/${window.location.pathname.split('/')[2]}/charting/tooth/${selectedTooth}`;
                        }}
                    >
                        <FilePen className="mr-2 h-4 w-4" /> View Full History
                    </Button>
                </div>
            </div>
        </SheetContent>
      </Sheet>

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
