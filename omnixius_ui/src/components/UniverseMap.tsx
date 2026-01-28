"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function StarField() {
  const ref = useRef<THREE.Points>(null);
  const sphere = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 25;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#6366f1"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function CoreNode() {
  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={1.5}>
      <Sphere args={[0.8, 64, 64]}>
        <MeshDistortMaterial
          color="#4f46e5"
          speed={4}
          distort={0.45}
          radius={1}
          emissive="#6366f1"
          emissiveIntensity={0.6}
        />
      </Sphere>
    </Float>
  );
}

export default function UniverseMap() {
  return (
    <div className="w-full h-full min-h-[500px] relative rounded-[3rem] overflow-hidden bg-black border border-white/5 shadow-2xl cursor-grab active:cursor-grabbing">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h3 className="text-xl font-black text-white tracking-tighter">ASTRA MAP v1.1</h3>
        <p className="text-[10px] text-indigo-500 font-mono uppercase tracking-[0.3em]">Interactive 3D Simulation</p>
      </div>
      
      <div className="absolute bottom-8 right-8 z-10 text-right pointer-events-none">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Navigation</p>
        <p className="text-xs font-mono text-indigo-400">Drag to Rotate | Scroll to Zoom</p>
      </div>

      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <StarField />
        <CoreNode />
        <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={8} />
      </Canvas>
    </div>
  );
}
