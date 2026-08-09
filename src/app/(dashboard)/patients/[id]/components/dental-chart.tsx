
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


const upperRightQuadrant = [18, 17, 16, 15, 14, 13, 12, 11];
const upperLeftQuadrant = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerLeftQuadrant = [31, 32, 33, 34, 35, 36, 37, 38];
const lowerRightQuadrant = [48, 47, 46, 45, 44, 43, 42, 41];

const conditionInfo: { condition: DentalCondition; color: string; twColor: string }[] = [
    { condition: 'Healthy', color: 'transparent', twColor: 'bg-transparent border border-gray-400 border-dashed' },
    { condition: 'Caries', color: '#EA580C', twColor: 'bg-orange-600' },
    { condition: 'Filling', color: '#0284C7', twColor: 'bg-sky-600' },
    { condition: 'Crown', color: '#9333EA', twColor: 'bg-purple-600' },
    { condition: 'Missing', color: '#334155', twColor: 'bg-slate-700' },
    { condition: 'Fracture', color: '#DC2626', twColor: 'bg-red-600' },
    { condition: 'Implant', color: '#9CA3AF', twColor: 'bg-gray-400' },
    { condition: 'Bridge', color: '#F59E0B', twColor: 'bg-amber-500' },
];

type DentalChartProps = {
  initialRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  restorativeRecords?: RestorativeRecord[];
  onAddTreatment: (toothId: number) => void;
  onLogCondition: (toothId: number) => void;
  onQuickLogCondition?: (toothId: number, condition: DentalCondition) => void;
  onAddRestorativeRecord?: (toothId: number, surface?: string) => void;
  onConfirmBridge?: (toothIds: number[], bridgeGroupId: string) => void;
};

import { Odontogram } from "../charting/components/odontogram";
import type { RestorativeRecord } from "@/lib/types";

export function DentalChart({ initialRecords, treatmentPlans, restorativeRecords = [], onAddTreatment, onLogCondition, onQuickLogCondition, onAddRestorativeRecord, onConfirmBridge }: DentalChartProps) {
  const [selectedToothData, setSelectedToothData] = useState<{id: number, surface?: string} | null>(null);
  const [bridgeTeethSelection, setBridgeTeethSelection] = useState<number[]>([]);
  const [showBridgeModal, setShowBridgeModal] = useState(false);

  const selectedTooth = selectedToothData?.id || null;
  const allTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48];

  const toggleBridgeTooth = (toothId: number) => {
    if (bridgeTeethSelection.includes(toothId)) {
      setBridgeTeethSelection(bridgeTeethSelection.filter(id => id !== toothId));
    } else {
      setBridgeTeethSelection([...bridgeTeethSelection, toothId].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
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
      
      <div className="rounded-lg bg-muted/10 p-6 border overflow-x-auto flex justify-center items-center min-h-[450px]">
        <div className="w-full scale-100 origin-center py-4 flex flex-col relative">
          <Odontogram
            records={restorativeRecords}
            dentalRecords={initialRecords}
            treatmentPlans={treatmentPlans}
            onToothClick={(toothId, surface) => setSelectedToothData({ id: toothId, surface })}
          />
        </div>
      </div>

      <Sheet open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedToothData(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedTooth}
                    </span>
                    Tooth #{selectedTooth}
                </SheetTitle>
                <SheetDescription>
                    Quickly log a condition, treatment, or restorative procedure for this tooth.
                    {selectedToothData?.surface && <span className="block mt-1 font-medium text-primary">Selected View: {selectedToothData.surface}</span>}
                </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6">
              <h4 className="text-sm font-medium mb-3">Select Condition</h4>
              <div className="grid grid-cols-2 gap-2">
                  {conditionInfo.map(({ condition, twColor }) => (
                     <Button
                          key={condition}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                              if (condition !== 'Bridge') {
                                if (selectedTooth && onQuickLogCondition) onQuickLogCondition(selectedTooth, condition);
                                setSelectedToothData(null);
                              }
                          }}
                          disabled={condition === 'Bridge'}
                      >
                          <div className={cn('mr-2 h-3 w-3 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
                          {condition}
                      </Button>
                  ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
                onClick={() => {
                  setBridgeTeethSelection([selectedTooth!]);
                  setShowBridgeModal(true);
                }}
              >
                🌉 Mark as Bridge
              </Button>
              <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                      if (selectedTooth) onLogCondition(selectedTooth);
                      setSelectedToothData(null);
                  }}
              >
                  <FilePen className="mr-2 h-4 w-4" /> Add Detailed Note
              </Button>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Restorative Record</h4>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                      if (selectedTooth && onAddRestorativeRecord) onAddRestorativeRecord(selectedTooth, selectedToothData?.surface);
                      setSelectedToothData(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Restorative Procedure
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Treatment Plan</h4>
                <Button
                  className="w-full"
                  onClick={() => {
                      if (selectedTooth) onAddTreatment(selectedTooth);
                      setSelectedToothData(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Treatment
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="outline"
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

      <Dialog open={showBridgeModal} onOpenChange={setShowBridgeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Bridge Teeth</DialogTitle>
            <DialogDescription>
              Tooth #{selectedTooth} + Select other teeth for this bridge
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded">
              <p className="text-sm font-medium mb-2">Selected Teeth</p>
              <p className="text-lg font-semibold text-fuchsia-600">
                {selectedTooth} {bridgeTeethSelection.length > 0 && `+ ${bridgeTeethSelection.join(', ')}`}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Select Other Teeth</p>
              <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto p-3 border rounded bg-slate-50 dark:bg-slate-950">
                {allTeeth.filter(tooth => tooth !== selectedTooth).map(tooth => (
                  <label
                    key={tooth}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-sm font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={bridgeTeethSelection.includes(tooth)}
                      onChange={() => toggleBridgeTooth(tooth)}
                      className="w-4 h-4"
                    />
                    <span>{tooth}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setBridgeTeethSelection([]);
                  setShowBridgeModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                disabled={bridgeTeethSelection.length === 0}
                onClick={() => {
                  const allBridgeTeeth = [selectedTooth, ...bridgeTeethSelection].sort((a, b) => a - b);
                  const bridgeGroupId = `bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  if (onConfirmBridge) {
                    onConfirmBridge(allBridgeTeeth, bridgeGroupId);
                  }
                  setBridgeTeethSelection([]);
                  setShowBridgeModal(false);
                  setSelectedToothData(null);
                }}
              >
                ✓ Save Bridge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
