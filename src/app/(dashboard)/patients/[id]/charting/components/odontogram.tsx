"use client";

import React, { useState } from "react";
import Image from "next/image";

type Mark = {
  id: string;
  view: "back" | "top" | "front";
  x: number; // percentage
  y: number; // percentage
};

type OdontogramToothImageProps = {
  toothId: number;
  marks: Mark[];
  onAddMark: (toothId: number, view: "back" | "top" | "front", x: number, y: number) => void;
};

function OdontogramToothImage({ toothId, marks, onAddMark }: OdontogramToothImageProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>, view: "back" | "top" | "front") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddMark(toothId, view, x, y);
  };

  const renderMarks = (view: "back" | "top" | "front") => {
    return marks
      .filter((m) => m.view === view)
      .map((m) => (
        <div
          key={m.id}
          className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] border-[1.5px] border-white pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-pulse z-10"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        />
      ));
  };

  return (
    <div className="flex flex-col items-center gap-1 group w-14 md:w-16 lg:w-20">
      <span className="text-[10px] md:text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors mb-1 md:mb-2">{toothId}</span>
      
      {/* Back View */}
      <div 
        className="relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 cursor-crosshair transition-transform hover:scale-110"
        onClick={(e) => handleClick(e, "back")}
      >
        <Image
          src={`/teeth/restore/tooth_${toothId}/back.png`}
          alt={`Tooth ${toothId} Back`}
          fill
          className="object-contain drop-shadow-md opacity-80 hover:opacity-100 transition-opacity rotate-180"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        />
        {renderMarks("back")}
      </div>

      {/* Top View */}
      <div 
        className="relative w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 cursor-crosshair transition-transform hover:scale-110 z-10"
        onClick={(e) => handleClick(e, "top")}
      >
        <Image
          src={`/teeth/restore/tooth_${toothId}/top.png`}
          alt={`Tooth ${toothId} Top`}
          fill
          className="object-contain drop-shadow-lg"
          onError={(e) => { e.currentTarget.src = `/teeth/${toothId}.png`; }}
        />
        {renderMarks("top")}
      </div>

      {/* Front View */}
      <div 
        className="relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 cursor-crosshair transition-transform hover:scale-110"
        onClick={(e) => handleClick(e, "front")}
      >
        <Image
          src={`/teeth/restore/tooth_${toothId}/front.png`}
          alt={`Tooth ${toothId} Front`}
          fill
          className="object-contain drop-shadow-md opacity-80 hover:opacity-100 transition-opacity"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        />
        {renderMarks("front")}
      </div>
    </div>
  );
}

export function Odontogram() {
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});

  const handleAddMark = (toothId: number, view: "back" | "top" | "front", x: number, y: number) => {
    setMarks(prev => {
      const existing = prev[toothId.toString()] || [];
      const newMark: Mark = {
        id: Math.random().toString(36).substring(7),
        view,
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
    <div className="w-full max-w-full flex flex-col relative select-none">
      
      <div className="flex justify-between items-center w-full mb-6 relative z-10 px-2">
        <h3 className="text-lg md:text-xl font-bold text-slate-200">Interactive Odontogram</h3>
        <button 
          onClick={clearMarks}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-700 hover:border-slate-500 shrink-0"
        >
          Clear All Marks
        </button>
      </div>

      {/* Horizontally scrollable area strictly for teeth */}
      <div className="w-full max-w-full overflow-x-auto pb-6">
        <div className="flex flex-col gap-10 relative z-10 min-w-max px-4 mx-auto">
          
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
                  <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 2 */}
              <div className="flex gap-1 md:gap-2">
                {upperLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
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
                  <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
                ))}
              </div>
              
              <div className="w-0.5 h-16 bg-slate-700/60 mx-1 md:mx-2 rounded-full" />
              
              {/* Quadrant 3 */}
              <div className="flex gap-1 md:gap-2">
                {lowerLeft.map(id => (
                  <OdontogramToothImage key={id} toothId={id} marks={marks[id.toString()] || []} onAddMark={handleAddMark} />
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
    </div>
  );
}
