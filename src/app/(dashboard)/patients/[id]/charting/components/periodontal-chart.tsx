"use client";

import { Printer } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Send, Mail, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendPeriodontalResult } from "@/lib/api";
import type {
  PeriodontalRecord,
  PeriodontalMeasurement,
  PeriodontalPocketDepth,
  PeriodontalConditions,
  DentalRecord,
  Patient,
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
  dentalRecords?: DentalRecord[];
  patient?: Patient;
  onSave: (records: PeriodontalRecord) => void;
};

export function PeriodontalChart({
  initialRecords,
  dentalRecords = [],
  patient,
  onSave,
}: PeriodontalChartProps) {
  const [records, setRecords] = useState<PeriodontalRecord>(initialRecords);
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>();
  const [threeAtATime, setThreeAtATime] = useState(true);
  
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<'email' | 'whatsapp'>('email');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const toothSequence = [...quadrants.upperRight.slice().reverse(), ...quadrants.upperLeft, ...quadrants.lowerLeft, ...quadrants.lowerRight.slice().reverse()];
  const canUpdateChart = hasPermission('periodontal:update') || hasPermission('charting:update');

  // Helper to compute PSR for a sextant
  const computePSR = (teeth: number[]) => {
    let maxPocket = 0;
    let hasBleeding = false;
    let hasCalculus = false;
    let hasComplexity = false; // furcation, mobility, mucogingival involvement (recession >=3)

    teeth.forEach(t => {
      const rec = records.find(r => r.toothId === t);
      if (rec) {
        // Max pocket
        const pockets = Object.values(rec.pockets).filter((p): p is number => p !== undefined);
        if (pockets.length > 0) {
          maxPocket = Math.max(maxPocket, ...pockets);
        }
        
        if (rec.conditions?.bleeding) hasBleeding = true;
        if (rec.conditions?.calculus) hasCalculus = true;
        
        if (rec.furcation) hasComplexity = true;
        if (rec.mobility && rec.mobility !== '0') hasComplexity = true;
        if (rec.recession && rec.recession >= 3) hasComplexity = true;
      }
    });

    let score = "0";
    if (maxPocket >= 6) {
      score = "4";
    } else if (maxPocket >= 4) {
      score = "3";
    } else if (hasCalculus) {
      score = "2";
    } else if (hasBleeding) {
      score = "1";
    }

    return score + (hasComplexity ? "*" : "");
  };

  const sextants = [
    { name: "Sextant 1", teeth: [1, 2, 3, 4, 5] },
    { name: "Sextant 2", teeth: [6, 7, 8, 9, 10, 11] },
    { name: "Sextant 3", teeth: [12, 13, 14, 15, 16] },
    { name: "Sextant 6", teeth: [32, 31, 30, 29, 28] }, // Lower Right
    { name: "Sextant 5", teeth: [27, 26, 25, 24, 23, 22] }, // Lower Anterior
    { name: "Sextant 4", teeth: [21, 20, 19, 18, 17] } // Lower Left
  ];

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const handleOpenSendDialog = (channel: 'email' | 'whatsapp') => {
    setSendChannel(channel);
    setSendRecipient(channel === 'email' ? (patient?.email || '') : (patient?.phone || ''));
    setSendMessage('');
    setIsSendDialogOpen(true);
  };

  const handleSendResult = async () => {
    if (!sendRecipient || !patient?.id) return;
    setIsSending(true);
    
    const bleedingIndex = records.length > 0 ? Math.round((records.filter(r => r.conditions?.bleeding).length / 32) * 100) : 0;
    const plaqueIndex = records.length > 0 ? Math.round((records.filter(r => r.conditions?.plaque).length / 32) * 100) : 0;
    const psrScores = [
      computePSR(sextants[0].teeth),
      computePSR(sextants[1].teeth),
      computePSR(sextants[2].teeth),
      computePSR(sextants[3].teeth),
      computePSR(sextants[4].teeth),
      computePSR(sextants[5].teeth),
    ];

    const success = await sendPeriodontalResult(patient.id, sendChannel, sendRecipient, sendMessage, {
      bleeding_index: bleedingIndex,
      plaque_index: plaqueIndex,
      psr_scores: psrScores
    });

    if (success) {
      toast({ title: "Sent", description: `Periodontal result successfully sent via ${sendChannel === 'email' ? 'Email' : 'WhatsApp'}.` });
      setIsSendDialogOpen(false);
    } else {
      toast({ title: "Failed", description: "Failed to send periodontal result.", variant: "destructive" });
    }
    setIsSending(true);
  };

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
    position: string,
    value: string
  ) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      if (recordIndex > -1) {
        const record = prev[recordIndex];
        const updatedRecord = {
          ...record,
          pockets: {
            ...record.pockets,
            [position]: numericValue,
          },
        };
        const newRecords = [...prev];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      } else {
        const newRecord = {
          toothId,
          pockets: { [position]: numericValue },
          conditions: {},
        };
        return [...prev, newRecord];
      }
    });
  };

  const handleRecessionChange = (toothId: number, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      if (recordIndex > -1) {
        const record = prev[recordIndex];
        const updatedRecord = {
          ...record,
          recession: numericValue,
        };
        const newRecords = [...prev];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      } else {
        const newRecord = {
          toothId,
          pockets: {},
          recession: numericValue,
          conditions: {},
        };
        return [...prev, newRecord];
      }
    });
  };

  const handleMgjChange = (toothId: number, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      if (recordIndex > -1) {
        const record = prev[recordIndex];
        const updatedRecord = {
          ...record,
          mgj: numericValue,
        };
        const newRecords = [...prev];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      } else {
        const newRecord = {
          toothId,
          pockets: {},
          mgj: numericValue,
          conditions: {},
        };
        return [...prev, newRecord];
      }
    });
  };

  const handleConditionToggle = (
    toothId: number,
    condition: keyof PeriodontalConditions
  ) => {
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      if (recordIndex > -1) {
        const record = prev[recordIndex];
        const updatedRecord = {
          ...record,
          conditions: {
            ...(record.conditions || {}),
            [condition]: !(record.conditions && record.conditions[condition]),
          },
        };
        const newRecords = [...prev];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      } else {
        const newRecord = {
          toothId,
          pockets: {},
          conditions: {
            [condition]: true,
          },
        };
        return [...prev, newRecord];
      }
    });
  };

  const handleSelectChange = (
    toothId: number,
    type: "mobility" | "furcation",
    value: string
  ) => {
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      if (recordIndex > -1) {
        const record = prev[recordIndex];
        const updatedRecord = {
          ...record,
          [type]: value as any,
        };
        const newRecords = [...prev];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      } else {
        const newRecord = {
          toothId,
          pockets: {},
          conditions: {},
          [type]: value as any,
        };
        return [...prev, newRecord];
      }
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

  const handleMgjChangeAndAutoTab = (
    value: string,
    toothId: number,
    arch: "upper" | "lower",
    col: number,
    row: number
  ) => {
    handleMgjChange(toothId, value);
    
    // Auto-advance on any mgj entry
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

        {/* Active Conditions Indicators */}
        {teeth.map((toothId, colIndex) => {
          const record = getRecord(toothId);
          const xCenter = 40 + colIndex * 44 + 18;
          return (
            <g key={toothId}>
              {conditionKeys.map((con, idx) => {
                if (!record.conditions[con]) return null;
                const color = {
                  bleeding: "fill-red-500",
                  suppuration: "fill-yellow-400",
                  plaque: "fill-blue-400",
                  calculus: "fill-green-500",
                }[con];
                return (
                  <circle
                    key={con}
                    cx={xCenter + (idx * 5 - 7.5)}
                    cy={baselineY - 10}
                    r="2.5"
                    className={cn(color, "stroke-none transition-all")}
                  >
                    <title>{con.charAt(0).toUpperCase() + con.slice(1)}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const ToothColumn = ({ toothId, arch, col }: { toothId: number; arch: "upper" | "lower", col: number }) => {
    const record = getRecord(toothId);
    const isMissing = dentalRecords.find(r => r.toothId === toothId && r.condition === "Missing");
    
    return (
      <g 
        className={cn("transition-opacity", isMissing && "opacity-40")}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (!isMissing && canUpdateChart) {
            setSelectedTooth(toothId);
          }
        }}
      >
        <rect x="-4" y="-4" width="44" height="420" className={cn("fill-transparent transition-colors", selectedTooth === toothId && "fill-blue-500/10")} />
        
        {/* Mobility */}
        {record.mobility && (
          <text x="18" y="10" className="text-[10px] font-extrabold fill-slate-700 text-anchor-middle">{record.mobility}</text>
        )}
        
        <text x="18" y="24" className="text-xs font-semibold fill-muted-foreground text-anchor-middle">{toothId}</text>
        
        {/* Realistic Transparent PNG Tooth Image representation */}
        <foreignObject x="0" y="32" width="36" height="36">
          <div 
            className={cn(
              "w-full h-full p-0.5 flex items-center justify-center rounded border relative transition-colors duration-200",
              isMissing ? "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700" :
              "bg-card border-border"
            )}
          >
            {!isMissing && (
              <img 
                src={`/periodontal/${toothId}.png`} 
                alt={`Tooth ${toothId}`}
                className="w-full h-full object-contain"
                style={{
                  filter: record.conditions?.bleeding ? "drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))" : "none"
                }}
              />
            )}
            <div className="absolute bottom-0 right-1 text-[8px] font-bold opacity-75 pointer-events-none fill-foreground">
              {toothId}
            </div>
            {isMissing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-red-500/50 rotate-45 absolute" />
                <div className="w-full h-0.5 bg-red-500/50 -rotate-45 absolute" />
              </div>
            )}
          </div>
        </foreignObject>

        <line x1="0" y1="32" x2="36" y2="32" stroke="hsl(var(--border))" />
        <line x1="0" y1="68" x2="36" y2="68" stroke="hsl(var(--border))" />
        
        {/* Conditions (B, S, P, C) displayed below the tooth image */}
        <g className="text-[9px] font-bold pointer-events-none" textAnchor="middle">
          {record.conditions?.bleeding && <text x="6" y="78" className="fill-red-600">B</text>}
          {record.conditions?.suppuration && <text x="14" y="78" className="fill-yellow-500">S</text>}
          {record.conditions?.plaque && <text x="22" y="78" className="fill-blue-500">P</text>}
          {record.conditions?.calculus && <text x="30" y="78" className="fill-green-600">C</text>}
        </g>
        
        <line x1="0" y1="80" x2="36" y2="80" stroke="hsl(var(--border))" />
        
        {/* Buccal Data */}
        <g className="text-[10px] font-bold fill-slate-700 pointer-events-none" textAnchor="middle">
          {/* Buccal PD */}
          {record.pockets.mesiobuccal !== undefined && <text x="6" y="98">{record.pockets.mesiobuccal}</text>}
          {record.pockets.buccal !== undefined && <text x="18" y="98">{record.pockets.buccal}</text>}
          {record.pockets.distobuccal !== undefined && <text x="30" y="98">{record.pockets.distobuccal}</text>}
          
          {/* Buccal GM */}
          {record.recession !== undefined && <text x="6" y="126">{record.recession}</text>}
          {record.recession !== undefined && <text x="18" y="126">{record.recession}</text>}
          {record.recession !== undefined && <text x="30" y="126">{record.recession}</text>}
          
          {/* Buccal CAL */}
          {record.pockets.mesiobuccal !== undefined && <text x="6" y="154" className="fill-slate-400">{(record.pockets.mesiobuccal || 0) + (record.recession || 0)}</text>}
          {record.pockets.buccal !== undefined && <text x="18" y="154" className="fill-slate-400">{(record.pockets.buccal || 0) + (record.recession || 0)}</text>}
          {record.pockets.distobuccal !== undefined && <text x="30" y="154" className="fill-slate-400">{(record.pockets.distobuccal || 0) + (record.recession || 0)}</text>}
        </g>

        <line x1="0" y1="108" x2="36" y2="108" stroke="hsl(var(--border))" />
        <line x1="0" y1="136" x2="36" y2="136" stroke="hsl(var(--border))" />
        <line x1="0" y1="164" x2="36" y2="164" stroke="hsl(var(--border))" />
        <line x1="0" y1="184" x2="36" y2="184" stroke="hsl(var(--border))" />
        <line x1="0" y1="216" x2="36" y2="216" stroke="hsl(var(--border))" />
        
        {/* Lingual Data */}
        <g className="text-[10px] font-bold fill-slate-700 pointer-events-none" textAnchor="middle">
          {/* Lingual PD */}
          {record.pockets.mesiolingual !== undefined && <text x="6" y="236">{record.pockets.mesiolingual}</text>}
          {record.pockets.lingual !== undefined && <text x="18" y="236">{record.pockets.lingual}</text>}
          {record.pockets.distolingual !== undefined && <text x="30" y="236">{record.pockets.distolingual}</text>}
          
          {/* Lingual GM */}
          {record.recession !== undefined && <text x="6" y="266">{record.recession}</text>}
          {record.recession !== undefined && <text x="18" y="266">{record.recession}</text>}
          {record.recession !== undefined && <text x="30" y="266">{record.recession}</text>}
          
          {/* Lingual CAL */}
          {record.pockets.mesiolingual !== undefined && <text x="6" y="294" className="fill-slate-400">{(record.pockets.mesiolingual || 0) + (record.recession || 0)}</text>}
          {record.pockets.lingual !== undefined && <text x="18" y="294" className="fill-slate-400">{(record.pockets.lingual || 0) + (record.recession || 0)}</text>}
          {record.pockets.distolingual !== undefined && <text x="30" y="294" className="fill-slate-400">{(record.pockets.distolingual || 0) + (record.recession || 0)}</text>}
        </g>

        <line x1="0" y1="248" x2="36" y2="248" stroke="hsl(var(--border))" />
        <line x1="0" y1="276" x2="36" y2="276" stroke="hsl(var(--border))" />
        <line x1="0" y1="304" x2="36" y2="304" stroke="hsl(var(--border))" />
        <line x1="0" y1="336" x2="36" y2="336" stroke="hsl(var(--border))" />
        <line x1="0" y1="364" x2="36" y2="364" stroke="hsl(var(--border))" />
        <line x1="0" y1="392" x2="36" y2="392" stroke="hsl(var(--border))" />
      </g>
    );
  };
  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #periodontal-print-section, #periodontal-print-section * {
            visibility: visible;
          }
          #periodontal-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <Card id="periodontal-print-section" className="border border-[#A3D8E1]/30 rounded-3xl shadow-[0_10px_30px_rgba(44,63,77,0.02)] print:border-none print:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 print:border-b-0">
          <div>
            <CardTitle className="text-xl font-extrabold text-[#2C3F4D]">
              Periodontal Chart
            </CardTitle>
            
            {patient && (
              <div className="hidden print:block mt-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Patient Name:</p>
                    <p className="font-bold text-lg">{patient.first_name} {patient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Date of Birth:</p>
                    <p className="font-bold">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Email:</p>
                    <p className="font-bold">{patient.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Phone:</p>
                    <p className="font-bold">{patient.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Examination Date:</p>
                    <p className="font-bold text-teal-700">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <CardDescription className="print:hidden">
              Assess the health of gums and bone around each tooth. 
              <span className="block mt-1 text-xs text-amber-600 font-medium">
                💡 Pro-Tip: Use Up/Down/Left/Right Arrow keys or Enter to navigate the grid. 
                Press B (Bleeding), S (Suppuration), P (Plaque), or C (Calculus) to quickly toggle conditions on focused tooth!
              </span>
            </CardDescription>
          </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleOpenSendDialog('email')} className="rounded-xl px-4 text-slate-600">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" onClick={() => handleOpenSendDialog('whatsapp')} className="rounded-xl px-4 text-slate-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl px-4 text-slate-600">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {canUpdateChart && (
            <Button onClick={() => onSave(records)} className="bg-[#008B89] hover:bg-[#008B89]/90 text-white rounded-xl px-6">
              Save Chart
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
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
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-3 ml-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Mobility:</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-slate-700">1</span>
              <span className="text-[10px] font-medium text-slate-500">Slight (&le;1mm)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-slate-700">2</span>
              <span className="text-[10px] font-medium text-slate-500">Moderate (1-2mm)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-slate-700">3</span>
              <span className="text-[10px] font-medium text-slate-500">Severe (&gt;2mm / vertical)</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col items-center p-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-2">PSR Scores</p>
              <div className="grid grid-cols-3 gap-[1px] bg-slate-200">
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[0].teeth)}</div>
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[1].teeth)}</div>
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[2].teeth)}</div>
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[5].teeth)}</div>
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[4].teeth)}</div>
                <div className="bg-white px-3 py-1 text-center font-bold text-sm min-w-[36px]">{computePSR(sextants[3].teeth)}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-white px-4 py-2 shadow-sm text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Bleeding Index</p>
              <p className="text-lg font-black text-red-500">
                {records.length > 0 ? Math.round((records.filter(r => r.conditions?.bleeding).length / 32) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl border bg-white px-4 py-2 shadow-sm text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Plaque Index</p>
              <p className="text-lg font-black text-blue-500">
                {records.length > 0 ? Math.round((records.filter(r => r.conditions?.plaque).length / 32) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 items-start w-full">
          {/* Top Section: Profile Graphs (Buccal/Lingual graphs) */}
          <div className="w-full space-y-6">
            <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upper Arch Gum & Bone Profile</h4>
                <svg viewBox="0 0 780 200" className="w-full min-w-[340px]">
                  <PeriodontalGraph arch="upper" type="buccal" />
                  <PeriodontalGraph arch="upper" type="lingual" />
                </svg>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lower Arch Gum & Bone Profile</h4>
                <svg viewBox="0 0 780 200" className="w-full min-w-[340px]">
                  <PeriodontalGraph arch="lower" type="buccal" />
                  <PeriodontalGraph arch="lower" type="lingual" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Section: Form to Enter Record (Upper & Lower Inputs) */}
          <div className="w-full space-y-8 overflow-x-auto min-w-[550px]">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Upper Arch (Maxillary) Records</h3>
              <svg viewBox="0 0 780 420" className="w-full min-w-[740px]">
                {/* Upper Arch Inputs Grid */}
                <g transform="translate(40, 0)">
                  <text x="0" y="96" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 96)">Buccal (Upper)</text>
                  <text x="0" y="240" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 240)">Lingual (Upper)</text>
                </g>
                {[...quadrants.upperRight.slice().reverse(), ...quadrants.upperLeft].map((toothId, i) => (
                  <g key={toothId} transform={`translate(${40 + i * 44}, 0)`}>
                    <ToothColumn toothId={toothId} arch="upper" col={i} />
                  </g>
                ))}
                <line x1={40 + 8 * 44} y1="0" x2={40 + 8 * 44} y2="420" className="stroke-muted-foreground/40 stroke-2" />
              </svg>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Lower Arch (Mandibular) Records</h3>
              <svg viewBox="0 0 780 420" className="w-full min-w-[740px]">
                {/* Lower Arch Inputs Grid */}
                <g transform="translate(40, 0)">
                  <text x="0" y="96" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 96)">Buccal (Lower)</text>
                  <text x="0" y="240" className="text-[10px] font-bold fill-muted-foreground" transform="rotate(-90 0 240)">Lingual (Lower)</text>
                </g>
                {[...quadrants.lowerRight.slice().reverse(), ...quadrants.lowerLeft].map((toothId, i) => (
                  <g key={toothId} transform={`translate(${40 + i * 44}, 0)`}>
                    <ToothColumn toothId={toothId} arch="lower" col={i} />
                  </g>
                ))}
                <line x1={40 + 8 * 44} y1="0" x2={40 + 8 * 44} y2="420" className="stroke-muted-foreground/40 stroke-2" />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    
      <Dialog open={selectedTooth !== undefined} onOpenChange={(open) => {
        if (!open) {
          setSelectedTooth(undefined);
          if (canUpdateChart) {
            onSave(records);
          }
        }
      }}>
        <DialogContent className="max-w-2xl bg-[#f5f8fa] p-0 overflow-hidden border-[#e0e6eb] gap-0">
          <DialogHeader className="bg-[#008B89] text-white p-3 flex flex-row justify-between items-center m-0 border-b border-[#007472]">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-teal-600 rounded" onClick={() => {
              if (!selectedTooth) return;
              const idx = toothSequence.indexOf(selectedTooth);
              if (idx > 0) setSelectedTooth(toothSequence[idx - 1]);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <DialogTitle className="font-bold text-lg text-center m-0 flex items-center gap-4">
              <span>Tooth {selectedTooth}</span>
              <div className="flex items-center gap-2 text-sm font-normal bg-white/10 px-3 py-1 rounded-full">
                <input type="checkbox" checked={threeAtATime} onChange={(e) => setThreeAtATime(e.target.checked)} className="w-3 h-3 rounded border-white text-teal-600 focus:ring-teal-500" />
                <span>Auto-Advance</span>
              </div>
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-teal-600 rounded" onClick={() => {
              if (!selectedTooth) return;
              const idx = toothSequence.indexOf(selectedTooth);
              if (idx < toothSequence.length - 1) setSelectedTooth(toothSequence[idx + 1]);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          </DialogHeader>
          
          {selectedTooth && (
            <div className="flex flex-col p-4 bg-white">
              
              <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-3 mb-6 flex items-start gap-3">
                <div className="text-teal-600 font-bold mt-0.5 animate-bounce">💡</div>
                <div className="text-xs text-teal-800 leading-relaxed">
                  <strong className="font-extrabold text-teal-900 uppercase tracking-wider text-[10px] mr-1">Fast Charting:</strong> 
                  Simply type your measurements! The cursor automatically jumps from <strong className="font-semibold">Buccal</strong> to <strong className="font-semibold">Lingual</strong>. 
                  When <strong className="font-semibold">Auto-Advance</strong> is checked, finishing the Lingual side instantly jumps to the next tooth! No mouse required.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* BUCCAL SIDE */}
                <div>
                  <h4 className="text-center font-bold text-slate-700 mb-3 border-b pb-1">Buccal / Facial</h4>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-center">
                    <div></div>
                    <div className="text-xs font-bold text-slate-400">M</div>
                    <div className="text-xs font-bold text-slate-400">F</div>
                    <div className="text-xs font-bold text-slate-400">D</div>
                    
                    <span className="text-xs font-bold text-slate-500 text-right pr-2">PD</span>
                    {[
                      { pos: "mesiobuccal", val: getRecord(selectedTooth).pockets.mesiobuccal },
                      { pos: "buccal", val: getRecord(selectedTooth).pockets.buccal },
                      { pos: "distobuccal", val: getRecord(selectedTooth).pockets.distobuccal }
                    ].map((item, idx) => (
                      <Input key={`b-pd-${idx}`} id={`modal-b-pd-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={item.val ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handlePocketChange(selectedTooth, item.pos, val);
                          if (val.length >= 1) {
                            if (idx < 2) document.getElementById(`modal-b-pd-${idx + 1}`)?.focus();
                            else document.getElementById(`modal-l-pd-0`)?.focus();
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">GM</span>
                    {[1, 2, 3].map((_, idx) => (
                      <Input key={`b-gm-${idx}`} id={`modal-b-gm-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={getRecord(selectedTooth).recession ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handleRecessionChange(selectedTooth, val);
                          if (val.length >= 1) {
                            if (idx < 2) document.getElementById(`modal-b-gm-${idx + 1}`)?.focus();
                            else document.getElementById(`modal-l-gm-0`)?.focus();
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">CAL</span>
                    {[
                      (getRecord(selectedTooth).pockets.mesiobuccal || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.buccal || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.distobuccal || 0) + (getRecord(selectedTooth).recession || 0)
                    ].map((cal, idx) => (
                      <div key={`b-cal-${idx}`} className="h-9 bg-slate-50 flex items-center justify-center font-bold text-slate-400 rounded border border-slate-100">
                        {cal || "-"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LINGUAL SIDE */}
                <div>
                  <h4 className="text-center font-bold text-slate-700 mb-3 border-b pb-1">Lingual / Palatal</h4>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-center">
                    <div></div>
                    <div className="text-xs font-bold text-slate-400">M</div>
                    <div className="text-xs font-bold text-slate-400">L</div>
                    <div className="text-xs font-bold text-slate-400">D</div>
                    
                    <span className="text-xs font-bold text-slate-500 text-right pr-2">PD</span>
                    {[
                      { pos: "mesiolingual", val: getRecord(selectedTooth).pockets.mesiolingual },
                      { pos: "lingual", val: getRecord(selectedTooth).pockets.lingual },
                      { pos: "distolingual", val: getRecord(selectedTooth).pockets.distolingual }
                    ].map((item, idx) => (
                      <Input key={`l-pd-${idx}`} id={`modal-l-pd-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={item.val ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handlePocketChange(selectedTooth, item.pos, val);
                          if (val.length >= 1) {
                            if (idx < 2) {
                              document.getElementById(`modal-l-pd-${idx + 1}`)?.focus();
                            } else if (threeAtATime) {
                              const seqIdx = toothSequence.indexOf(selectedTooth);
                              if (seqIdx < toothSequence.length - 1) {
                                setSelectedTooth(toothSequence[seqIdx + 1]);
                                setTimeout(() => document.getElementById('modal-b-pd-0')?.focus(), 50);
                              }
                            }
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">GM</span>
                    {[1, 2, 3].map((_, idx) => (
                      <Input key={`l-gm-${idx}`} id={`modal-l-gm-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={getRecord(selectedTooth).recession ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handleRecessionChange(selectedTooth, val);
                          if (val.length >= 1) {
                            if (idx < 2) {
                              document.getElementById(`modal-l-gm-${idx + 1}`)?.focus();
                            } else if (threeAtATime) {
                              const seqIdx = toothSequence.indexOf(selectedTooth);
                              if (seqIdx < toothSequence.length - 1) {
                                setSelectedTooth(toothSequence[seqIdx + 1]);
                                setTimeout(() => document.getElementById('modal-b-gm-0')?.focus(), 50);
                              }
                            }
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">CAL</span>
                    {[
                      (getRecord(selectedTooth).pockets.mesiolingual || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.lingual || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.distolingual || 0) + (getRecord(selectedTooth).recession || 0)
                    ].map((cal, idx) => (
                      <div key={`l-cal-${idx}`} className="h-9 bg-slate-50 flex items-center justify-center font-bold text-slate-400 rounded border border-slate-100">
                        {cal || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 mb-4"></div>

              {/* Conditions & Mobility */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 items-center justify-center">
                
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2">CONDITIONS:</span>
                  {[
                    { label: "Bleeding", key: "bleeding", color: "bg-red-100 text-red-600 border-red-200 hover:bg-red-200", active: "bg-red-500 text-white border-red-600" },
                    { label: "Suppuration", key: "suppuration", color: "bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200", active: "bg-yellow-500 text-white border-yellow-600" },
                    { label: "Plaque", key: "plaque", color: "bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200", active: "bg-blue-500 text-white border-blue-600" },
                    { label: "Calculus", key: "calculus", color: "bg-green-100 text-green-600 border-green-200 hover:bg-green-200", active: "bg-green-500 text-white border-green-600" }
                  ].map(cond => {
                    const isActive = getRecord(selectedTooth).conditions[cond.key as keyof PeriodontalConditions];
                    return (
                      <button 
                        key={cond.key}
                        onClick={() => handleConditionToggle(selectedTooth, cond.key as keyof PeriodontalConditions)} 
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors", 
                          isActive ? cond.active : cond.color
                        )}
                      >
                        {cond.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2">MOBILITY:</span>
                  {["1", "2", "3"].map(val => {
                    const isSelected = getRecord(selectedTooth).mobility === val;
                    return (
                      <button 
                        key={`mob-${val}`}
                        onClick={() => {
                          setRecords(prev => {
                            const newRecs = [...prev];
                            const idx = newRecs.findIndex(r => r.toothId === selectedTooth);
                            const newValue = isSelected ? undefined : (val as any);
                            if (idx > -1) {
                              newRecs[idx] = { ...newRecs[idx], mobility: newValue };
                            } else {
                              newRecs.push({ ...getRecord(selectedTooth), mobility: newValue });
                            }
                            return newRecs;
                          });
                        }} 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors", 
                          isSelected ? "bg-slate-700 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>

              <DialogFooter className="mt-6 border-t pt-4">
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6"
                  onClick={() => {
                    if (canUpdateChart) onSave(records);
                    setSelectedTooth(undefined);
                  }}
                >
                  Save & Close
                </Button>
              </DialogFooter>

            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Periodontal Result via {sendChannel === 'email' ? 'Email' : 'WhatsApp'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="recipient" className="text-sm font-medium leading-none">
                {sendChannel === 'email' ? 'Email Address' : 'WhatsApp Number (Intl format, no +)'}
              </label>
              <Input
                id="recipient"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
                placeholder={sendChannel === 'email' ? 'patient@example.com' : '256701234567'}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium leading-none">
                Custom Message (Optional)
              </label>
              <textarea
                id="message"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Type an optional message..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendResult} disabled={!sendRecipient || isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </>
  );
}
