"use client";

import React, { useState } from "react";
import { Tooth } from "./tooth";
import type { DentalRecord, DentalCondition } from "@/lib/types";
import { ConditionLogger } from "./condition-logger";

const upperRightQuadrant = [18, 17, 16, 15, 14, 13, 12, 11];
const upperLeftQuadrant = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerLeftQuadrant = [31, 32, 33, 34, 35, 36, 37, 38];
const lowerRightQuadrant = [48, 47, 46, 45, 44, 43, 42, 41];

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
