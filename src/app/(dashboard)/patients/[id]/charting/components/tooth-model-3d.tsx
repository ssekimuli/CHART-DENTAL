"use client";

import React from "react";
import Image from "next/image";

export function ToothModel3D({ toothId = 85 }: { toothId?: number | string }) {
  const basePath = `/teeth/restore/tooth_${toothId}`;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-8 flex flex-col items-center justify-center gap-10 shadow-2xl group">
      {/* Subtle glowing radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,rgba(0,0,0,0)_100%)] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none opacity-20" />

      {/* Header */}
      <div className="relative w-full flex justify-center mb-[-10px]">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
           <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Tooth #{toothId}</span>
        </div>
      </div>

      {/* Back View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-blue-400">Back</span>
        <div className="relative w-28 h-24 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Image
            src={`${basePath}/back.png`}
            alt={`Back view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/back.png`; }}
          />
        </div>
      </div>

      {/* Top View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-pink-400">Top</span>
        <div className="relative w-28 h-24 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
          <Image
            src={`${basePath}/top.png`}
            alt={`Top view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/top.png`; }}
          />
        </div>
      </div>

      {/* Front View */}
      <div className="relative flex items-center justify-between w-full max-w-[240px] gap-8 group/item">
        <span className="text-slate-400 font-medium text-sm tracking-widest uppercase w-16 text-right transition-colors group-hover/item:text-emerald-400">Front</span>
        <div className="relative w-28 h-32 transition-transform duration-500 ease-out group-hover/item:scale-110 group-hover/item:drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Image
            src={`${basePath}/front.png`}
            alt={`Front view of tooth ${toothId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = `/teeth/tooth_${toothId}/front.png`; }}
          />
        </div>
      </div>
    </div>
  );
}
