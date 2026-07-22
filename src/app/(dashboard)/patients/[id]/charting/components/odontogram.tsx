"use client";

import React, { useState } from "react";
import Image from "next/image";

import type { RestorativeRecord, DentalRecord, Treatment } from "@/lib/types";

type OdontogramToothImageProps = {
  toothId: number;
  records: RestorativeRecord[];
  dentalRecord?: DentalRecord;
  hasTreatment?: boolean;
  onClick?: (toothId: number, surface?: string) => void;
};

function OdontogramToothImage({ toothId, records, dentalRecord, hasTreatment, onClick }: OdontogramToothImageProps) {
  const isUpper = toothId <= 28;
  const renderVisualProcedures = (view: "Back" | "Top" | "Front" | "Whole Tooth") => {
    // 1. Render RestorativeRecords (Visual Procedures)
    const toothRecords = records.filter(
      (r) => 
        r.surface === view || 
        (r.surface === "Whole Tooth" && view === "Top") ||
        (view === "Top" && (r.surface.includes("M") || r.surface.includes("D") || r.surface.includes("F") || r.surface.includes("L") || r.surface.includes("O")))
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
        style = { border: "2px dashed #10b981", borderRadius: "50%", width: "60%", height: "60%", left: "20%", top: "20%", display: "flex", alignItems: "center", justifyContent: "center" };
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
           <svg key={`surf-${record.id || index}`} viewBox="0 0 100 100" className="absolute inset-0 w-[90%] h-[90%] left-[5%] top-[5%] z-15 opacity-90 pointer-events-none drop-shadow-sm">
             {/* O (Center) */}
             <path d="M 30,30 L 70,30 L 70,70 L 30,70 Z" fill={oColor} stroke={oColor !== 'transparent' ? '#1e293b' : 'none'} strokeWidth="1" />
             {/* F (Top) */}
             <path d="M 10,10 Q 50,0 90,10 L 70,30 L 30,30 Z" fill={fColor} stroke={fColor !== 'transparent' ? '#1e293b' : 'none'} strokeWidth="1" />
             {/* L (Bottom) */}
             <path d="M 30,70 L 70,70 L 90,90 Q 50,100 10,90 Z" fill={lColor} stroke={lColor !== 'transparent' ? '#1e293b' : 'none'} strokeWidth="1" />
             {/* Left Side */}
             <path d="M 10,10 L 30,30 L 30,70 L 10,90 Q 0,50 10,10 Z" fill={mSide === 'left' ? mColor : dColor} stroke={(mSide === 'left' ? mColor : dColor) !== 'transparent' ? '#1e293b' : 'none'} strokeWidth="1" />
             {/* Right Side */}
             <path d="M 90,10 L 70,30 L 70,70 L 90,90 Q 100,50 90,10 Z" fill={mSide === 'right' ? mColor : dColor} stroke={(mSide === 'right' ? mColor : dColor) !== 'transparent' ? '#1e293b' : 'none'} strokeWidth="1" />
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
              overlays.push(
                <div key={`proc-${record.id || index}`} className="absolute pointer-events-none z-10 flex items-center justify-center text-emerald-500 font-bold text-xs" style={{ border: "2px dashed #10b981", borderRadius: "50%", width: "60%", height: "60%", left: "20%", top: "20%" }}>
                  I
                </div>
              );
          } else if (proc.includes("root canal") || proc.includes("endodontic")) {
              overlays.push(
                <div key={`proc-${record.id || index}`} className="absolute pointer-events-none z-10" style={{ backgroundColor: "#ef4444", width: "10%", height: "60%", left: "45%", top: "20%", borderRadius: "10px" }} />
              );
          } else {
              overlays.push(
                <div 
                   key={`proc-${record.id || index}`} 
                   className="absolute inset-1 pointer-events-none z-10 rounded-[40%]" 
                   style={{ 
                      background: `radial-gradient(circle, rgba(${procColor}, 0.5) 10%, rgba(${procColor}, 0.15) 70%, transparent 90%)`,
                      mixBlendMode: 'multiply'
                   }} 
                />
              );
          }
      }
    });

    // 2. Render DentalCondition overlays (only on Top view to keep it clean)
    if (view === "Top") {
      if (dentalRecord && dentalRecord.condition !== 'Healthy') {
        let conditionColor = "";
        if (dentalRecord.condition === 'Caries') conditionColor = "#FBBF24";
        if (dentalRecord.condition === 'Filling') conditionColor = "#60A5FA";
        if (dentalRecord.condition === 'Crown') conditionColor = "#A78BFA";
        if (dentalRecord.condition === 'Missing') conditionColor = "#6B7280";
        if (dentalRecord.condition === 'Fracture') conditionColor = "#EF4444";

        if (dentalRecord.condition === 'Missing') {
          // Draw an X
          overlays.push(
            <div key={`cond-${dentalRecord.id}`} className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
               <div className="w-full h-1 bg-red-600 rotate-45 absolute opacity-80" />
               <div className="w-full h-1 bg-red-600 -rotate-45 absolute opacity-80" />
            </div>
          );
        } else {
          // Beautiful full-tooth radial shading instead of a dot
          const rgb = conditionColor === '#FBBF24' ? '251, 191, 36' : // Caries
                      conditionColor === '#60A5FA' ? '96, 165, 250' : // Filling
                      conditionColor === '#A78BFA' ? '167, 139, 250' : // Crown
                      conditionColor === '#EF4444' ? '239, 68, 68' : '255, 255, 255';
          if (dentalRecord.condition !== 'Healthy') {
            overlays.push(
              <div 
                 key={`cond-${dentalRecord.id}`} 
                 className="absolute inset-1 pointer-events-none z-20 rounded-[40%]" 
                 style={{ 
                    background: `radial-gradient(circle, rgba(${rgb}, 0.95) 20%, rgba(${rgb}, 0.7) 50%, transparent 80%)`,
                    mixBlendMode: 'normal'
                 }} 
              />
            );
          }
        }
      }

      if (hasTreatment) {
        overlays.push(
          <div key="treatment" className="absolute inset-0 pointer-events-none z-30 border-[3px] border-blue-500 rounded-full border-dashed opacity-80" />
        );
      }
    }

    return overlays;
  };

  return (
    <div 
      className={`flex flex-col items-center group w-14 sm:w-16 md:w-20 lg:w-24 ${onClick ? 'cursor-pointer hover:bg-slate-800/50 p-1 rounded-lg transition-colors' : ''}`}
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
                <Image
                src={`/teeth/restore/tooth_${toothId}/back.png`}
                alt={`Tooth ${toothId} Back`}
                fill
                className="object-contain drop-shadow-md opacity-90 hover:opacity-100 transition-opacity rotate-180"
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
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

                <Image
                src={`/teeth/restore/tooth_${toothId}/top.png`}
                alt={`Tooth ${toothId} Top`}
                fill
                className="object-contain drop-shadow-lg relative z-10 rotate-180"
                onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
                />
                {renderVisualProcedures("Top")}
            </div>

            {/* Front View (Facial Root pointing DOWN) */}
            <div 
                className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 transition-transform hover:scale-110 z-0 -mt-2 md:-mt-3"
                onClick={(e) => { e.stopPropagation(); onClick && onClick(toothId, "F (Facial)"); }}
            >
                <Image
                src={`/teeth/restore/tooth_${toothId}/front.png`}
                alt={`Tooth ${toothId} Front`}
                fill
                className="object-contain drop-shadow-md opacity-90 hover:opacity-100 transition-opacity rotate-180"
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
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
  onToothClick
}: { 
  records?: RestorativeRecord[],
  dentalRecords?: DentalRecord[],
  treatmentPlans?: Treatment[],
  onToothClick?: (toothId: number, surface?: string) => void
}) {
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const renderTooth = (id: number) => {
    const dentalRecord = dentalRecords.find(r => r.toothId === id);
    const hasTreatment = treatmentPlans.some(p => p.tooth === id && (p.status === 'Proposed' || p.status === 'In Progress'));
    return (
      <OdontogramToothImage 
        key={id} 
        toothId={id} 
        records={records.filter(r => r.toothId == id)} 
        dentalRecord={dentalRecord}
        hasTreatment={hasTreatment}
        onClick={onToothClick}
      />
    );
  };

  return (
    <div className="w-full max-w-full flex flex-col select-none">
      
      <div className="flex justify-between items-center w-full mb-6 px-2">
        <h3 className="text-lg md:text-xl font-bold text-slate-200">Odontogram</h3>
      </div>

      {/* Teeth Arches */}
      <div className="flex flex-col gap-10 min-w-max px-4 mx-auto w-full pb-6">
        
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
