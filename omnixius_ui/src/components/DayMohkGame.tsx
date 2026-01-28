"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Sky, 
  Cloud, 
  Environment, 
  MapControls,
  Text,
  Float,
  MeshDistortMaterial
} from "@react-three/drei";
import { Play, Shield, Map as MapIcon, Crosshair, Zap, Users, ArrowLeft } from "lucide-react";
import * as THREE from "three";

// --- Components ---

function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 64, 64]} />
      <meshStandardMaterial 
        color="#1a1a1a" 
        wireframe={false} 
        roughness={0.8}
      />
    </mesh>
  );
}

function Landmark({ position, name, color }: { position: [number, number, number], name: string, color: string }) {
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </Float>
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.4}
        color="white"
        font="/fonts/Inter-Bold.woff"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}

// --- Main Game Component ---

export default function DayMohkGame({ onExit }: { onClose?: () => void, onExit: () => void }) {
  const [gameState, setGameState] = useState<"splash" | "playing">("splash");

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
      <AnimatePresence mode="wait">
        {gameState === "splash" ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020203]"
          >
            {/* Background cinematic effect */}
            <div className="absolute inset-0 opacity-30">
              <Canvas>
                <Sky sunPosition={[100, 20, 100]} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              </Canvas>
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 text-center"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_-10px_rgba(99,102,241,0.5)] mx-auto mb-10 border border-white/20">
                <Shield className="text-white w-16 h-16" />
              </div>
              <h2 className="text-7xl font-black text-white tracking-tighter mb-4 uppercase italic">
                DAY-MOHK
              </h2>
              <p className="text-sm text-indigo-400 font-bold tracking-[0.5em] uppercase mb-12">
                The Great Homeland Metaverse
              </p>

              <button
                onClick={() => setGameState("playing")}
                className="group relative px-16 py-6 bg-white text-black font-black text-xl rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-95 overflow-hidden flex items-center gap-4 mx-auto"
              >
                <Play className="w-6 h-6 fill-current" />
                PLAY NOW
              </button>
            </motion.div>

            <button 
              onClick={onExit}
              className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portal
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40"
          >
            {/* 3D Game World */}
            <Canvas shadows shadowMap>
              <Sky sunPosition={[100, 10, 100]} distance={450000} inclination={0} azimuth={0.25} />
              <ambientLight intensity={0.4} />
              <pointLight position={[10, 10, 10]} castShadow />
              
              <Terrain />
              
              {/* Landmarks */}
              <Landmark position={[0, 0, 0]} name="Grozny" color="#6366f1" />
              <Landmark position={[15, 0, 10]} name="Makhachkala" color="#f97316" />
              <Landmark position={[-10, 0, -5]} name="Magas" color="#22c55e" />
              
              <MapControls 
                enableDamping 
                dampingFactor={0.05} 
                screenSpacePanning={false} 
                minDistance={5} 
                maxDistance={50} 
                maxPolarAngle={Math.PI / 2.1} 
              />
            </Canvas>

            {/* Game UI Overlays */}
            
            {/* Mini-map */}
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-black/60 backdrop-blur-xl border-2 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                <div className="absolute top-4 left-4 text-[8px] font-black text-white/40 uppercase tracking-widest">Tactical Map</div>
                {/* Simplified radar lines */}
                <div className="absolute inset-0 border border-white/5 rounded-full m-4" />
                <div className="absolute inset-0 border border-white/5 rounded-full m-12" />
              </div>
            </div>

            {/* Top Stats */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4">
              <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Squad: Alpha-1</span>
              </div>
              <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                <Crosshair className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Objective: Secure Hub</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="absolute top-10 right-10 space-y-4">
              <button 
                onClick={() => setGameState("splash")}
                className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="absolute bottom-10 right-10 flex gap-4">
              <button className="px-8 py-4 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-indigo-500 hover:text-white transition-all active:scale-95 uppercase tracking-tighter text-xs">
                Deploy Vehicle
              </button>
              <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-tighter text-xs">
                Request Support
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper for Stars (re-implementing or usingrei) ---
function Stars({ radius = 100, depth = 50, count = 5000, factor = 4, saturation = 0, fade = false, speed = 1 }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius + Math.random() * depth;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;
    }
    return [positions, colors];
  }, [count, radius, depth]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += state.clock.getDelta() * speed * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={factor} color="#ffffff" transparent opacity={0.8} sizeAttenuation={false} />
    </points>
  );
}
