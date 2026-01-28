"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dna, Activity, Zap, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organism {
  id: number;
  fitness: number;
  dna: { genes: number[] };
}

interface DnaModalProps {
  organism: Organism | null;
  onClose: () => void;
}

export default function DnaModal({ organism, onClose }: DnaModalProps) {
  if (!organism) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-slate-950 border border-indigo-500/30 rounded-[2.5rem] p-10 relative shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
              <Dna className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">
                Organism <span className="text-indigo-500">#{organism.id}</span>
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Genetic Sequence Analysis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fitness Score</p>
              <p className="text-2xl font-mono font-bold text-indigo-400">{organism.fitness.toFixed(4)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gene Count</p>
              <p className="text-2xl font-mono font-bold text-purple-400">{organism.dna.genes.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <p className="text-sm font-bold text-green-400 uppercase tracking-tighter">Stable</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> Nucleotide Mapping
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-6 rounded-3xl bg-black/50 border border-white/5">
              {organism.dna.genes.map((gene, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative"
                >
                  <div className="aspect-square rounded-lg bg-slate-900 border border-white/10 flex flex-col items-center justify-center transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10">
                    <span className="text-[8px] text-slate-600 font-mono mb-1">G{i}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-300">{(gene * 100).toFixed(0)}</span>
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-indigo-600 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Value: {gene.toFixed(6)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 fill-current" /> Optimize Genes
            </button>
            <button className="px-8 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-2xl transition-all flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
