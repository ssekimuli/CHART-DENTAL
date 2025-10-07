
"use client";

import React, { useState } from "react";
import { Tooth } from "./tooth";
import type { DentalRecord, DentalCondition } from "@/lib/types";
import { ConditionLogger } from "./condition-logger";
import { cn } from "@/lib/utils";

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
};

export function DentalChart({ initialRecords }: DentalChartProps) {
  const [records, setRecords] = useState<DentalRecord[]>(initialRecords);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const getRecordForTooth = (toothId: number) => {
    return records.find((r) => r.toothId === toothId);
  };

  const handleToothClick = (toothId: number) => {
    setSelectedTooth(toothId);
  };

  const handleSaveCondition = (
    toothId: number,
    condition: DentalCondition,
    notes: string
  ) => {
    setRecords((prevRecords) => {
      const existingRecordIndex = prevRecords.findIndex(
        (r) => r.toothId === toothId
      );
      if (existingRecordIndex > -1) {
        const updatedRecords = [...prevRecords];
        updatedRecords[existingRecordIndex] = { toothId, condition, notes };
        return updatedRecords;
      }
      return [...prevRecords, { toothId, condition, notes }];
    });
    setSelectedTooth(null);
  };

  const renderQuadrant = (quadrant: number[], reverse: boolean = false) => {
    const teeth = reverse ? [...quadrant].reverse() : quadrant;
    return (
      <div className="flex justify-center gap-1">
        {teeth.map((toothId) => (
          <Tooth
            key={toothId}
            toothId={toothId}
            condition={getRecordForTooth(toothId)?.condition ?? "Healthy"}
            onClick={() => handleToothClick(toothId)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-lg bg-muted/30 p-4">
        <div className="flex justify-between border-b-2 border-dashed border-border pb-4">
          {renderQuadrant(upperRightQuadrant, true)}
          {renderQuadrant(upperLeftQuadrant)}
        </div>
        <div className="flex justify-between">
          {renderQuadrant(lowerRightQuadrant, true)}
          {renderQuadrant(lowerLeftQuadrant)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {conditionInfo.map(({ condition, twColor }) => (
          <div key={condition} className="flex items-center gap-2">
            <div className={cn('h-4 w-4 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
            <span className="text-sm text-muted-foreground">{condition}</span>
          </div>
        ))}
      </div>
      {selectedTooth && (
        <ConditionLogger
          toothId={selectedTooth}
          currentRecord={getRecordForTooth(selectedTooth)}
          onSave={handleSaveCondition}
          onOpenChange={() => setSelectedTooth(null)}
        />
      )}
    </>
  );
}
