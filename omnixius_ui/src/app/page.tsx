"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dna, Zap, Database, Activity, ShieldCheck, Cpu, ChevronRight,
  RefreshCw, Globe, User as UserIcon, LogOut, Layers, Atom,
  Link as LinkIcon, Brain, Users, Radio, Stars, Menu, X, Sparkles, TrendingUp,
  Wallet as WalletIcon, Coins, Trophy, Medal, Crown, Send, Battery, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";
import DnaModal from "@/components/DnaModal";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const UniverseMap = dynamic(() => import("@/components/UniverseMap"), { ssr: false });

// --- Types ---
interface Organism { id: number; fitness: number; dna: { genes: number[] }; }
interface HistoryPoint { generation: number; best_fitness: number; }
interface Wallet { balance: number; entropy_potential: number; }
interface LeaderboardEntry { username: string; balance: number; }
interface Message { id: number; username: string; content: string; timestamp: string; }
interface EnergyState { total_energy: number; field_stability: number; flux_rate: number; }
type LayerID = "L-1" | "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export default function OmnixiusDashboard() {
  const [isEntered, setIsEntered] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerID>("L3");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const [population, setPopulation] = useState<Organism[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [energy, setEnergy] = useState<EnergyState | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [logs, setLogs] = useState<string[]>(["System initialized. All layers online."]);
  
  const [quantumState, setQuantumState] = useState<{ entropy: number, key_fragment: string } | null>(null);
  const [oracleAdvice, setOracleAdvice] = useState<{ content: string, author: string } | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedOrganism, setSelectedOrganism] = useState<Organism | null>(null);
  const [user, setUser] = useState<{ token: string; username: string } | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastGenRef = useRef(0);
  const lastMsgIdRef = useRef(0);

  const layers = [
    { id: "L-1", name: "Energy", icon: Atom, desc: "Quantum Field Fluctuations" },
    { id: "L0", name: "Quantum", icon: Zap, desc: "QKD & Quantum Computing" },
    { id: "L1", name: "Chronos", icon: LinkIcon, desc: "IXI Token Economy" },
    { id: "L2", name: "Noosphere", icon: Brain, desc: "Collective AI Consciousness" },
    { id: "L3", name: "Organisms", icon: Dna, desc: "Phoenix Evolution Engine" },
    { id: "L4", name: "Oikoumene", icon: Users, desc: "Global Leaderboard" },
    { id: "L5", name: "Telesophy", icon: Radio, desc: "Interstellar Communication" },
    { id: "L6", name: "Astra", icon: Stars, desc: "Universe Visualization" },
  ];

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/status");
      const data = await res.json();
      setBackendStatus(`${data.status} (${data.version})`);
      
      if (data.generation > lastGenRef.current) {
        if (lastGenRef.current !== 0) {
          toast.success(`New Generation Detected: Gen ${data.generation}`, {
            description: "Evolution step completed successfully.",
            icon: <RefreshCw className="w-4 h-4 animate-spin" />
          });
        }
        lastGenRef.current = data.generation;
      }

      setGeneration(data.generation);
      setPopulation(data.population);
      setHistory(data.history);
      setEnergy(data.energy);
    } catch (e) { setBackendStatus("Offline"); }
  };

  const fetchWallet = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:4000/api/wallet/${user.username}`);
      const data = await res.json();
      if (data.Ok) setWallet(data.Ok);
    } catch (e) {}
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/leaderboard");
      const data = await res.json();
      if (data.Ok) setLeaderboard(data.Ok);
    } catch (e) {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/messages");
      const data = await res.json();
      if (data.Ok) {
        const sorted = data.Ok.reverse();
        setMessages(sorted);
        
        const lastMsg = sorted[sorted.length - 1];
        if (lastMsg && lastMsg.id > lastMsgIdRef.current) {
          if (lastMsgIdRef.current !== 0 && lastMsg.username !== user?.username) {
            toast.info(`New Signal from ${lastMsg.username}`, {
              description: lastMsg.content.length > 30 ? lastMsg.content.slice(0, 30) + "..." : lastMsg.content,
              icon: <Radio className="w-4 h-4" />
            });
          }
          lastMsgIdRef.current = lastMsg.id;
        }
      }
    } catch (e) {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    try {
      await fetch("http://localhost:4000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, content: newMessage }),
      });
      setNewMessage("");
      fetchMessages();
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchMessages();
    }, 5000);
    
    if (user) fetchWallet();
    if (activeLayer === "L0") fetchQuantum();
    if (activeLayer === "L2") fetchOracle();
    if (activeLayer === "L4") fetchLeaderboard();
    
    const savedUser = localStorage.getItem("omnixius_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    return () => clearInterval(interval);
  }, [activeLayer, user?.username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchQuantum = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/quantum");
      const data = await res.json();
      setQuantumState(data);
    } catch (e) {}
  };

  const fetchOracle = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/oracle");
      const data = await res.json();
      setOracleAdvice(data);
    } catch (e) {}
  };

  const runEvolution = async () => {
    if (isEvolving) return;
    setIsEvolving(true);
    try {
      const res = await fetch("http://localhost:4000/api/evolve", { 
        method: "POST",
        headers: user ? { "Authorization": `Bearer ${user.token}` } : {}
      });
      const data = await res.json();
      setGeneration(data.generation);
      setPopulation(data.population);
      setHistory(data.history);
      if (data.new_balance) setWallet(prev => prev ? { ...prev, balance: data.new_balance } : null);
      toast.success("Manual Evolution Triggered", {
        description: `Successfully reached Generation ${data.generation}`
      });
    } catch (e) { toast.error("Evolution Failed", { description: "Backend unreachable." }); }
    finally { setIsEvolving(false); }
  };

  const handleAuthSuccess = (token: string, username: string) => {
    const newUser = { token, username };
    setUser(newUser);
    localStorage.setItem("omnixius_user", JSON.stringify(newUser));
    fetchWallet();
    toast.success(`Welcome, ${username}`, { description: "Identity verified successfully." });
  };

  const handleLogout = () => {
    setUser(null);
    setWallet(null);
    localStorage.removeItem("omnixius_user");
    toast.info("Logged out", { description: "Your session has ended." });
  };

  if (!isEntered) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40"><UniverseMap /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-1" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-4xl px-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-10"><Layers className="text-white w-12 h-12" /></div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">OMNIXIUS</h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 tracking-[0.2em] uppercase">Evolutionary Multiverse Simulation</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {layers.slice(0, 4).map(l => (<div key={l.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><l.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest">{l.name}</p></div>))}
          </div>
          <button onClick={() => setIsEntered(true)} className="group relative px-12 py-6 bg-white text-black font-black text-lg rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] active:scale-95 overflow-hidden"><span className="relative z-10 flex items-center gap-3">ENTER MULTIVERSE <ArrowRight className="group-hover:translate-x-2 transition-transform" /></span></button>
        </motion.div>
        <footer className="absolute bottom-8 left-0 right-0 z-10 text-center"><p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-bold">Built for Architects & Hackers // v0.1.0-BETA</p></footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex overflow-hidden text-sm">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.aside animate={{ width: isSidebarOpen ? 280 : 80 }} className="relative z-30 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col transition-all text-sm">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[40px] h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Layers className="text-white w-5 h-5" /></div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-white">OMNIXIUS</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {layers.map((layer) => (
            <button key={layer.id} onClick={() => setActiveLayer(layer.id as LayerID)} className={cn("w-full flex items-center gap-4 p-3 rounded-xl transition-all group relative", activeLayer === layer.id ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent")}>
              <layer.icon className={cn("w-5 h-5 shrink-0", activeLayer === layer.id ? "text-indigo-400" : "group-hover:text-slate-300")} />
              {isSidebarOpen && <div className="text-left overflow-hidden"><p className="text-sm font-bold truncate">{layer.name}</p><p className="text-[10px] opacity-50 truncate">{layer.id}</p></div>}
              {activeLayer === layer.id && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500">{isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">{layers.find(l => l.id === activeLayer)?.name} <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-slate-500 font-mono uppercase">{activeLayer} System</span></h2>
          <div className="flex items-center gap-6">
            {wallet && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-indigo-400" /><span className="font-mono font-bold text-white">{wallet.balance.toFixed(1)} <span className="text-indigo-400 text-[10px]">IXI</span></span></div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-purple-400" /><span className="font-mono text-xs text-slate-400">{wallet.entropy_potential.toFixed(0)}%</span></div>
              </motion.div>
            )}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-full bg-black/40", backendStatus.includes("Active") ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400")}><div className={cn("w-1.5 h-1.5 rounded-full", backendStatus.includes("Active") ? "bg-green-500 animate-pulse" : "bg-red-500")} /><span className="text-[10px] font-bold uppercase tracking-tighter">{backendStatus}</span></div>
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-white/10"><div className="text-right hidden sm:block"><p className="text-xs font-bold text-white">{user.username}</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Level 1 Hacker</p></div><button onClick={handleLogout} className="p-2 hover:bg-red-500/10 rounded-full text-slate-500 hover:text-red-400 transition-all"><LogOut className="w-4 h-4" /></button></div>
            ) : <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-white/10">Connect Identity</button>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeLayer} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  {activeLayer === "L6" && <div className="h-[600px] w-full"><UniverseMap /></div>}
                  {activeLayer === "L-1" && (
                    <div className="space-y-8">
                      <div className="p-10 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 backdrop-blur-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)] animate-pulse" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-6 mb-12">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]"><Atom className="w-10 h-10 text-indigo-400 animate-spin-slow" /></div>
                            <div><h3 className="text-3xl font-black text-white tracking-tighter">Quantum Field Energy</h3><p className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-bold">Primary Power Source</p></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total Energy</p><p className="text-5xl font-mono font-bold text-white tracking-tighter">{energy?.total_energy.toFixed(2) || "0.00"}<span className="text-indigo-500 text-lg ml-2">GeV</span></p></div>
                            <div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Field Stability</p><p className="text-5xl font-mono font-bold text-purple-400 tracking-tighter">{(energy?.field_stability || 0 * 100).toFixed(1)}%</p></div>
                            <div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Flux Rate</p><p className="text-5xl font-mono font-bold text-green-400 tracking-tighter">+{energy?.flux_rate.toFixed(3) || "0.00"}</p></div>
                          </div>
                          <div className="mt-12 h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div animate={{ width: `${(energy?.field_stability || 0) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-green-500" /></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeLayer === "L3" && (
                    <>
                      <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Evolutionary Progress</h3>
                        <div className="h-[240px] w-full text-sm">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                              <defs><linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                              <XAxis dataKey="generation" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#818cf8', fontSize: '12px' }} />
                              <Area type="monotone" dataKey="best_fitness" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBest)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {population.sort((a,b) => b.fitness - a.fitness).map((org) => (
                          <motion.div layout key={org.id} onClick={() => setSelectedOrganism(org)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer text-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-indigo-400 font-mono text-[10px]">#{org.id}</div>
                                <div><p className="text-sm font-bold text-white">Organism {org.id}</p><p className="text-[10px] text-slate-500 font-mono">DNA Active</p></div>
                              </div>
                              <div className="text-right"><p className="text-lg font-mono text-white">{org.fitness.toFixed(2)}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Fitness</p></div>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div animate={{ width: `${(org.fitness / 20) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                  {activeLayer === "L5" && (
                    <div className="flex flex-col h-[600px] bg-indigo-500/5 border border-indigo-500/20 rounded-3xl backdrop-blur-xl overflow-hidden text-sm">
                      <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4"><Radio className="w-6 h-6 text-indigo-400 animate-pulse" /><h3 className="text-xl font-bold text-white">Interstellar Signal Stream</h3></div>
                        <span className="text-[10px] text-indigo-500 font-mono animate-pulse uppercase font-black">Encrypted Channel</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                          <motion.div initial={{ opacity: 0, x: msg.username === user?.username ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.username === user?.username ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className="flex items-center gap-2 mb-1 px-2"><span className="text-[10px] font-bold text-indigo-400 uppercase">{msg.username}</span><span className="text-[8px] text-slate-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span></div>
                            <div className={cn("px-4 py-3 rounded-2xl text-sm", msg.username === user?.username ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none")}>{msg.content}</div>
                          </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={sendMessage} className="p-6 bg-black/40 border-t border-white/10 flex gap-4">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={user ? "Broadcast your signal..." : "Connect Identity to broadcast"} disabled={!user} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600" />
                        <button type="submit" disabled={!user || !newMessage.trim()} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"><Send className="w-5 h-5" /></button>
                      </form>
                    </div>
                  )}
                  {activeLayer === "L4" && (
                    <div className="space-y-6 text-sm">
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-10"><div className="flex items-center gap-4"><Trophy className="w-8 h-8 text-yellow-500" /><h3 className="text-2xl font-bold text-white tracking-tight">Global Leaderboard</h3></div><button onClick={fetchLeaderboard} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all"><RefreshCw className="w-5 h-5" /></button></div>
                        <div className="space-y-3">
                          {leaderboard.map((entry, i) => (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={entry.username} className={cn("flex items-center justify-between p-5 rounded-2xl border transition-all", i === 0 ? "bg-yellow-500/10 border-yellow-500/20 shadow-lg shadow-yellow-500/5" : "bg-white/[0.02] border-white/5")}>
                              <div className="flex items-center gap-6"><div className="w-8 flex justify-center">{i === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : i === 1 ? <Medal className="w-5 h-5 text-slate-300" /> : i === 2 ? <Medal className="w-5 h-5 text-amber-600" /> : <span className="font-mono font-bold text-slate-600">#{i + 1}</span>}</div><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-indigo-400">{entry.username[0].toUpperCase()}</div><div><p className="font-bold text-white">{entry.username}</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Verified Citizen</p></div></div></div>
                              <div className="text-right"><p className="text-lg font-mono font-bold text-indigo-400">{entry.balance.toFixed(1)} IXI</p><p className="text-[10px] text-slate-500 uppercase font-bold">Total Wealth</p></div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeLayer === "L0" && (
                    <div className="space-y-6 text-sm">
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl">
                        <div className="flex items-center gap-4 mb-8"><Zap className="w-8 h-8 text-indigo-400" /><h3 className="text-2xl font-bold text-white">Quantum State Monitor</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 rounded-2xl bg-black/40 border border-white/5"><p className="text-indigo-400 font-mono text-2xl">{(quantumState?.entropy || 0).toFixed(4)}</p><p className="text-[10px] text-slate-500 uppercase mt-2 font-bold">Entropy Level</p></div>
                          <div className="col-span-2 p-6 rounded-2xl bg-black/40 border border-white/5"><p className="text-white font-mono text-sm break-all">{quantumState?.key_fragment || "GENERATING..."}</p><p className="text-[10px] text-slate-500 uppercase mt-2 font-bold">QKD Key Fragment</p></div>
                        </div>
                        <button onClick={fetchQuantum} className="mt-8 px-8 py-3 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">Resample Quantum Field</button>
                      </div>
                    </div>
                  )}
                  {activeLayer === "L2" && (
                    <div className="space-y-6 text-sm">
                      <div className="p-8 rounded-3xl bg-purple-500/5 border border-purple-500/20 backdrop-blur-xl relative overflow-hidden text-sm"><div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-32 h-32 text-purple-500" /></div><div className="flex items-center gap-4 mb-8"><Sparkles className="w-8 h-8 text-purple-400" /><h3 className="text-2xl font-bold text-white tracking-tight">Noosphere Oracle</h3></div><div className="min-h-[120px] flex flex-col justify-center"><p className="text-xl text-slate-300 italic font-serif leading-relaxed">"{oracleAdvice?.content || "Connecting to collective mind..."}"</p><p className="text-sm text-purple-400 mt-4 font-bold">— {oracleAdvice?.author || "Oracle"}</p></div><button onClick={fetchOracle} className="mt-8 px-8 py-3 bg-purple-600 rounded-xl text-sm font-bold hover:bg-purple-500 transition-all">Consult Oracle</button></div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <section className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Control Unit</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-white">{generation}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Gen</p></div>
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-indigo-400">{population.length || 0}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Pop</p></div>
                      </div>
                      <button onClick={runEvolution} disabled={isEvolving || !backendStatus.includes("Active")} className={cn("w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden", (isEvolving || !backendStatus.includes("Active")) ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-95")}>
                        {isEvolving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 fill-current" /> Trigger Layer Action</>}
                      </button>
                      <p className="text-[10px] text-center text-slate-500 animate-pulse italic">Auto-Evolution active: 30s cycle</p>
                    </div>
                  </section>
                  <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl flex flex-col h-[400px]">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2"><Database className="w-4 h-4 text-purple-500" /> Terminal Output</h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                      {logs.map((log, i) => (<div key={i} className="flex gap-3 text-[10px] font-mono leading-relaxed"><span className="text-indigo-500 shrink-0">[{new Date().toLocaleTimeString([], {hour12:false})}]</span><span className={i === 0 ? "text-slate-200" : "text-slate-500"}>{log}</span></div>))}
                    </div>
                  </section>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="h-12 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between px-8 text-[9px] text-slate-500 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-8"><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Quantum Secure</span><span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> L1 Sync: Active</span><span className="hidden md:flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Nodes: 12.4k</span></div>
          <div className="hidden sm:block font-bold text-indigo-500/50">OMNIXIUS CORE v0.1.0-BETA</div>
        </footer>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <DnaModal organism={selectedOrganism} onClose={() => setSelectedOrganism(null)} />
    </div>
  );
}
