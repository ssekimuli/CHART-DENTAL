"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import { Suspense } from "react";

function Model() {
  // Use the downloaded GLB model
  const { scene } = useGLTF("/teeth/3D_teeth/tooth_11.glb");
  return <primitive object={scene} />;
}

export function ToothModel3D() {
  return (
    <div className="w-full h-[400px] bg-muted/20 rounded-md border overflow-hidden">
      <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model />
          </Stage>
        </Suspense>
        <OrbitControls autoRotate enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}
