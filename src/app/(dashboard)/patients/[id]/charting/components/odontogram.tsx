"use client";

import React, { useState } from "react";
import Image from "next/image";

type Mark = {
  id: string;
  x: number; // percentage
  y: number; // percentage
};

type OdontogramToothImageProps = {
  toothId: number;
  marks: Mark[];
  onAddMark: (toothId: number, x: number, y: number) => void;
};

function OdontogramToothImage({ toothId, marks, onAddMark }: OdontogramToothImageProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddMark(toothId, x, y);
  };

  return (
    <div className="flex flex-col items-center gap-2 group w-[50px]">
      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{toothId}</span>
      <div 
        className="relative w-[46px] h-[46px] cursor-crosshair transition-transform hover:scale-110"
        onClick={handleClick}
      >
        <Image
          src={`/teeth/restore/tooth_${toothId}/top.png`}
          alt={`Tooth ${toothId}`}
          fill
          className="object-contain drop-shadow-md"
          onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
        />
        {/* Render Marks */}
        {marks.map((m) => (
          <div
            key={m.id}
            className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-[1.5px] border-white pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function Odontogram() {
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});

  const handleAddMark = (toothId: number, x: number, y: number) => {
    setMarks(prev => {
      const existing = prev[toothId.toString()] || [];
      const newMark: Mark = {
        id: Math.random().toString(36).substring(7),
        x,
        y
      };
      return { ...prev, [toothId.toString()]: [...existing, newMark] };
    });
  };

  const clearMarks = () => setMarks({});

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="w-full flex flex-col items-center p-6 relative select-none">
      
      <div className="flex justify-between items-center w-full mb-8 relative z-10">
        <h3 className="text-xl font-bold text-slate-200">Interactive Odontogram</h3>
        <button 
          onClick={clearMarks}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-700 hover:border-slate-500"
        >
          Clear All Marks
        </button>
      </div>

      <div className="flex flex-col gap-10 relative z-10 w-full overflow-x-auto pb-4">
        
        {/* UPPER ARCH */}
        <div className="flex flex-col items-center min-w-max mx-auto">
          <div className="flex items-center justify-between w-full px-12 mb-3">
             <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Maxillary Right</span>
             <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Maxillary Left</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Quadrant 1 */}
            <div className="flex gap-2">
              {upperRight.map(id => (
                <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
              ))}
            </div>
            
            <div className="w-0.5 h-16 bg-slate-700/60 mx-2 rounded-full" />
            
            {/* Quadrant 2 */}
            <div className="flex gap-2">
              {upperLeft.map(id => (
                <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
              ))}
            </div>
          </div>
        </div>

        {/* ARCH DIVIDER */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />

        {/* LOWER ARCH */}
        <div className="flex flex-col items-center min-w-max mx-auto">
          <div className="flex items-center gap-3">
            {/* Quadrant 4 */}
            <div className="flex gap-2">
              {lowerRight.map(id => (
                <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
              ))}
            </div>
            
            <div className="w-0.5 h-16 bg-slate-700/60 mx-2 rounded-full" />
            
            {/* Quadrant 3 */}
            <div className="flex gap-2">
              {lowerLeft.map(id => (
                <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between w-full px-12 mt-3">
             <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Mandibular Right</span>
             <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Mandibular Left</span>
          </div>
        </div>

      </div>
    </div>
  );
}
