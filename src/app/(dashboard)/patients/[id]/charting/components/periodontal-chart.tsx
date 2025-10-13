
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
import { useState, useRef, createRef } from "react";
import Image from "next/image";
import { hasPermission } from "@/lib/user";

const quadrants = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const allTeeth = [
    ...quadrants.upperRight, 
    ...quadrants.upperLeft, 
    ...quadrants.lowerLeft, 
    ...quadrants.lowerRight.slice().reverse()
];


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
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>();
  const canUpdateChart = hasPermission('charting:update');
  

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

  const ToothColumn = ({ toothId }: { toothId: number }) => {
    const record = getRecord(toothId);
    const isUpper = toothId < 30;

    const buccalPocketInputs = (
      <>
        {pocketPositions.slice(0, 3).map((pos, i) => (
           <foreignObject key={pos} x="0" y={80 + i * 28} width="36" height="24">
            <Input
              type="number"
              min="0"
              max="20"
              className="h-full w-full rounded-none border-x-0 border-t-0 bg-transparent p-1 text-center text-xs"
              value={record.pockets[pos] ?? ""}
              onChange={(e) => handlePocketChange(toothId, pos, e.target.value)}
              onFocus={() => setSelectedTooth(toothId)}
              disabled={!canUpdateChart}
            />
          </foreignObject>
        ))}
      </>
    );

    const lingualPocketInputs = (
      <>
        {pocketPositions.slice(3, 6).map((pos, i) => (
          <foreignObject key={pos} x="0" y={220 + i * 28} width="36" height="24">
            <Input
              type="number"
              min="0"
              max="20"
              className="h-full w-full rounded-none border-x-0 border-t-0 bg-transparent p-1 text-center text-xs"
              value={record.pockets[pos] ?? ""}
              onChange={(e) => handlePocketChange(toothId, pos, e.target.value)}
              onFocus={() => setSelectedTooth(toothId)}
              disabled={!canUpdateChart}
            />
          </foreignObject>
        ))}
      </>
    )

    const conditionToggles = (
       <g transform="translate(18, 172)" className={cn(canUpdateChart && "cursor-pointer")} onClick={() => canUpdateChart && setSelectedTooth(toothId)}>
          {conditionKeys.map((con, i) => (
            <circle
              key={con}
              cx={i * 5 - 7.5}
              cy="0"
              r="2"
              className={cn(
                "stroke-none",
                record.conditions[con]
                  ? {
                      "bleeding": "fill-red-500",
                      "suppuration": "fill-yellow-400",
                      "plaque": "fill-blue-400",
                      "calculus": "fill-green-500",
                    }[con]
                  : "fill-muted"
              )}
              onClick={(e) => { if (canUpdateChart) { e.stopPropagation(); handleConditionToggle(toothId, con); } }}
            >
              <title>{con.charAt(0).toUpperCase() + con.slice(1)}</title>
            </circle>
          ))}
       </g>
    );

    const otherInputs = (
      <>
        <foreignObject x="0" y={188} width="36" height="24">
            <Input
              type="number"
              min="0"
              max="20"
              className="h-full w-full bg-transparent p-1 text-center text-xs"
              placeholder="REC"
              value={record.recession ?? ''}
              onChange={e => handleRecessionChange(toothId, e.target.value)}
              onFocus={() => setSelectedTooth(toothId)}
              disabled={!canUpdateChart}
            />
        </foreignObject>
         <foreignObject x="0" y={312} width="36" height="24">
            <Select
              value={record.mobility}
              onValueChange={(val) => handleSelectChange(toothId, "mobility", val)}
              onOpenChange={(open) => open && setSelectedTooth(toothId)}
              disabled={!canUpdateChart}
            >
              <SelectTrigger className="h-full w-full text-xs px-1">
                <SelectValue placeholder="MOB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
        </foreignObject>
         <foreignObject x="0" y={340} width="36" height="24">
            <Select
              value={record.furcation}
              onValueChange={(val) => handleSelectChange(toothId, "furcation", val)}
              onOpenChange={(open) => open && setSelectedTooth(toothId)}
              disabled={!canUpdateChart}
            >
              <SelectTrigger className="h-full w-full text-xs px-1">
                <SelectValue placeholder="FUR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">I</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
              </SelectContent>
            </Select>
        </foreignObject>
      </>
    );

    return (
       <g transform={`translate(4, 4)`}>
          <rect x="-4" y="-4" width="44" height="400" className={cn("fill-transparent transition-colors", selectedTooth === toothId && "fill-blue-500/10")} />
          <text x="18" y="24" className="text-sm font-medium fill-muted-foreground text-anchor-middle">{toothId}</text>
          
          <rect x="0" y="32" width="36" height="36" className="fill-card" stroke="hsl(var(--border))" />
          <text x="18" y="56" className="font-mono text-xl fill-foreground text-anchor-middle">{toothId % 10}</text>

          {buccalPocketInputs}
          {conditionToggles}
          {otherInputs}
          {lingualPocketInputs}

          <line x1="0" y1="32" x2="36" y2="32" stroke="hsl(var(--border))" />
          <line x1="0" y1="68" x2="36" y2="68" stroke="hsl(var(--border))" />
          <line x1="0" y1="80" x2="36" y2="80" stroke="hsl(var(--border))" />
          <line x1="0" y1="108" x2="36" y2="108" stroke="hsl(var(--border))" />
          <line x1="0" y1="136" x2="36" y2="136" stroke="hsl(var(--border))" />
          <line x1="0" y1="164" x2="36" y2="164" stroke="hsl(var(--border))" />
          <line x1="0" y1="184" x2="36" y2="184" stroke="hsl(var(--border))" />
          <line x1="0" y1="216" x2="36" y2="216" stroke="hsl(var(--border))" />
          <line x1="0" y1="220" x2="36" y2="220" stroke="hsl(var(--border))" />
          <line x1="0" y1="248" x2="36" y2="248" stroke="hsl(var(--border))" />
          <line x1="0" y1="276" x2="36" y2="276" stroke="hsl(var(--border))" />
          <line x1="0" y1="304" x2="36" y2="304" stroke="hsl(var(--border))" />
          <line x1="0" y1="336" x2="36" y2="336" stroke="hsl(var(--border))" />
          <line x1="0" y1="364" x2="36" y2="364" stroke="hsl(var(--border))" />
       </g>
    )
  }

  const chartWidth = 32 * 40 + 80;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodontal Chart</CardTitle>
        <CardDescription>
          Assess the health of gums and bone around each tooth. All measurements
          are in mm.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2 rounded-md border p-2">
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
        <svg viewBox={`0 0 ${chartWidth} 400`} className="min-w-[1280px]">
            <g transform="translate(40, 0)">
                <text x="0" y="96" className="text-xs fill-muted-foreground" transform="rotate(-90 0 96)">Buccal</text>
                <text x="0" y="240" className="text-xs fill-muted-foreground" transform="rotate(-90 0 240)">Lingual</text>
            </g>
             {[...quadrants.upperRight.reverse(), ...quadrants.upperLeft].map((toothId, i) => (
                <g key={toothId} transform={`translate(${40 + i * 40}, 0)`}>
                    <ToothColumn toothId={toothId}/>
                </g>
            ))}
            <line x1={40 + 8 * 40} y1="0" x2={40 + 8 * 40} y2="400" className="stroke-muted-foreground stroke-2" />
             {[...quadrants.lowerRight.reverse(), ...quadrants.lowerLeft].map((toothId, i) => (
                <g key={toothId} transform={`translate(${40 + 16 * 40 + i * 40}, 0)`}>
                    <ToothColumn toothId={toothId}/>
                </g>
            ))}
             <line x1={40 + 24 * 40} y1="0" x2={40 + 24 * 40} y2="400" className="stroke-muted-foreground stroke-2" />
        </svg>
      </CardContent>
      {canUpdateChart && (
        <CardFooter>
            <Button onClick={() => onSave(records)}>Save Chart</Button>
        </CardFooter>
      )}
    </Card>
  );
}
