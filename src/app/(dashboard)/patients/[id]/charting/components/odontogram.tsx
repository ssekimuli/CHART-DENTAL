"use client";

import React, { useState } from "react";
import Image from "next/image";

type OdontogramToothImageProps = {
  toothId: number;
};

function OdontogramToothImage({ toothId }: OdontogramToothImageProps) {
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
      </div>
    </div>
  );
}

export function Odontogram() {
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
                  <OdontogramToothImage key={id} toothId={id} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 2 */}
              <div className="flex gap-1 md:gap-2">
                {upperLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} />
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
                  <OdontogramToothImage key={id} toothId={id} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 3 */}
              <div className="flex gap-1 md:gap-2">
                {lowerLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} />
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
