"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dna, 
  Zap, 
  Database, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  ChevronRight,
  RefreshCw,
  Globe,
  User as UserIcon,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";

// --- Types ---
interface Organism {
  id: number; // Simplified after #[serde(transparent)]
  fitness: number;
  generation?: number;
}

export default function OmnixiusDashboard() {
  const [generation, setGeneration] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const [population, setPopulation] = useState<Organism[]>([]);
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [logs, setLogs] = useState<string[]>(["System initialized. Phoenix Engine ready."]);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ token: string; username: string } | null>(null);

  // Check Backend Connection
  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/status");
      const data = await res.json();
      setBackendStatus(`${data.status} (${data.version})`);
      setGeneration(data.generation);
    } catch (e) {
      setBackendStatus("Offline (Start Backend)");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    
    // Load user from localStorage
    const savedUser = localStorage.getItem("omnixius_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    
    return () => clearInterval(interval);
  }, []);

  const handleAuthSuccess = (token: string, username: string) => {
    const newUser = { token, username };
    setUser(newUser);
    localStorage.setItem("omnixius_user", JSON.stringify(newUser));
    setLogs(prev => [`User ${username} authenticated.`, ...prev].slice(0, 5));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("omnixius_user");
    setLogs(prev => ["User logged out.", ...prev].slice(0, 5));
  };

  const runEvolution = async () => {
    if (isEvolving) return;
    
    setIsEvolving(true);
    setLogs(prev => [`Gen ${generation + 1}: Contacting L0 Quantum Mutator...`, ...prev].slice(0, 5));
    
    try {
      const res = await fetch("http://localhost:4000/api/evolve", { 
        method: "POST",
        headers: user ? { "Authorization": `Bearer ${user.token}` } : {}
      });
      const data = await res.json();
      
      setGeneration(data.generation);
      setPopulation(data.population);
      setLogs(prev => [`Gen ${data.generation}: Evolution complete. L1 Checkpoint verified.`, ...prev].slice(0, 5));
    } catch (e) {
      setLogs(prev => ["Error: Backend unreachable during evolution.", ...prev].slice(0, 5));
    } finally {
      setIsEvolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Dna className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">OMNIXIUS</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Evolutionary Multiverse</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
              <Globe className="w-4 h-4" /> L0 Quantum
            </a>
            <a href="#" className="hover:text-white transition-colors">L1 Chronos</a>
            <a href="#" className="text-indigo-400">L3 Organisms</a>
            <a href="#" className="hover:text-white transition-colors">Noosphere</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <UserIcon className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{user.username}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 rounded-full text-slate-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-slate-200 transition-colors"
              >
                Sign In
              </button>
            )}
            
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all",
              backendStatus.includes("Active") 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <div className={cn("w-2 h-2 rounded-full", backendStatus.includes("Active") ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              <span className="text-[10px] font-bold uppercase">{backendStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Controls */}
        <div className="lg:col-span-4 space-y-8">
          <section className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" /> Phoenix Engine
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-2xl font-bold text-white">{generation}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Generation</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-2xl font-bold text-indigo-400">{population.length || 12}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Population</p>
                </div>
              </div>

              <button 
                onClick={runEvolution}
                disabled={isEvolving || !backendStatus.includes("Active")}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden",
                  (isEvolving || !backendStatus.includes("Active"))
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                )}
              >
                {isEvolving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                    Trigger Evolution
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" /> System Logs
            </h2>
            <div className="space-y-4 h-48 overflow-y-auto pr-2 custom-scrollbar">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex gap-3 text-[11px] leading-relaxed mb-3"
                >
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                  <span className={i === 0 ? "text-slate-200" : "text-slate-500"}>{log}</span>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Population Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-500" /> Active Population
            </h2>
            <div className="flex gap-2 text-[10px] text-slate-500">
              {population.length === 0 ? "Click Trigger to load real data" : `Showing ${population.length} organisms`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {population.sort((a,b) => b.fitness - a.fitness).map((org) => (
                <motion.div
                  layout
                  key={org.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 transition-colors text-indigo-400 font-mono text-[10px]">
                        #{org.id}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">Organism {org.id}</p>
                        <p className="text-[10px] text-slate-500 font-mono">DNA Sequence Active</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono text-white">{org.fitness.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Fitness</p>
                    </div>
                  </div>
                  
                  {/* Fitness Bar */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(org.fitness / 20) * 100}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {population.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-slate-500 text-sm">Phoenix Engine is idle. Trigger evolution to begin.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-green-500" /> Quantum Secure</span>
            <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3" /> Auto-syncing L1</span>
          </div>
          <div className="hidden sm:block">
            OMNIXIUS v0.1.0-alpha // Evolutionary Multiverse Interface
          </div>
        </div>
      </footer>
    </div>
  );
}
