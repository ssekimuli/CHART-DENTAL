"use client";

import React, { useState } from "react";

type Surface = "T" | "B" | "L" | "R" | "C";

type OdontogramToothProps = {
  toothId: number;
  marks: Record<string, string[]>; // { [toothId]: ['T', 'C', ...] }
  onSurfaceClick: (toothId: number, surface: Surface) => void;
};

function OdontogramTooth({ toothId, marks, onSurfaceClick }: OdontogramToothProps) {
  const toothMarks = marks[toothId.toString()] || [];

  const getFill = (surface: Surface) => {
    return toothMarks.includes(surface) ? "#3b82f6" : "transparent"; // blue-500
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{toothId}</span>
      <svg width="46" height="46" viewBox="0 0 50 50" className="cursor-pointer drop-shadow-md">
        {/* Top */}
        <polygon 
          points="0,0 50,0 35,15 15,15" 
          fill={getFill("T")} 
          stroke="#475569" 
          strokeWidth="2" 
          className="hover:fill-slate-600 transition-colors" 
          onClick={() => onSurfaceClick(toothId, "T")} 
        />
        {/* Right */}
        <polygon 
          points="50,0 50,50 35,35 35,15" 
          fill={getFill("R")} 
          stroke="#475569" 
          strokeWidth="2" 
          className="hover:fill-slate-600 transition-colors" 
          onClick={() => onSurfaceClick(toothId, "R")} 
        />
        {/* Bottom */}
        <polygon 
          points="0,50 50,50 35,35 15,35" 
          fill={getFill("B")} 
          stroke="#475569" 
          strokeWidth="2" 
          className="hover:fill-slate-600 transition-colors" 
          onClick={() => onSurfaceClick(toothId, "B")} 
        />
        {/* Left */}
        <polygon 
          points="0,0 15,15 15,35 0,50" 
          fill={getFill("L")} 
          stroke="#475569" 
          strokeWidth="2" 
          className="hover:fill-slate-600 transition-colors" 
          onClick={() => onSurfaceClick(toothId, "L")} 
        />
        {/* Center */}
        <polygon 
          points="15,15 35,15 35,35 15,35" 
          fill={getFill("C")} 
          stroke="#475569" 
          strokeWidth="2" 
          className="hover:fill-slate-600 transition-colors" 
          onClick={() => onSurfaceClick(toothId, "C")} 
        />
      </svg>
    </div>
  );
}

export function Odontogram() {
  const [marks, setMarks] = useState<Record<string, string[]>>({});

  const handleSurfaceClick = (toothId: number, surface: Surface) => {
    setMarks(prev => {
      const existing = prev[toothId.toString()] || [];
      const updated = existing.includes(surface) 
        ? existing.filter(s => s !== surface) 
        : [...existing, surface];
        
      return { ...prev, [toothId.toString()]: updated };
    });
  };

  const clearMarks = () => setMarks({});

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="w-full flex flex-col items-center bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-2xl relative select-none">
      
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,rgba(0,0,0,0)_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none opacity-20" />

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
                <OdontogramTooth key={id} toothId={id} marks={marks} onSurfaceClick={handleSurfaceClick} />
              ))}
            </div>
            
            <div className="w-0.5 h-16 bg-slate-700/60 mx-2 rounded-full" />
            
            {/* Quadrant 2 */}
            <div className="flex gap-2">
              {upperLeft.map(id => (
                <OdontogramTooth key={id} toothId={id} marks={marks} onSurfaceClick={handleSurfaceClick} />
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
                <OdontogramTooth key={id} toothId={id} marks={marks} onSurfaceClick={handleSurfaceClick} />
              ))}
            </div>
            
            <div className="w-0.5 h-16 bg-slate-700/60 mx-2 rounded-full" />
            
            {/* Quadrant 3 */}
            <div className="flex gap-2">
              {lowerLeft.map(id => (
                <OdontogramTooth key={id} toothId={id} marks={marks} onSurfaceClick={handleSurfaceClick} />
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
