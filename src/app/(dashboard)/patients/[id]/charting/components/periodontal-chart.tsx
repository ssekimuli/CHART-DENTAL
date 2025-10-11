
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
import { useState, useRef, createRef } from "react";
import Image from "next/image";

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

const DentalChartSvg = ({ selectedTooth, onToothClick }: { selectedTooth?: number, onToothClick: (toothId: number) => void }) => {
    const toothPath = "M -10 -15 C -15 -15, -15 -5, -10 0 L 10 0 C 15 -5, 15 -15, 10 -15 Z";
  
    return (
      <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <style>{`
          .tooth-label { font-family: sans-serif; font-size: 14px; fill: hsl(var(--muted-foreground)); text-anchor: middle; user-select: none; }
          .tooth-outline { stroke: hsl(var(--muted-foreground)); stroke-width: 1.5; fill: hsl(var(--card)); cursor: pointer; }
          .tooth-outline:hover { fill: hsl(var(--accent) / 0.2); }
          .tooth-outline.selected { stroke: hsl(var(--primary)); stroke-width: 2.5; fill: hsl(var(--accent) / 0.3); }
          .quadrant-line { stroke: hsl(var(--border)); stroke-width: 2; stroke-dasharray: 5,5; }
        `}</style>
        
        {/* Upper Arch */}
        <path d="M 150 150 C 250 50, 550 50, 650 150" fill="none" stroke="hsl(var(--border))" strokeWidth="2" id="upper-arch" />
        {quadrants.upperRight.concat(quadrants.upperLeft).map((tooth, i) => {
          const isMolar = [4,5,6,7,8].includes(tooth % 10);
          return (
            <g key={tooth} transform={`translate(${150 + i * (500 / 15)} 130) scale(${isMolar ? 1.2 : 1})`} onClick={() => onToothClick(tooth)}>
              <path className={cn("tooth-outline", selectedTooth === tooth && 'selected')} d={toothPath} />
              <text className="tooth-label" y="-20">{tooth}</text>
            </g>
          )
        })}
        
         {/* Lower Arch */}
         <path d="M 150 250 C 250 350, 550 350, 650 250" fill="none" stroke="hsl(var(--border))" strokeWidth="2" id="lower-arch" />
        {quadrants.lowerLeft.concat(quadrants.lowerRight.slice().reverse()).map((tooth, i) => {
           const isMolar = [4,5,6,7,8].includes(tooth % 10);
          return (
             <g key={tooth} transform={`translate(${150 + i * (500/15)} 250) scale(${isMolar ? 1.2 : 1}) rotate(180)`} onClick={() => onToothClick(tooth)}>
              <path className={cn("tooth-outline", selectedTooth === tooth && 'selected')} d={toothPath} />
              <text className="tooth-label" y="25" transform="rotate(180)">{tooth}</text>
            </g>
          )
        })}
  
        <line className="quadrant-line" x1="400" y1="0" x2="400" y2="400" />
      </svg>
    );
  };

