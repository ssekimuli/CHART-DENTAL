"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

type Mark = {
  id: string;
  view: "back" | "top" | "front";
  x: number;
  y: number;
};

export function ToothModel3D({ toothId = 85 }: { toothId?: number | string }) {
  const basePath = `/teeth/restore/tooth_${toothId}`;
  const [marks, setMarks] = useState<Mark[]>([]);

  const handleAddMark = (e: React.MouseEvent<HTMLDivElement>, view: "back" | "top" | "front") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMarks([...marks, { id: Math.random().toString(36).substr(2, 9), view, x, y }]);
  };

  const renderMarks = (view: "back" | "top" | "front") => {
    return marks
      .filter((m) => m.view === view)
      .map((m) => (
        <div
          key={m.id}
          className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] border border-white/50 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        />
      ));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-8 flex flex-col items-center justify-center gap-10 shadow-2xl group select-none">
      {/* Subtle glowing radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,rgba(0,0,0,0)_100%)] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none opacity-20" />

      {/* Header */}
      <div className="relative w-full flex justify-between items-center mb-[-10px]">
        <div className="w-8"></div> {/* Spacer for centering */}
        <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm shadow-md">
           <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Tooth #{toothId}</span>
        </div>
        <Button 
           variant="ghost" 
           size="icon" 
           className="w-8 h-8 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
           onClick={() => setMarks([])}
           title="Clear all marks"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Back View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-blue-400">Back</span>
        <div 
          className="relative w-28 h-24 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-crosshair"
          onClick={(e) => handleAddMark(e, "back")}
        >
          <Image
            src={`${basePath}/back.png`}
            alt={`Back view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/back.png`; }}
          />
          {renderMarks("back")}
        </div>
      </div>

      {/* Top View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-pink-400">Top</span>
        <div 
          className="relative w-28 h-24 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-crosshair"
          onClick={(e) => handleAddMark(e, "top")}
        >
          <Image
            src={`${basePath}/top.png`}
            alt={`Top view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/top.png`; }}
          />
          {renderMarks("top")}
        </div>
      </div>

      {/* Front View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-emerald-400">Front</span>
        <div 
          className="relative w-28 h-32 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-crosshair"
          onClick={(e) => handleAddMark(e, "front")}
        >
          <Image
            src={`${basePath}/front.png`}
            alt={`Front view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/front.png`; }}
          />
          {renderMarks("front")}
        </div>
      </div>
    </div>
  );
}
