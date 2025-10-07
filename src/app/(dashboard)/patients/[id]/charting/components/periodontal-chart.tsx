
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  PeriodontalRecord,
  PeriodontalMeasurement,
  PeriodontalPocketDepth,
  PeriodontalConditions,
} from "@/lib/types";
import { useState } from "react";

const quadrants = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const pocketPositions: (keyof PeriodontalPocketDepth)[] = [
  "distobuccal",
  "buccal",
  "mesiobuccal",
  "distolingual",
  "lingual",
  "mesiolingual",
];
const conditionKeys: (keyof PeriodontalConditions)[] = [
  "bleeding",
  "suppuration",
  "plaque",
  "calculus",
];

type PeriodontalChartProps = {
  initialRecords: PeriodontalRecord;
  onSave: (records: PeriodontalRecord) => void;
};

export function PeriodontalChart({
  initialRecords,
  onSave,
}: PeriodontalChartProps) {
  const [records, setRecords] =
    useState<PeriodontalRecord>(initialRecords);

  const getRecord = (toothId: number): PeriodontalMeasurement => {
    const record = records.find((r) => r.toothId === toothId);
    if (record) return record;
    return {
      toothId,
      pockets: {},
      conditions: {},
    };
  };

  const handlePocketChange = (
    toothId: number,
    position: keyof PeriodontalPocketDepth,
    value: string
  ) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    setRecords((prev) => {
      const newRecords = [...prev];
      let record = newRecords.find((r) => r.toothId === toothId);
      if (!record) {
        record = { toothId, pockets: {}, conditions: {} };
        newRecords.push(record);
      }
      record.pockets[position] = numericValue;
      return newRecords;
    });
  };
  
  const handleRecessionChange = (toothId: number, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
     setRecords((prev) => {
      const newRecords = [...prev];
      let record = newRecords.find((r) => r.toothId === toothId);
      if (!record) {
        record = { toothId, pockets: {}, conditions: {} };
        newRecords.push(record);
      }
      record.recession = numericValue;
      return newRecords;
    });
  }

  const handleConditionToggle = (
    toothId: number,
    condition: keyof PeriodontalConditions
  ) => {
    setRecords((prev) => {
      const newRecords = [...prev];
      let record = newRecords.find((r) => r.toothId === toothId);
      if (!record) {
        record = { toothId, pockets: {}, conditions: {} };
        newRecords.push(record);
      }
      record.conditions[condition] = !record.conditions[condition];
      return newRecords;
    });
  };

  const handleSelectChange = (
    toothId: number,
    type: "mobility" | "furcation",
    value: string
  ) => {
    setRecords((prev) => {
      const newRecords = [...prev];
      let record = newRecords.find((r) => r.toothId === toothId);
      if (!record) {
        record = { toothId, pockets: {}, conditions: {} };
        newRecords.push(record);
      }
      (record as any)[type] = value;
      return newRecords;
    });
  };

  const renderToothColumn = (toothId: number) => {
    const record = getRecord(toothId);
    const isUpper = toothId < 30;

    const pocketInputs = (
      <div className="flex flex-col gap-px">
        {pocketPositions.slice(0, 3).map((pos) => (
          <Input
            key={pos}
            type="number"
            min="0"
            max="20"
            className="h-6 w-10 rounded-none border-x-0 border-t-0 p-1 text-center text-xs"
            placeholder={pos.charAt(0).toUpperCase()}
            value={record.pockets[pos] ?? ""}
            onChange={(e) => handlePocketChange(toothId, pos, e.target.value)}
          />
        ))}
      </div>
    );
    const lingualPocketInputs = (
       <div className="flex flex-col gap-px">
        {pocketPositions.slice(3, 6).map((pos) => (
          <Input
            key={pos}
            type="number"
            min="0"
            max="20"
            className="h-6 w-10 rounded-none border-x-0 border-t-0 p-1 text-center text-xs"
            placeholder={pos.charAt(0).toUpperCase()}
            value={record.pockets[pos] ?? ""}
            onChange={(e) => handlePocketChange(toothId, pos, e.target.value)}
          />
        ))}
      </div>
    )

    const conditionToggles = (
      <div className="flex justify-center gap-0.5">
        {conditionKeys.map((con) => (
          <button
            key={con}
            onClick={() => handleConditionToggle(toothId, con)}
            className={cn(
              "h-3 w-3 rounded-full border text-xs",
              record.conditions[con]
                ? "bg-red-500 border-red-700"
                : "bg-gray-200 dark:bg-gray-700"
            )}
            title={con.charAt(0).toUpperCase() + con.slice(1)}
          />
        ))}
      </div>
    );

    const otherInputs = (
      <div className="space-y-1">
        <Input
          type="number"
          min="0"
          max="20"
          className="h-6 w-full p-1 text-center text-xs"
          placeholder="Recession"
          value={record.recession ?? ''}
          onChange={e => handleRecessionChange(toothId, e.target.value)}
        />
        <Select
          value={record.mobility}
          onValueChange={(val) => handleSelectChange(toothId, "mobility", val)}
        >
          <SelectTrigger className="h-6 w-full text-xs">
            <SelectValue placeholder="Mobility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={record.furcation}
          onValueChange={(val) => handleSelectChange(toothId, "furcation", val)}
        >
          <SelectTrigger className="h-6 w-full text-xs">
            <SelectValue placeholder="Furcation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">I</SelectItem>
            <SelectItem value="II">II</SelectItem>
            <SelectItem value="III">III</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    return (
      <div
        key={toothId}
        className="flex flex-col items-center bg-card p-1"
      >
        <div className="text-xs font-medium text-muted-foreground">
          {toothId}
        </div>
        {isUpper ? (
          <>
            {pocketInputs}
            <div className="my-1 h-8 w-px bg-border" />
            {conditionToggles}
            {otherInputs}
             <div className="my-1 h-8 w-px bg-border" />
            {lingualPocketInputs}
          </>
        ) : (
          <>
            {lingualPocketInputs}
            <div className="my-1 h-8 w-px bg-border" />
            {otherInputs}
            {conditionToggles}
            <div className="my-1 h-8 w-px bg-border" />
            {pocketInputs}
          </>
        )}
      </div>
    );
  };

  const renderQuadrant = (
    quadrant: number[],
    label: string,
    isReversed: boolean = false
  ) => {
    const teeth = isReversed ? [...quadrant].reverse() : quadrant;
    return (
      <div className="flex">
        {teeth.map((toothId) => renderToothColumn(toothId))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodontal Chart</CardTitle>
        <CardDescription>
          Assess the health of gums and bone around each tooth. All measurements
          are in mm.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center overflow-x-auto rounded-lg border p-4">
          <div className="text-sm font-bold text-muted-foreground">UPPER</div>
          <div className="flex w-full justify-between">
            {renderQuadrant(quadrants.upperRight, "UR", true)}
            {renderQuadrant(quadrants.upperLeft, "UL")}
          </div>
          <div className="my-4 h-px w-full bg-border" />
          <div className="flex w-full justify-between">
            {renderQuadrant(quadrants.lowerRight, "LR", true)}
            {renderQuadrant(quadrants.lowerLeft, "LL")}
          </div>
           <div className="text-sm font-bold text-muted-foreground mt-2">LOWER</div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border bg-red-500 border-red-700"></div>
                <span className="text-xs">Bleeding</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border bg-yellow-400 border-yellow-600"></div>
                <span className="text-xs">Suppuration</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border bg-blue-400 border-blue-600"></div>
                <span className="text-xs">Plaque</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border bg-green-500 border-green-700"></div>
                <span className="text-xs">Calculus</span>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSave(records)}>Save Chart</Button>
      </CardFooter>
    </Card>
  );
}