export function PeriodontalChart({
  initialRecords,
  onSave,
}: PeriodontalChartProps) {
  const [records, setRecords] =
    useState<PeriodontalRecord>(initialRecords);
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toothColumnRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    allTeeth.map(() => createRef())
  );

  const getToothColumnRef = (toothId: number) => {
    const toothIndex = allTeeth.findIndex(t => t === toothId);
    if (toothIndex !== -1) {
        return toothColumnRefs.current[toothIndex];
    }
    return null;
  }

  const handleToothClick = (toothId: number) => {
    setSelectedTooth(toothId);
    const ref = getToothColumnRef(toothId);
    if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }


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

  const renderToothColumn = (toothId: number, ref: React.RefObject<HTMLDivElement>) => {
    const record = getRecord(toothId);
    const isUpper = toothId < 30;

    const buccalPocketInputs = (
      <div className="flex flex-col gap-px">
        {pocketPositions.slice(0, 3).map((pos) => (
          <Input
            key={pos}
            type="number"
            min="0"
            max="20"
            className="h-6 w-10 rounded-none border-x-0 border-t-0 bg-background/30 p-1 text-center text-xs"
            placeholder={pos.slice(0,1).toUpperCase()}
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
            className="h-6 w-10 rounded-none border-x-0 border-t-0 bg-background/30 p-1 text-center text-xs"
            placeholder={pos.slice(0,1).toUpperCase()}
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
                ? {
                    "bleeding": "bg-red-500 border-red-700",
                    "suppuration": "bg-yellow-400 border-yellow-600",
                    "plaque": "bg-blue-400 border-blue-600",
                    "calculus": "bg-green-500 border-green-700",
                  }[con]
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

    const chartBody = isUpper ? (
        <>
        {buccalPocketInputs}
        <div className="my-1 h-px w-full bg-border" />
        {conditionToggles}
        {otherInputs}
        <div className="my-1 h-px w-full bg-border" />
        {lingualPocketInputs}
      </>
    ) : (
        <>
        {lingualPocketInputs}
        <div className="my-1 h-px w-full bg-border" />
        {otherInputs}
        {conditionToggles}
        <div className="my-1 h-px w-full bg-border" />
        {buccalPocketInputs}
        </>
    )

    return (
      <div
        key={toothId}
        ref={ref}
        className={cn(
            "flex flex-col items-center bg-card p-1 transition-colors duration-300",
            selectedTooth === toothId && 'bg-blue-500/10'
        )}
      >
        <div className="text-xs font-medium text-muted-foreground">
          {toothId}
        </div>
        {chartBody}
      </div>
    );
  };

  const renderQuadrant = (
    quadrant: number[],
    isReversed: boolean = false
  ) => {
    const teeth = isReversed ? [...quadrant].reverse() : quadrant;
    return (
      <div className="flex">
        {teeth.map((toothId) => {
             const ref = getToothColumnRef(toothId);
             if (!ref) return null;
             return renderToothColumn(toothId, ref);
        })}
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
         <div className="mb-4 rounded-lg border p-4">
             <DentalChartSvg selectedTooth={selectedTooth} onToothClick={handleToothClick}/>
         </div>
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
        <div ref={scrollContainerRef} className="flex flex-col items-center overflow-x-auto rounded-lg border bg-muted/30 p-2">
          <div className="mb-1 text-sm font-bold text-muted-foreground">UPPER</div>
          <div className="flex w-full justify-between">
            <div className="flex items-center"><div className="w-8 -rotate-90 text-center text-xs tracking-widest text-muted-foreground/70">BUCCAL</div></div>
            {renderQuadrant(quadrants.upperRight, true)}
            {renderQuadrant(quadrants.upperLeft)}
            <div className="flex items-center"><div className="w-8 -rotate-90 text-center text-xs tracking-widest text-muted-foreground/70">BUCCAL</div></div>
          </div>
           <div className="my-2 h-px w-full bg-border" />
           <div className="flex w-full justify-between text-xs tracking-widest text-muted-foreground/70">
                <div>LINGUAL</div>
                <div>LINGUAL</div>
           </div>
          <div className="my-2 h-px w-full bg-border" />
          <div className="flex w-full justify-between">
             <div className="flex items-center"><div className="w-8 -rotate-90 text-center text-xs tracking-widest text-muted-foreground/70">BUCCAL</div></div>
            {renderQuadrant(quadrants.lowerRight, true)}
            {renderQuadrant(quadrants.lowerLeft)}
             <div className="flex items-center"><div className="w-8 -rotate-90 text-center text-xs tracking-widest text-muted-foreground/70">BUCCAL</div></div>
          </div>
           <div className="mt-1 text-sm font-bold text-muted-foreground">LOWER</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSave(records)}>Save Chart</Button>
      </CardFooter>
    </Card>
  );
}
