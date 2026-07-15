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
import { useState, useEffect } from "react";
import { hasPermission } from "@/lib/user";

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
  const [records, setRecords] = useState<PeriodontalRecord>(initialRecords);
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
  };

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

  const handleInputChangeAndAutoTab = (
    value: string,
    toothId: number,
    pos: keyof PeriodontalPocketDepth,
    arch: "upper" | "lower",
    col: number,
    row: number
  ) => {
    handlePocketChange(toothId, pos, value);
    
    // Auto-advance if single digit >= 3, or length is 2 (e.g. 10, 12, etc.)
    const num = parseInt(value, 10);
    if (!isNaN(num) && (num >= 3 || value.length >= 2)) {
      autoAdvance(arch, col, row);
    }
  };

  const handleRecessionChangeAndAutoTab = (
    value: string,
    toothId: number,
    arch: "upper" | "lower",
    col: number,
    row: number
  ) => {
    handleRecessionChange(toothId, value);
    
    // Auto-advance on any recession entry
    if (value.length >= 1) {
      autoAdvance(arch, col, row);
    }
  };

  const autoAdvance = (arch: "upper" | "lower", col: number, row: number) => {
    let targetCol = col;
    let targetRow = row + 1;
    let targetArch = arch;

    if (targetRow > 6) {
      targetRow = 0;
      targetCol = col + 1;
      if (targetCol > 15) {
        if (arch === "upper") {
          targetArch = "lower";
          targetCol = 0;
        } else {
          return; // End of lower arch
        }
      }
    }

    setTimeout(() => {
      const nextInputId = `input-${targetArch}-${targetCol}-${targetRow}`;
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
    }, 40);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    arch: "upper" | "lower",
    col: number,
    row: number,
    toothId: number
  ) => {
    let targetCol = col;
    let targetRow = row;
    let targetArch = arch;
    let shouldPreventDefault = false;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      shouldPreventDefault = true;
      targetRow = row + 1;
      if (targetRow > 6) {
        targetRow = 0;
        targetCol = col + 1;
        if (targetCol > 15) {
          if (arch === "upper") {
            targetArch = "lower";
            targetCol = 0;
          } else {
            targetCol = 15;
            targetRow = 6;
          }
        }
      }
    } else if (e.key === "ArrowUp") {
      shouldPreventDefault = true;
      targetRow = row - 1;
      if (targetRow < 0) {
        targetRow = 6;
        targetCol = col - 1;
        if (targetCol < 0) {
          if (arch === "lower") {
            targetArch = "upper";
            targetCol = 15;
          } else {
            targetCol = 0;
            targetRow = 0;
          }
        }
      }
    } else if (e.key === "ArrowRight") {
      shouldPreventDefault = true;
      targetCol = col + 1;
      if (targetCol > 15) {
        if (arch === "upper") {
          targetArch = "lower";
          targetCol = 0;
        } else {
          targetCol = 15;
        }
      }
    } else if (e.key === "ArrowLeft") {
      shouldPreventDefault = true;
      targetCol = col - 1;
      if (targetCol < 0) {
        if (arch === "lower") {
          targetArch = "upper";
          targetCol = 15;
        } else {
          targetCol = 0;
        }
      }
    }

    // Toggle conditions shortcuts
    const isShortcut = ["b", "B", "s", "S", "p", "P", "c", "C"].includes(e.key);
    if (isShortcut) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      const conditionMap: Record<string, keyof PeriodontalConditions> = {
        b: "bleeding",
        s: "suppuration",
        p: "plaque",
        c: "calculus",
      };
      const condition = conditionMap[key];
      if (condition && canUpdateChart) {
        handleConditionToggle(toothId, condition);
      }
      return;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
    }

    if (targetCol !== col || targetRow !== row || targetArch !== arch) {
      const nextInputId = `input-${targetArch}-${targetCol}-${targetRow}`;
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
    }
  };

  const PeriodontalGraph = ({ arch, type }: { arch: "upper" | "lower"; type: "buccal" | "lingual" }) => {
    const teeth = arch === "upper"
      ? [...quadrants.upperRight.slice().reverse(), ...quadrants.upperLeft]
      : [...quadrants.lowerRight.slice().reverse(), ...quadrants.lowerLeft];
      
    const marginPoints: { x: number; y: number }[] = [];
    const pocketPoints: { x: number; y: number }[] = [];
    
    const sliceStart = type === "buccal" ? 0 : 3;
    const sliceEnd = type === "buccal" ? 3 : 6;
    const baselineY = type === "buccal" ? 30 : 120;
    
    teeth.forEach((toothId, colIndex) => {
      const record = getRecord(toothId);
      const recession = record.recession ?? 0;
      
      pocketPositions.slice(sliceStart, sliceEnd).forEach((pos, posIndex) => {
        const x = 40 + colIndex * 44 + 8 + posIndex * 10;
        const pocket = record.pockets[pos] ?? 0;
        
        const yMargin = baselineY + recession * 5;
        const yPocket = yMargin + pocket * 5;
        
        marginPoints.push({ x, y: yMargin });
        pocketPoints.push({ x, y: yPocket });
      });
    });
    
    let marginPath = "";
    let pocketPath = "";
    let areaPath = "";
    
    if (marginPoints.length > 0) {
      marginPath = "M " + marginPoints.map(p => `${p.x} ${p.y}`).join(" L ");
      pocketPath = "M " + pocketPoints.map(p => `${p.x} ${p.y}`).join(" L ");
      
      const marginPart = marginPoints.map(p => `${p.x} ${p.y}`).join(" L ");
      const pocketPart = [...pocketPoints].reverse().map(p => `${p.x} ${p.y}`).join(" L ");
      areaPath = `M ${marginPart} L ${pocketPart} Z`;
    }
    
    const depthLevels = [0, 2, 4, 6, 8, 10, 12];
    const dangerY = baselineY + 4 * 5;
    
    return (
      <g>
        {/* Background Grid */}
        <rect x="40" y={baselineY} width="704" height="60" className="fill-slate-50/50 stroke-none" />
        {/* Danger zone (>= 4mm) background highlight */}
        <rect x="40" y={dangerY} width="704" height="40" fill="rgba(239, 68, 68, 0.05)" />
        
        {depthLevels.map(lvl => {
          const y = baselineY + lvl * 5;
          return (
            <g key={lvl} className="opacity-40">
              <line x1="40" y1={y} x2="744" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={lvl >= 4 ? "none" : "2,2"} />
              <text x="35" y={y + 3} className="text-[7px] font-semibold fill-muted-foreground text-anchor-end">{lvl}</text>
            </g>
          );
        })}
        
        {/* Active Pocket Area */}
        {areaPath && (
          <path d={areaPath} fill="rgba(239, 68, 68, 0.12)" stroke="none" />
        )}
        
        {/* Gum Margin (Blue line) */}
        {marginPath && (
          <path d={marginPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        
        {/* Pocket Depth (Red line) */}
        {pocketPath && (
          <path d={pocketPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        
        {/* Graph Title */}
        <text x="45" y={baselineY + 12} className="text-[8px] font-bold fill-muted-foreground opacity-60">
          {type === "buccal" ? "BUCCAL GUM & BONE PROFILE" : "LINGUAL GUM & BONE PROFILE"}
        </text>
      </g>
    );
  };

  const ToothColumn = ({ toothId, arch, col }: { toothId: number; arch: "upper" | "lower"; col: number }) => {
    const record = getRecord(toothId);

    const buccalPocketInputs = (
      <>
        {pocketPositions.slice(0, 3).map((pos, i) => {
          const rowIdx = i;
          const isDeep = record.pockets[pos] !== undefined && record.pockets[pos]! >= 4;
          return (
            <foreignObject key={pos} x="0" y={80 + i * 28} width="36" height="24">
              <Input
                id={`input-${arch}-${col}-${rowIdx}`}
                type="number"
                min="0"
                max="20"
                className={cn(
                  "h-full w-full rounded-none border-x-0 border-t-0 bg-transparent p-1 text-center text-xs transition-all",
                  isDeep 
                    ? "text-red-600 font-bold bg-red-100/60 border-red-300" 
                    : "border-border/60 text-foreground"
                )}
                value={record.pockets[pos] ?? ""}
                onChange={(e) => handleInputChangeAndAutoTab(e.target.value, toothId, pos, arch, col, rowIdx)}
                onKeyDown={(e) => handleKeyDown(e, arch, col, rowIdx, toothId)}
                onFocus={() => setSelectedTooth(toothId)}
                disabled={!canUpdateChart}
              />
            </foreignObject>
          );
        })}
      </>
    );

    const lingualPocketInputs = (
      <>
        {pocketPositions.slice(3, 6).map((pos, i) => {
          const rowIdx = i + 4;
          const isDeep = record.pockets[pos] !== undefined && record.pockets[pos]! >= 4;
          return (
            <foreignObject key={pos} x="0" y={220 + i * 28} width="36" height="24">
              <Input
                id={`input-${arch}-${col}-${rowIdx}`}
                type="number"
                min="0"
                max="20"
                className={cn(
                  "h-full w-full rounded-none border-x-0 border-t-0 bg-transparent p-1 text-center text-xs transition-all",
                  isDeep 
                    ? "text-red-600 font-bold bg-red-100/60 border-red-300" 
                    : "border-border/60 text-foreground"
                )}
                value={record.pockets[pos] ?? ""}
                onChange={(e) => handleInputChangeAndAutoTab(e.target.value, toothId, pos, arch, col, rowIdx)}
                onKeyDown={(e) => handleKeyDown(e, arch, col, rowIdx, toothId)}
                onFocus={() => setSelectedTooth(toothId)}
                disabled={!canUpdateChart}
              />
            </foreignObject>
          );
        })}
      </>
    );

    const conditionToggles = (
      <g transform="translate(18, 172)" className={cn(canUpdateChart && "cursor-pointer")} onClick={() => canUpdateChart && setSelectedTooth(toothId)}>
        {conditionKeys.map((con, i) => (
          <circle
            key={con}
            cx={i * 5 - 7.5}
            cy="0"
            r="2"
            className={cn(
              "stroke-none transition-all",
              record.conditions[con]
                ? {
                    "bleeding": "fill-red-500",
                    "suppuration": "fill-yellow-400",
                    "plaque": "fill-blue-400",
                    "calculus": "fill-green-500",
                  }[con]
                : "fill-muted"
            )}
            onClick={(e) => {
              if (canUpdateChart) {
                e.stopPropagation();
                handleConditionToggle(toothId, con);
              }
            }}
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
            id={`input-${arch}-${col}-3`}
            type="number"
            min="0"
            max="20"
            className={cn(
              "h-full w-full bg-transparent p-1 text-center text-xs border-border/60",
              record.recession !== undefined && record.recession! >= 4 ? "text-amber-600 font-bold bg-amber-50" : ""
            )}
            placeholder="REC"
            value={record.recession ?? ""}
            onChange={(e) => handleRecessionChangeAndAutoTab(e.target.value, toothId, arch, col, 3)}
            onKeyDown={(e) => handleKeyDown(e, arch, col, 3, toothId)}
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
        <text x="18" y="24" className="text-xs font-semibold fill-muted-foreground text-anchor-middle">{toothId}</text>
        
        <rect x="0" y="32" width="36" height="36" className="fill-card" stroke="hsl(var(--border))" />
        <text x="18" y="56" className="font-mono text-base font-bold fill-foreground text-anchor-middle">{toothId % 10}</text>

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
    );
  };

  return (
    <Card className="border border-[#A3D8E1]/30 rounded-3xl shadow-[0_10px_30px_rgba(44,63,77,0.02)]">
      <CardHeader>
        <CardTitle className="text-xl font-extrabold text-[#2C3F4D]">Periodontal Chart</CardTitle>
        <CardDescription>
          Assess the health of gums and bone around each tooth. 
          <span className="block mt-1 text-xs text-amber-600 font-medium">
            💡 Pro-Tip: Use Up/Down/Left/Right Arrow keys or Enter to navigate the grid. 
            Press B (Bleeding), S (Suppuration), P (Plaque), or C (Calculus) to quickly toggle conditions on focused tooth!
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border bg-red-500 border-red-700"></div>
            <span className="text-xs font-semibold text-gray-700">B - Bleeding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border bg-yellow-400 border-yellow-600"></div>
            <span className="text-xs font-semibold text-gray-700">S - Suppuration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border bg-blue-400 border-blue-600"></div>
            <span className="text-xs font-semibold text-gray-700">P - Plaque</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border bg-green-500 border-green-700"></div>
            <span className="text-xs font-semibold text-gray-700">C - Calculus</span>
          </div>
        </div>

        <svg viewBox="0 0 780 1230" className="w-full max-w-[800px] mx-auto min-w-[760px]">
          {/* Upper Arch (Maxillary) 2D Graphs */}
          <PeriodontalGraph arch="upper" type="buccal" />
          <PeriodontalGraph arch="upper" type="lingual" />

          {/* Upper Arch Inputs Grid */}
          <g transform="translate(40, 210)">
            <text x="0" y="96" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 96)">Buccal (Upper)</text>
            <text x="0" y="240" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 240)">Lingual (Upper)</text>
          </g>
          {[...quadrants.upperRight.slice().reverse(), ...quadrants.upperLeft].map((toothId, i) => (
            <g key={toothId} transform={`translate(${40 + i * 44}, 210)`}>
              <ToothColumn toothId={toothId} arch="upper" col={i} />
            </g>
          ))}
          <line x1={40 + 8 * 44} y1="210" x2={40 + 8 * 44} y2="610" className="stroke-muted-foreground/40 stroke-2" />

          {/* Separator line between arches */}
          <line x1="0" y1="815" x2="780" y2="815" className="stroke-border stroke-1 stroke-dasharray-[4,4]" />

          {/* Lower Arch (Mandibular) 2D Graphs */}
          <g transform="translate(0, 640)">
            <PeriodontalGraph arch="lower" type="buccal" />
          </g>
          <g transform="translate(0, 640)">
            <PeriodontalGraph arch="lower" type="lingual" />
          </g>

          {/* Lower Arch Inputs Grid */}
          <g transform="translate(40, 820)">
            <text x="0" y="96" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 96)">Buccal (Lower)</text>
            <text x="0" y="240" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 240)">Lingual (Lower)</text>
          </g>
          {[...quadrants.lowerRight.slice().reverse(), ...quadrants.lowerLeft].map((toothId, i) => (
            <g key={toothId} transform={`translate(${40 + i * 44}, 820)`}>
              <ToothColumn toothId={toothId} arch="lower" col={i} />
            </g>
          ))}
          <line x1={40 + 8 * 44} y1="820" x2={40 + 8 * 44} y2="1220" className="stroke-muted-foreground/40 stroke-2" />
        </svg>
      </CardContent>
      {canUpdateChart && (
        <CardFooter className="flex justify-end gap-3 border-t border-gray-100/50 p-6">
          <Button onClick={() => onSave(records)} className="bg-[#008B89] hover:bg-[#008B89]/90 text-white rounded-xl px-6">
            Save Chart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
