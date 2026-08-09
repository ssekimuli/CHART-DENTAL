"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { RestorativeRecord, DentalRecord, Treatment } from "@/lib/types";

type OdontogramToothImageProps = {
  toothId: number;
  records: RestorativeRecord[];
  dentalRecord?: DentalRecord;
  hasTreatment?: boolean;
  onClick?: (toothId: number, surface?: string) => void;
  isBridgeSelected?: boolean;
  onBridgeToggle?: (toothId: number) => void;
};

function OdontogramToothImage({ toothId, records, dentalRecord, hasTreatment, onClick, isBridgeSelected, onBridgeToggle }: OdontogramToothImageProps) {
  const isUpper = toothId <= 28;
  const renderVisualProcedures = (view: "Back" | "Top" | "Front" | "Whole Tooth") => {
    // 1. Render RestorativeRecords (Visual Procedures)
    const toothRecords = records.filter(
      (r) => 
        (view === "Front" && (r.surface === "F (Facial)" || r.surface === "Front")) ||
        (view === "Back" && (r.surface === "L (Lingual)" || r.surface === "Back")) ||
        (view === "Top" && (
            r.surface === "O (Occlusal)" || 
            r.surface === "Top" || 
            r.surface === "Whole Tooth" || 
            r.surface.includes("M") || 
            r.surface.includes("D") || 
            r.surface.includes("F") || 
            r.surface.includes("L") || 
            r.surface.includes("O")
        ))
    );

    const overlays: React.ReactNode[] = [];

    toothRecords.forEach((record, index) => {
      const proc = record.material.toLowerCase();
      let style = {};
      let label = "";

      if (proc.includes("amalgam")) {
        style = { backgroundColor: "#94a3b8", border: "1px solid #475569", borderRadius: "40%", width: "40%", height: "40%", left: "30%", top: "30%" };
      } else if (proc.includes("composite") && proc.includes("filling")) {
        style = { backgroundColor: "#fef08a", border: "1px solid #ca8a04", borderRadius: "40%", width: "35%", height: "35%", left: "32.5%", top: "32.5%", opacity: 0.8 };
      } else if (proc.includes("crown")) {
        style = { border: "3px solid #3b82f6", borderRadius: "20%", width: "90%", height: "90%", left: "5%", top: "5%", backgroundColor: "rgba(59, 130, 246, 0.2)" };
      } else if (proc.includes("veneer")) {
        style = { border: "2px solid #8b5cf6", borderRadius: "10%", width: "80%", height: "80%", left: "10%", top: "10%", backgroundColor: "rgba(139, 92, 246, 0.2)" };
      } else if (proc.includes("implant")) {
        style = { border: "2px dashed #9ca3af", borderRadius: "50%", width: "60%", height: "60%", left: "20%", top: "20%", display: "flex", alignItems: "center", justifyContent: "center" };
        label = "I";
      } else if (proc.includes("root canal") || proc.includes("endodontic")) {
        style = { backgroundColor: "#ef4444", width: "10%", height: "60%", left: "45%", top: "20%", borderRadius: "10px" };
      } else {
        style = { backgroundColor: "#0ea5e9", width: "30%", height: "30%", left: "35%", top: "35%", borderRadius: "50%", opacity: 0.7 };
      }

      // SVG Polygon rendering for specific surfaces
      const s = record.surface.toUpperCase();
      const isSpecificSurface = s.includes("M ") || s.includes("D ") || s.includes("F ") || s.includes("L ") || s.includes("O ") || ["MOD", "MO", "DO"].includes(s);
      
      if (view === "Top" && isSpecificSurface) {
         const isRight = toothId >= 11 && toothId <= 18 || toothId >= 41 && toothId <= 48;
         
         const surfaceColor = proc.includes("amalgam") ? "#475569" : 
                              proc.includes("composite") ? "#60A5FA" : 
                              proc.includes("glass") ? "#FBBF24" :
                              proc.includes("temporary") ? "#D1D5DB" :
                              proc.includes("inlay") || proc.includes("onlay") ? "#A78BFA" : "#0ea5e9";

         const mColor = s.includes('M') ? surfaceColor : 'transparent';
         const dColor = s.includes('D') ? surfaceColor : 'transparent';
         const oColor = s.includes('O') ? surfaceColor : 'transparent';
         const fColor = s.includes('F') ? surfaceColor : 'transparent';
         const lColor = s.includes('L') ? surfaceColor : 'transparent';

         const mSide = isRight ? 'left' : 'right';
         const dSide = isRight ? 'right' : 'left';

         overlays.push(
           <svg key={`surf-${record.id || index}`} viewBox="0 0 100 100" className="absolute inset-0 w-[90%] h-[90%] left-[5%] top-[5%] z-20 opacity-90 pointer-events-none drop-shadow-sm">
             {/* O (Center) */}
             <path d="M 30,30 L 70,30 L 70,70 L 30,70 Z" fill="transparent" stroke={oColor !== 'transparent' ? oColor : 'none'} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
             {/* F (Top) */}
             <path d="M 10,10 Q 50,0 90,10 L 70,30 L 30,30 Z" fill="transparent" stroke={fColor !== 'transparent' ? fColor : 'none'} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
             {/* L (Bottom) */}
             <path d="M 30,70 L 70,70 L 90,90 Q 50,100 10,90 Z" fill="transparent" stroke={lColor !== 'transparent' ? lColor : 'none'} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
             {/* Left Side */}
             <path d="M 10,10 L 30,30 L 30,70 L 10,90 Q 0,50 10,10 Z" fill="transparent" stroke={(mSide === 'left' ? mColor : dColor) !== 'transparent' ? (mSide === 'left' ? mColor : dColor) : 'none'} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
             {/* Right Side */}
             <path d="M 90,10 L 70,30 L 70,70 L 90,90 Q 100,50 90,10 Z" fill="transparent" stroke={(mSide === 'right' ? mColor : dColor) !== 'transparent' ? (mSide === 'right' ? mColor : dColor) : 'none'} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
           </svg>
         );
      } else {
          // If it's a generic full-tooth record (not a specific M/D/F/L/O surface)
          // We apply a soft full-tooth tint shading instead of crude geometric blocks/circles
          const procColor = proc.includes("amalgam") ? '71, 85, 105' : // #475569
                            proc.includes("composite") ? '96, 165, 250' : // #60A5FA
                            proc.includes("glass") ? '251, 191, 36' : // #FBBF24
                            proc.includes("crown") ? '167, 139, 250' : // #A78BFA
                            proc.includes("veneer") ? '139, 92, 246' : // #8b5cf6
                            proc.includes("temporary") ? '209, 213, 219' : // #d1d5db
                            '14, 165, 233'; // #0ea5e9

          if (proc.includes("implant")) {
              if (view === "Back") {
                  const maskUrl = `url(/teeth/restore/tooth_${toothId}/back.png)`;
                  const needsRotate = isUpper;
                  const bgGradient = 'repeating-linear-gradient(10deg, #9ca3af 0px, #9ca3af 3px, #4b5563 3px, #4b5563 5px)';
                      
                  overlays.push(
                    <div 
                       key={`proc-${record.id || index}`} 
                       className={`absolute inset-0 pointer-events-none z-10 ${needsRotate ? 'rotate-180' : ''}`} 
                       style={{ 
                          backgroundImage: bgGradient,
                          backgroundSize: '100% 57%',
                          backgroundPosition: 'bottom',
                          backgroundRepeat: 'no-repeat',
                          WebkitMaskImage: maskUrl,
                          WebkitMaskSize: 'contain',
                          WebkitMaskPosition: 'center',
                          WebkitMaskRepeat: 'no-repeat',
                          maskImage: maskUrl,
                          maskSize: 'contain',
                          maskPosition: 'center',
                          maskRepeat: 'no-repeat',
                          mixBlendMode: 'multiply'
                       }} 
                    />
                  );
              }
          } else if (proc.includes("root canal") || proc.includes("endodontic")) {
              overlays.push(
                <div key={`proc-${record.id || index}`} className="absolute pointer-events-none z-10" style={{ backgroundColor: "#ef4444", width: "10%", height: "60%", left: "45%", top: "20%", borderRadius: "10px" }} />
              );
          } else {
              overlays.push(
                <div 
                   key={`proc-${record.id || index}`} 
                   className="absolute inset-[-2px] pointer-events-none z-10 rounded-full border-[3px]" 
                   style={{ 
                      borderColor: `rgb(${procColor})`,
                      borderStyle: 'dashed',
                      opacity: 0.8
                   }} 
                />
              );
          }
      }
    });

    // 2. Render DentalCondition overlays
    if (dentalRecord && dentalRecord.condition !== 'Healthy') {
      const isImplantCond = dentalRecord.condition === 'Implant';
      
      // Implant on Back, Others on Top
      if ((!isImplantCond && view === "Top") || (isImplantCond && view === "Back")) {
        let conditionColor = "";
        if (dentalRecord.condition === 'Caries') conditionColor = "#EA580C";
        if (dentalRecord.condition === 'Filling') conditionColor = "#0284C7";
        if (dentalRecord.condition === 'Crown') conditionColor = "#9333EA";
        if (dentalRecord.condition === 'Missing') conditionColor = "#334155";
        if (dentalRecord.condition === 'Fracture') conditionColor = "#DC2626";
        if (dentalRecord.condition === 'Implant') conditionColor = "#9CA3AF";
        if (dentalRecord.condition === 'Bridge') conditionColor = "#06B6D4";

        if (dentalRecord.condition === 'Missing') {
          // Draw an X
          overlays.push(
            <div key={`cond-${dentalRecord.id}`} className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
               <div className="w-full h-1 bg-red-600 rotate-45 absolute opacity-80" />
               <div className="w-full h-1 bg-red-600 -rotate-45 absolute opacity-80" />
            </div>
          );
        } else if (isImplantCond) {
            const maskUrl = `url(/teeth/restore/tooth_${toothId}/back.png)`;
            const needsRotate = isUpper;
            const bgGradient = 'repeating-linear-gradient(10deg, #9ca3af 0px, #9ca3af 3px, #4b5563 3px, #4b5563 5px)';
            
            overlays.push(
              <div 
                 key={`cond-${dentalRecord.id}`} 
                 className={`absolute inset-0 pointer-events-none z-20 ${needsRotate ? 'rotate-180' : ''}`} 
                 style={{ 
                    backgroundImage: bgGradient,
                    backgroundSize: '100% 57%',
                    backgroundPosition: 'bottom',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: maskUrl,
                    WebkitMaskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    maskImage: maskUrl,
                    maskSize: 'contain',
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    mixBlendMode: 'multiply'
                 }} 
              />
            );
        } else {
          // Beautiful full-tooth radial shading instead of a dot
          const rgb = conditionColor === '#EA580C' ? '234, 88, 12' : // Caries
                      conditionColor === '#0284C7' ? '2, 132, 199' : // Filling
                      conditionColor === '#9333EA' ? '147, 51, 234' : // Crown
                      conditionColor === '#06B6D4' ? '6, 182, 212' : // Bridge
                      conditionColor === '#DC2626' ? '220, 38, 38' : '16, 185, 129'; // Fracture / Healthy
          overlays.push(
            <div 
               key={`cond-${dentalRecord.id}`} 
               className="absolute inset-0 pointer-events-none z-20" 
               style={{ 
                  backgroundColor: `rgba(${rgb}, 0.65)`,
                  WebkitMaskImage: `url(/teeth/restore/tooth_${toothId}/top.png)`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: `url(/teeth/restore/tooth_${toothId}/top.png)`,
                  maskSize: 'contain',
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                  mixBlendMode: 'multiply'
               }} 
            />
          );
        }
      }
    }

    if (view === "Top" && hasTreatment) {
      overlays.push(
        <div key="treatment" className="absolute inset-0 pointer-events-none z-30 border-[3px] border-blue-500 rounded-full border-dashed opacity-80" />
      );
    }

    return overlays;
  };

  return (
    <div
      className={`flex flex-col items-center group w-14 sm:w-16 md:w-20 lg:w-24 ${onClick ? 'cursor-pointer hover:bg-slate-800/50 p-1 rounded-lg transition-colors' : ''} ${isBridgeSelected ? 'bg-fuchsia-500/20 border-2 border-fuchsia-500 rounded-lg' : ''}`}
      onClick={() => onClick && onClick(toothId)}
    >
      {isUpper && <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors mb-1">{toothId}</span>}
      
      {/* Upper Arch: Root on Top, Occlusal on Bottom */}
      {isUpper && (
          <>
            {/* Front View (Facial Root pointing UP) */}
            <div 
                className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 transition-transform hover:scale-110 z-0 -mb-2 md:-mb-3"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "F (Facial)"); }}
            >
                <Image
                src={`/teeth/restore/tooth_${toothId}/front.png`}
                alt={`Tooth ${toothId} Front`}
                fill
                className="object-contain drop-shadow-md opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                {renderVisualProcedures("Front")}
            </div>

            {/* Top View (Occlusal) */}
            <div 
                className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 transition-transform hover:scale-110 z-10"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "O (Occlusal)"); }}
            >
                {/* Surface Badges */}
                <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">F</div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">L</div>
                    <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">{(toothId >= 11 && toothId <= 18) || (toothId >= 41 && toothId <= 48) ? 'M' : 'D'}</div>
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">{(toothId >= 11 && toothId <= 18) || (toothId >= 41 && toothId <= 48) ? 'D' : 'M'}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600/50 bg-slate-800/50 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">O</div>
                </div>

                <Image
                src={`/teeth/restore/tooth_${toothId}/top.png`}
                alt={`Tooth ${toothId} Top`}
                fill
                className="object-contain drop-shadow-lg relative z-10"
                onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
                />
                {renderVisualProcedures("Top")}
            </div>

            {/* Back View (Palatal Root pointing DOWN) */}
            <div 
                className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 transition-transform hover:scale-110 z-0 -mt-2 md:-mt-3"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "L (Lingual)"); }}
            >
                <div className="absolute inset-0 drop-shadow-md">
                  <Image
                  src={`/teeth/restore/tooth_${toothId}/back.png`}
                  alt={`Tooth ${toothId} Back`}
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity rotate-180"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                  />
                </div>
                {renderVisualProcedures("Back")}
            </div>
          </>
      )}

      {/* Lower Arch: Occlusal on Top, Root on Bottom */}
      {!isUpper && (
          <>
            {/* Back View (Lingual Root pointing UP) */}
            <div 
                className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 transition-transform hover:scale-110 z-0 -mb-2 md:-mb-3"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "L (Lingual)"); }}
            >
                <Image
                src={`/teeth/restore/tooth_${toothId}/back.png`}
                alt={`Tooth ${toothId} Back`}
                fill
                className="object-contain drop-shadow-md opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                {renderVisualProcedures("Back")}
            </div>

            {/* Top View (Occlusal) */}
            <div 
                className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 transition-transform hover:scale-110 z-10"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "O (Occlusal)"); }}
            >
                {/* Surface Badges */}
                <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">F</div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">L</div>
                    <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">{(toothId >= 11 && toothId <= 18) || (toothId >= 41 && toothId <= 48) ? 'M' : 'D'}</div>
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600 bg-slate-800 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">{(toothId >= 11 && toothId <= 18) || (toothId >= 41 && toothId <= 48) ? 'D' : 'M'}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-600/50 bg-slate-800/50 text-[8px] flex items-center justify-center text-slate-300 shadow-sm">O</div>
                </div>

                <div className="absolute inset-0 drop-shadow-lg z-10">
                  <Image
                  src={`/teeth/restore/tooth_${toothId}/top.png`}
                  alt={`Tooth ${toothId} Top`}
                  fill
                  className="object-contain rotate-180"
                  onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
                  />
                </div>
                {renderVisualProcedures("Top")}
            </div>

            {/* Front View (Facial Root pointing DOWN) */}
            <div 
                className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 transition-transform hover:scale-110 z-0 -mt-2 md:-mt-3"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "F (Facial)"); }}
            >
                <div className="absolute inset-0 drop-shadow-md">
                  <Image
                  src={`/teeth/restore/tooth_${toothId}/front.png`}
                  alt={`Tooth ${toothId} Front`}
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity rotate-180"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                  />
                </div>
                {renderVisualProcedures("Front")}
            </div>
          </>
      )}

      {!isUpper && <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors mt-1">{toothId}</span>}
    </div>
  );
}

export function Odontogram({
  records = [],
  dentalRecords = [],
  treatmentPlans = [],
  onToothClick,
  selectedBridgeTeeth = [],
  onBridgeToothToggle
}: {
  records?: RestorativeRecord[],
  dentalRecords?: DentalRecord[],
  treatmentPlans?: Treatment[],
  onToothClick?: (toothId: number, surface?: string) => void,
  selectedBridgeTeeth?: number[],
  onBridgeToothToggle?: (toothId: number) => void
}) {
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const getBridgeGroups = () => {
    const groups: { [key: string]: DentalRecord[] } = {};
    dentalRecords.forEach(record => {
      if (record.condition === 'Bridge' && record.bridgeGroupId) {
        if (!groups[record.bridgeGroupId]) {
          groups[record.bridgeGroupId] = [];
        }
        groups[record.bridgeGroupId].push(record);
      }
    });
    return Object.values(groups).filter(g => g.length > 1);
  };

  const renderTooth = (id: number) => {
    const dentalRecord = dentalRecords.find(r => r.toothId === id);
    const hasTreatment = treatmentPlans.some(p => p.tooth === id && (p.status === 'Proposed' || p.status === 'In Progress'));
    const toothRecords = records.filter(r => r.toothId == id);
    const isBridgeSelected = selectedBridgeTeeth.includes(id);

    return (
      <TooltipProvider key={id}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex justify-center" data-tooth-id={id}>
              <OdontogramToothImage
                toothId={id}
                records={toothRecords}
                dentalRecord={dentalRecord}
                hasTreatment={hasTreatment}
                onClick={onToothClick}
                isBridgeSelected={isBridgeSelected}
                onBridgeToggle={onBridgeToothToggle}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px] z-[100] bg-slate-800 text-slate-200 border-slate-700">
            <div className="font-bold border-b border-slate-700 pb-1 mb-1">Tooth {id}</div>
            {dentalRecord && dentalRecord.condition !== 'Healthy' && (
              <div className="text-sm">
                <span className="font-semibold text-slate-400">Condition:</span> {dentalRecord.condition}
              </div>
            )}
            {toothRecords.length > 0 && (
              <div className="text-sm mt-1">
                <span className="font-semibold text-slate-400">Restorations:</span>
                <ul className="list-disc pl-4 mt-1">
                  {toothRecords.map((r, i) => (
                    <li key={i}>{r.surface !== 'Whole Tooth' ? `${r.surface}: ` : ''}{r.material}</li>
                  ))}
                </ul>
              </div>
            )}
            {hasTreatment && (
              <div className="text-sm mt-1 text-blue-400">
                Has pending treatment plan
              </div>
            )}
            {(!dentalRecord || dentalRecord.condition === 'Healthy') && toothRecords.length === 0 && !hasTreatment && (
               <div className="text-xs text-slate-500 italic">No records</div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bridgeLines, setBridgeLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; id: string }>>([]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const bridgeGroups = getBridgeGroups();
    if (bridgeGroups.length === 0) {
      setBridgeLines([]);
      return;
    }

    const lines: typeof bridgeLines = [];
    const containerRect = containerRef.current.getBoundingClientRect();

    bridgeGroups.forEach((group, groupIdx) => {
      const sortedTeeth = group.map(r => r.toothId).sort((a, b) => a - b);

      for (let i = 0; i < sortedTeeth.length - 1; i++) {
        const tooth1 = sortedTeeth[i];
        const tooth2 = sortedTeeth[i + 1];

        const elem1 = document.querySelector(`[data-tooth-id="${tooth1}"]`);
        const elem2 = document.querySelector(`[data-tooth-id="${tooth2}"]`);

        if (elem1 && elem2) {
          const rect1 = elem1.getBoundingClientRect();
          const rect2 = elem2.getBoundingClientRect();

          const x1 = rect1.left - containerRect.left + rect1.width / 2;
          const y1 = rect1.top - containerRect.top + rect1.height / 2;
          const x2 = rect2.left - containerRect.left + rect2.width / 2;
          const y2 = rect2.top - containerRect.top + rect2.height / 2;

          // Only add line if teeth are reasonably close and not too vertical
          const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          if (distance > 0 && distance < 500 && Math.abs(x2 - x1) > 5) {
            lines.push({
              x1,
              y1,
              x2,
              y2,
              id: `bridge-${groupIdx}-${i}`
            });
          }
        }
      }
    });

    setBridgeLines(lines);

    const handleResize = () => {
      if (!containerRef.current) return;
      const newLines: typeof bridgeLines = [];
      const containerRect = containerRef.current.getBoundingClientRect();

      bridgeGroups.forEach((group, groupIdx) => {
        const sortedTeeth = group.map(r => r.toothId).sort((a, b) => a - b);

        for (let i = 0; i < sortedTeeth.length - 1; i++) {
          const tooth1 = sortedTeeth[i];
          const tooth2 = sortedTeeth[i + 1];

          const elem1 = document.querySelector(`[data-tooth-id="${tooth1}"]`);
          const elem2 = document.querySelector(`[data-tooth-id="${tooth2}"]`);

          if (elem1 && elem2) {
            const rect1 = elem1.getBoundingClientRect();
            const rect2 = elem2.getBoundingClientRect();

            const x1 = rect1.left - containerRect.left + rect1.width / 2;
            const y1 = rect1.top - containerRect.top + rect1.height / 2;
            const x2 = rect2.left - containerRect.left + rect2.width / 2;
            const y2 = rect2.top - containerRect.top + rect2.height / 2;

            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (distance > 0 && distance < 500 && Math.abs(x2 - x1) > 5) {
              newLines.push({
                x1,
                y1,
                x2,
                y2,
                id: `bridge-${groupIdx}-${i}`
              });
            }
          }
        }
      });

      setBridgeLines(newLines);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dentalRecords]);

  const renderBridgeConnectors = () => {
    if (bridgeLines.length === 0) return null;

    return (
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 5, width: '100%', height: '100%' }}
      >
        {bridgeLines.map(line => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#06B6D4"
            strokeWidth="3"
            opacity="0.7"
            strokeLinecap="round"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="w-full max-w-full flex flex-col select-none">

      <div className="flex justify-between items-center w-full mb-6 px-2">
        <h3 className="text-lg md:text-xl font-bold text-slate-200">Odontogram</h3>
      </div>

      {/* Teeth Arches */}
      <div ref={containerRef} className="flex flex-col gap-10 min-w-max px-4 mx-auto w-full pb-6 relative">
        {renderBridgeConnectors()}

        {/* UPPER ARCH */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full px-8 mb-3">
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Maxillary Right</span>
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Maxillary Left</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {/* Quadrant 1 */}
              <div className="flex gap-1 md:gap-2">
                {upperRight.map(renderTooth)}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 2 */}
              <div className="flex gap-1 md:gap-2">
                {upperLeft.map(renderTooth)}
              </div>
            </div>
          </div>

          {/* ARCH DIVIDER */}
          <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />

          {/* LOWER ARCH */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Quadrant 4 */}
              <div className="flex gap-1 md:gap-2">
                {lowerRight.map(renderTooth)}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 3 */}
              <div className="flex gap-1 md:gap-2">
                {lowerLeft.map(renderTooth)}
              </div>
            </div>
            <div className="flex items-center justify-between w-full px-8 mt-3">
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Mandibular Right</span>
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Mandibular Left</span>
            </div>
          </div>
        </div>
    </div>
  );
}
