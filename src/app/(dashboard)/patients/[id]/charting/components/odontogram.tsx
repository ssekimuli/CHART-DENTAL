"use client";

import React, { useState } from "react";
import Image from "next/image";

import type { RestorativeRecord, DentalRecord, Treatment } from "@/lib/types";

type OdontogramToothImageProps = {
  toothId: number;
  records: RestorativeRecord[];
  dentalRecord?: DentalRecord;
  hasTreatment?: boolean;
  onClick?: (toothId: number) => void;
};

function OdontogramToothImage({ toothId, records, dentalRecord, hasTreatment, onClick }: OdontogramToothImageProps) {
  const renderVisualProcedures = (view: "Back" | "Top" | "Front" | "Whole Tooth") => {
    // 1. Render RestorativeRecords (Visual Procedures)
    const toothRecords = records.filter(
      (r) => r.surface === view || (r.surface === "Whole Tooth" && view === "Top")
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

      overlays.push(
        <div key={`proc-${record.id || index}`} className="absolute pointer-events-none z-10 flex items-center justify-center text-white font-bold text-[10px]" style={style}>
          {label}
        </div>
      );
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
          // Draw a colored overlay dot
          overlays.push(
            <div key={`cond-${dentalRecord.id}`} className="absolute pointer-events-none z-20 flex items-center justify-center" style={{ backgroundColor: conditionColor, width: "30%", height: "30%", left: "35%", top: "35%", borderRadius: "50%", opacity: 0.9, border: "2px solid rgba(0,0,0,0.2)" }} />
          );
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
      className={`flex flex-col items-center gap-2 group w-20 md:w-24 lg:w-28 ${onClick ? 'cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors' : ''}`}
      onClick={() => onClick && onClick(toothId)}
    >
      <span className="text-xs md:text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors mb-2">{toothId}</span>
      
      {/* Back View */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 transition-transform hover:scale-110">
        <Image
          src={`/teeth/restore/tooth_${toothId}/back.png`}
          alt={`Tooth ${toothId} Back`}
          fill
          className="object-contain drop-shadow-md opacity-80 hover:opacity-100 transition-opacity rotate-180"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        />
        {renderVisualProcedures("Back")}
      </div>

      {/* Top View */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 transition-transform hover:scale-110 z-10">
        <Image
          src={`/teeth/restore/tooth_${toothId}/top.png`}
          alt={`Tooth ${toothId} Top`}
          fill
          className="object-contain drop-shadow-lg"
          onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
        />
        {renderVisualProcedures("Top")}
      </div>

      {/* Front View */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 transition-transform hover:scale-110">
        <Image
          src={`/teeth/restore/tooth_${toothId}/front.png`}
          alt={`Tooth ${toothId} Front`}
          fill
          className="object-contain drop-shadow-md opacity-80 hover:opacity-100 transition-opacity"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        />
        {renderVisualProcedures("Front")}
      </div>
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
  onToothClick?: (toothId: number) => void
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
