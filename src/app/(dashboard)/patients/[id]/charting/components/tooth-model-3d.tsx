"use client";

import "@google/model-viewer";
import React from "react";

// Register model-viewer in JSX elements for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean;
          "camera-controls"?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export function ToothModel3D() {
  return (
    <div className="w-full h-[400px] bg-muted/20 rounded-md border overflow-hidden flex items-center justify-center">
      {/* @ts-ignore */}
      <model-viewer
        src="/teeth/3D_teeth/tooth_11.glb"
        alt="A 3D model of a tooth"
        auto-rotate
        camera-controls
        style={{ width: "100%", height: "100%" }}
      ></model-viewer>
    </div>
  );
}
