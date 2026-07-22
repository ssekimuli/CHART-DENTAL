"use client";

import React, { useState } from "react";
import Image from "next/image";

import type { RestorativeRecord } from "@/lib/types";

type OdontogramToothImageProps = {
  toothId: number;
  records: RestorativeRecord[];
};

function OdontogramToothImage({ toothId, records }: OdontogramToothImageProps) {
  const renderVisualProcedures = (view: "Back" | "Top" | "Front" | "Whole Tooth") => {
    const toothRecords = records.filter(
      (r) => r.surface === view || (r.surface === "Whole Tooth" && view === "Top")
    );

    if (toothRecords.length === 0) return null;

    return toothRecords.map((record, index) => {
      const proc = record.material.toLowerCase();
      let style = {};
      let label = "";

      if (proc.includes("amalgam")) {
        // Silver filling
        style = { backgroundColor: "#94a3b8", border: "1px solid #475569", borderRadius: "40%", width: "40%", height: "40%", left: "30%", top: "30%" };
      } else if (proc.includes("composite") && proc.includes("filling")) {
        // White filling
        style = { backgroundColor: "#fef08a", border: "1px solid #ca8a04", borderRadius: "40%", width: "35%", height: "35%", left: "32.5%", top: "32.5%", opacity: 0.8 };
      } else if (proc.includes("crown")) {
        // Crown overlay
        style = { border: "3px solid #3b82f6", borderRadius: "20%", width: "90%", height: "90%", left: "5%", top: "5%", backgroundColor: "rgba(59, 130, 246, 0.2)" };
      } else if (proc.includes("veneer")) {
        // Veneer
        style = { border: "2px solid #8b5cf6", borderRadius: "10%", width: "80%", height: "80%", left: "10%", top: "10%", backgroundColor: "rgba(139, 92, 246, 0.2)" };
      } else if (proc.includes("implant")) {
        // Implant
        style = { border: "2px dashed #10b981", borderRadius: "50%", width: "60%", height: "60%", left: "20%", top: "20%", display: "flex", alignItems: "center", justifyContent: "center" };
        label = "I";
      } else if (proc.includes("root canal") || proc.includes("endodontic")) {
        // Root canal
        style = { backgroundColor: "#ef4444", width: "10%", height: "60%", left: "45%", top: "20%", borderRadius: "10px" };
      } else {
        // Generic procedure
        style = { backgroundColor: "#0ea5e9", width: "30%", height: "30%", left: "35%", top: "35%", borderRadius: "50%", opacity: 0.7 };
      }

      return (
        <div key={record.id || index} className="absolute pointer-events-none z-10 flex items-center justify-center text-white font-bold text-[10px]" style={style}>
          {label}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 group w-20 md:w-24 lg:w-28">
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

export function Odontogram({ records = [] }: { records?: RestorativeRecord[] }) {
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

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
                {upperRight.map(id => (
                  <OdontogramToothImage key={id} toothId={id} records={records.filter(r => r.toothId == id)} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 2 */}
              <div className="flex gap-1 md:gap-2">
                {upperLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} records={records.filter(r => r.toothId == id)} />
                ))}
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
                {lowerRight.map(id => (
                  <OdontogramToothImage key={id} toothId={id} records={records.filter(r => r.toothId == id)} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 3 */}
              <div className="flex gap-1 md:gap-2">
                {lowerLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} records={records.filter(r => r.toothId == id)} />
                ))}
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
