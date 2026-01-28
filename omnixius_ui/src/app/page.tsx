"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dna, Zap, Database, Activity, ShieldCheck, Cpu, ChevronRight,
  RefreshCw, Globe, User as UserIcon, LogOut, Layers, Atom,
  Link as LinkIcon, Brain, Users, Radio, Stars, Menu, X, Sparkles, TrendingUp,
  Wallet as WalletIcon, Coins, Trophy, Medal, Crown, Send, Battery, ArrowRight,
  BarChart3, GraduationCap, Briefcase, Play, Trophy as SportIcon, Heart, Terminal,
  CheckCircle2, Plus, Search as SearchIcon, Volume2, VolumeX, Mic2
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";
import DnaModal from "@/components/DnaModal";
import ParticleBackground from "@/components/ParticleBackground";
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
interface MarketData { asset: string; price: number; change: number; }
interface Course { title: string; category: string; cost: number; }
interface Blogger { name: string; subscribers: number; category: string; }
interface UserData { subscriptions: string[]; courses: string[]; }

type LayerID = "L-1" | "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

// --- Sound Engine (Simple Web Audio) ---
const playSound = (type: 'click' | 'success' | 'error' | 'evolve') => {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'success') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'evolve') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }
};

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
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [userData, setUserData] = useState<UserData>({ subscriptions: [], courses: [] });
  const [newMessage, setNewMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [logs, setLogs] = useState<string[]>(["System initialized. All layers online."]);
  const [isMuted, setIsMuted] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    { id: "L2", name: "Noosphere", icon: Brain, desc: "Mind & Capital", color: "text-blue-400" },
    { id: "L4", name: "Oikoumene", icon: Users, desc: "Life & Culture", color: "text-orange-400" },
    { id: "L3", name: "Phoenix", icon: Dna, desc: "Biology & Evolution", color: "text-green-400" },
    { id: "L1", name: "Chronos", icon: LinkIcon, desc: "Time & Assets", color: "text-yellow-400" },
    { id: "L6", name: "Astra", icon: Stars, desc: "Basis & Cosmos", color: "text-purple-400" },
    { id: "L0", name: "Quantum", icon: Zap, desc: "Quantum Operations", color: "text-indigo-400" },
    { id: "L-1", name: "Energy", icon: Atom, desc: "Quantum Fields", color: "text-cyan-400" },
    { id: "L5", name: "Telesophy", icon: Radio, desc: "Communication", color: "text-pink-400" },
  ];

  const speakOracle = (text: string) => {
    if (isMuted || typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.5;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/status");
      const data = await res.json();
      setBackendStatus(`${data.status} (${data.version})`);
      
      if (data.generation > lastGenRef.current) {
        if (lastGenRef.current !== 0) {
          if (!isMuted) playSound('evolve');
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

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:4000/api/user/data/${user.username}`);
      const data = await res.json();
      if (data.Ok) setUserData(data.Ok);
    } catch (e) {}
  };

  const fetchNoosphereData = async () => {
    try {
      const mRes = await fetch("http://localhost:4000/api/noosphere/markets");
      const cRes = await fetch("http://localhost:4000/api/noosphere/courses");
      setMarkets(await mRes.json());
      setCourses(await cRes.json());
      if (user) fetchUserData();
    } catch (e) {}
  };

  const fetchOikoumeneData = async () => {
    try {
      const bRes = await fetch("http://localhost:4000/api/oikoumene/bloggers");
      setBloggers(await bRes.json());
      fetchLeaderboard();
      if (user) fetchUserData();
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
            if (!isMuted) playSound('click');
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
    if (!isMuted) playSound('click');
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

  const handleSubscribe = async (blogger: string) => {
    if (!user) return toast.error("Identity Required");
    if (!isMuted) playSound('click');
    const isSubscribed = userData.subscriptions.includes(blogger);
    const endpoint = isSubscribed ? "/api/oikoumene/unsubscribe" : "/api/oikoumene/subscribe";
    
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, target: blogger }),
      });
      const data = await res.json();
      if (data.Ok !== undefined) {
        toast.success(isSubscribed ? `Unsubscribed from ${blogger}` : `Subscribed to ${blogger}`);
        fetchUserData();
      }
    } catch (e) {}
  };

  const handleBuyCourse = async (course: string) => {
    if (!user) return toast.error("Identity Required");
    if (!isMuted) playSound('click');
    if (userData.courses.includes(course)) return toast.info("Already Owned");
    
    try {
      const res = await fetch(`http://localhost:4000/api/noosphere/buy-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, target: course }),
      });
      const data = await res.json();
      if (data.Ok) {
        if (!isMuted) playSound('success');
        toast.success(`Course Purchased: ${course}`);
        fetchWallet();
        fetchUserData();
      } else if (data.Err) {
        toast.error("Purchase Failed", { description: data.Err });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchMessages();
    }, 5000);
    
    if (user) {
      fetchWallet();
      fetchUserData();
    }
    if (activeLayer === "L0") fetchQuantum();
    if (activeLayer === "L2") fetchNoosphereData();
    if (activeLayer === "L4") fetchOikoumeneData();
    if (activeLayer === "L5") fetchMessages();
    
    const savedUser = localStorage.getItem("omnixius_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    return () => clearInterval(interval);
  }, [activeLayer, user?.username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchQuantum = async () => {
    if (!isMuted) playSound('click');
    try {
      const res = await fetch("http://localhost:4000/api/quantum");
      const data = await res.json();
      setQuantumState(data);
    } catch (e) {}
  };

  const fetchOracle = async () => {
    if (!isMuted) playSound('click');
    try {
      const res = await fetch("http://localhost:4000/api/oracle");
      const data = await res.json();
      setOracleAdvice(data);
      if (data.content) speakOracle(data.content);
    } catch (e) {}
  };

  const runEvolution = async () => {
    if (isEvolving) return;
    if (!isMuted) playSound('click');
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
      if (!isMuted) playSound('success');
    } catch (e) {}
    finally { setIsEvolving(false); }
  };

  const triggerLayerAction = () => {
    if (activeLayer === "L3") runEvolution();
    else if (activeLayer === "L0") fetchQuantum();
    else if (activeLayer === "L2") fetchNoosphereData();
    else if (activeLayer === "L4") fetchOikoumeneData();
    else if (activeLayer === "L5") fetchMessages();
    else if (activeLayer === "L-1") fetchStatus();
  };

  const handleAuthSuccess = (token: string, username: string) => {
    if (!isMuted) playSound('success');
    const newUser = { token, username };
    setUser(newUser);
    localStorage.setItem("omnixius_user", JSON.stringify(newUser));
    fetchWallet();
    fetchUserData();
    toast.success(`Welcome, ${username}`);
  };

  const handleLogout = () => {
    if (!isMuted) playSound('click');
    setUser(null);
    setWallet(null);
    setUserData({ subscriptions: [], courses: [] });
    localStorage.removeItem("omnixius_user");
    toast.info("Logged out");
  };

  // Search Logic
  const filteredResults = {
    organisms: population.filter(o => o.id.toString().includes(searchQuery)),
    bloggers: bloggers.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())),
    courses: courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
    messages: messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  };

  const hasSearchResults = searchQuery.length > 0 && (
    filteredResults.organisms.length > 0 || 
    filteredResults.bloggers.length > 0 || 
    filteredResults.courses.length > 0 || 
    filteredResults.messages.length > 0
  );

  if (!isEntered) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 z-0 opacity-40"><UniverseMap /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-1" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-6xl px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-8"><Layers className="text-white w-10 h-10" /></div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase text-shadow-lg shadow-indigo-500/20">OMNIXIUS</h1>
          <p className="text-sm md:text-base text-slate-400 font-bold mb-16 tracking-[0.4em] uppercase">The Five Great Doors of the Multiverse</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-16 px-4">
            {layers.slice(0, 5).map((l) => (
              <motion.button key={l.id} whileHover={{ scale: 1.05, y: -10 }} onClick={() => { if (!isMuted) playSound('click'); setActiveLayer(l.id as LayerID); setIsEntered(true); }} className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl transition-all hover:border-indigo-500/50 hover:bg-white/10 text-center flex flex-col items-center">
                <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110", l.color)}><l.icon className="w-8 h-8" /></div>
                <h3 className="text-lg font-black tracking-tight mb-2 uppercase">{l.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{l.desc}</p>
                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase">Enter Door <ArrowRight className="w-3 h-3" /></div>
              </motion.button>
            ))}
          </div>
          <button onClick={() => { if (!isMuted) playSound('click'); setIsEntered(true); }} className="group relative px-12 py-6 bg-white text-black font-black text-lg rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] active:scale-95 overflow-hidden"><span className="relative z-10 flex items-center gap-3">ENTER MULTIVERSE <ArrowRight className="group-hover:translate-x-2 transition-transform" /></span></button>
        </motion.div>
        <footer className="absolute bottom-8 left-0 right-0 z-10 text-center flex flex-col items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />}
          </button>
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-bold">Architectural Portal // v0.1.0-BETA</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex overflow-hidden text-sm">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.aside animate={{ width: isSidebarOpen ? 280 : 80 }} className="relative z-30 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col transition-all text-sm">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => { if (!isMuted) playSound('click'); setIsEntered(false); }}>
            <div className="min-w-[40px] h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Layers className="text-white w-5 h-5" /></div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-white uppercase">OMNIXIUS</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {layers.map((layer) => (
            <button key={layer.id} onClick={() => { if (!isMuted) playSound('click'); setActiveLayer(layer.id as LayerID); }} className={cn("w-full flex items-center gap-4 p-3 rounded-xl transition-all group relative", activeLayer === layer.id ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent")}>
              <layer.icon className={cn("w-5 h-5 shrink-0", activeLayer === layer.id ? "text-indigo-400" : "group-hover:text-slate-300")} />
              {isSidebarOpen && <div className="text-left overflow-hidden"><p className="text-sm font-bold truncate uppercase">{layer.name}</p><p className="text-[10px] opacity-50 truncate">{layer.id}</p></div>}
              {activeLayer === layer.id && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { if (!isMuted) playSound('click'); setIsSidebarOpen(!isSidebarOpen); }} className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500">{isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden text-sm">
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase">{layers.find(l => l.id === activeLayer)?.name} <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-slate-500 font-mono uppercase">{activeLayer} System</span></h2>
            <div className="relative group hidden md:block">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }} onFocus={() => setIsSearchOpen(true)} placeholder="Search Multiverse..." className="bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 w-64 text-xs focus:outline-none focus:border-indigo-500/50 focus:w-80 transition-all" />
              <AnimatePresence>
                {isSearchOpen && searchQuery && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-white/10 rounded-3xl p-4 shadow-2xl z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4 px-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Search Results</span><button onClick={() => setIsSearchOpen(false)}><X className="w-3 h-3 text-slate-500" /></button></div>
                    {!hasSearchResults && <p className="text-center py-8 text-xs text-slate-600 italic">No matches found.</p>}
                    {filteredResults.organisms.length > 0 && (
                      <div className="mb-4"><p className="text-[8px] font-black text-green-500 uppercase mb-2 px-2">Organisms</p>{filteredResults.organisms.map(o => (<button key={o.id} onClick={() => { if (!isMuted) playSound('click'); setSelectedOrganism(o); setIsSearchOpen(false); }} className="w-full text-left p-3 rounded-xl hover:bg-white/5 flex justify-between items-center transition-colors"><span className="text-xs font-bold text-white">Organism #{o.id}</span><span className="text-[10px] font-mono text-indigo-400">{o.fitness.toFixed(2)} F</span></button>))}</div>
                    )}
                    {filteredResults.bloggers.length > 0 && (
                      <div className="mb-4"><p className="text-[8px] font-black text-orange-500 uppercase mb-2 px-2">Citizens</p>{filteredResults.bloggers.map(b => (<button key={b.name} onClick={() => { if (!isMuted) playSound('click'); setActiveLayer("L4"); setIsSearchOpen(false); }} className="w-full text-left p-3 rounded-xl hover:bg-white/5 flex justify-between items-center transition-colors"><span className="text-xs font-bold text-white">{b.name}</span><span className="text-[8px] text-slate-500 uppercase">Blogger</span></button>))}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
            </button>
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
                  {activeLayer === "L2" && (
                    <div className="space-y-8">
                      <div className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/20 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-32 h-32 text-purple-500" /></div>
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4"><Sparkles className="w-8 h-8 text-purple-400" /><h3 className="text-2xl font-bold text-white tracking-tight uppercase">Noosphere Oracle</h3></div>
                          <button onClick={fetchOracle} className="p-3 bg-purple-600 rounded-2xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"><Mic2 className="w-5 h-5 text-white" /></button>
                        </div>
                        <div className="min-h-[120px] flex flex-col justify-center"><p className="text-xl text-slate-300 italic font-serif leading-relaxed">"{oracleAdvice?.content || "Connecting to collective mind..."}"</p><p className="text-sm text-purple-400 mt-4 font-bold">— {oracleAdvice?.author || "Oracle"}</p></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="p-8 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><BarChart3 className="w-5 h-5 text-blue-400" /> Market Terminal</h3>
                          <div className="space-y-4">{markets.map(m => (<div key={m.asset} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5"><span className="font-mono font-bold">{m.asset}</span><div className="text-right"><p className="font-mono text-white">${m.price.toLocaleString()}</p><p className={cn("text-[10px] font-bold", m.change > 0 ? "text-green-400" : "text-red-400")}>{m.change > 0 ? "+" : ""}{m.change}%</p></div></div>))}</div>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><GraduationCap className="w-5 h-5 text-indigo-400" /> Academy</h3>
                          <div className="space-y-4">{courses.map(c => (<div key={c.title} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between h-32"><div className="flex justify-between items-start"><p className="text-xs font-bold text-white">{c.title}</p>{userData.courses.includes(c.title) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <button onClick={() => handleBuyCourse(c.title)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold rounded-lg transition-colors">{c.cost} IXI</button>}</div><div><div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: userData.courses.includes(c.title) ? '100%' : '0%' }} /></div><p className="text-[8px] text-slate-500 mt-2 uppercase tracking-widest">{userData.courses.includes(c.title) ? "Access Granted" : "Locked"}</p></div></div>))}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeLayer === "L4" && (
                    <div className="space-y-8">
                      <div className="p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/20 backdrop-blur-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><Play className="w-5 h-5 text-orange-400" /> Media & Bloggers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{bloggers.map(b => (<div key={b.name} className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center group hover:border-orange-500/30 transition-all relative overflow-hidden"><div className="w-12 h-12 rounded-full bg-slate-800 mx-auto mb-4 flex items-center justify-center text-orange-400 font-bold">{b.name[0]}</div><p className="font-bold text-white text-xs">{b.name}</p><p className="text-[8px] text-slate-500 uppercase mt-1 mb-4">{(b.subscribers / 1000).toFixed(0)}k Subs</p><button onClick={() => handleSubscribe(b.name)} className={cn("w-full py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2", userData.subscriptions.includes(b.name) ? "bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400" : "bg-orange-600 text-white hover:bg-orange-500")}>{userData.subscriptions.includes(b.name) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}{userData.subscriptions.includes(b.name) ? "Unsubscribe" : "Subscribe"}</button></div>))}</div>
                      </div>
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl"><div className="flex items-center justify-between mb-10"><div className="flex items-center gap-4"><Trophy className="w-8 h-8 text-yellow-500" /><h3 className="text-2xl font-bold text-white tracking-tight uppercase">Global Leaderboard</h3></div><button onClick={() => { if (!isMuted) playSound('click'); fetchLeaderboard(); }} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all"><RefreshCw className="w-5 h-5" /></button></div><div className="space-y-3">{leaderboard.map((entry, i) => (<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={entry.username} className={cn("flex items-center justify-between p-5 rounded-2xl border transition-all", i === 0 ? "bg-yellow-500/10 border-yellow-500/20 shadow-lg shadow-yellow-500/5" : "bg-white/[0.02] border-white/5")}><div className="flex items-center gap-6"><div className="w-8 flex justify-center">{i === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : i === 1 ? <Medal className="w-5 h-5 text-slate-300" /> : i === 2 ? <Medal className="w-5 h-5 text-amber-600" /> : <span className="font-mono font-bold text-slate-600">#{i + 1}</span>}</div><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-indigo-400">{entry.username[0].toUpperCase()}</div><div><p className="font-bold text-white">{entry.username}</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Verified Citizen</p></div></div></div><div className="text-right"><p className="text-lg font-mono font-bold text-indigo-400">{entry.balance.toFixed(1)} IXI</p><p className="text-[10px] text-slate-500 uppercase font-bold">Total Wealth</p></div></motion.div>))}</div></div>
                    </div>
                  )}
                  {activeLayer === "L6" && <div className="h-[600px] w-full"><UniverseMap /></div>}
                  {activeLayer === "L-1" && (
                    <div className="space-y-8">
                      <div className="p-10 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 backdrop-blur-2xl relative overflow-hidden group"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)] animate-pulse" /><div className="relative z-10"><div className="flex items-center gap-6 mb-12"><div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]"><Atom className="w-10 h-10 text-indigo-400 animate-spin-slow" /></div><div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Quantum Field Energy</h3><p className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-bold">Primary Power Source</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total Energy</p><p className="text-5xl font-mono font-bold text-white tracking-tighter">{energy?.total_energy.toFixed(2) || "0.00"}<span className="text-indigo-500 text-lg ml-2">GeV</span></p></div><div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Field Stability</p><p className="text-5xl font-mono font-bold text-purple-400 tracking-tighter">{((energy?.field_stability || 0) * 100).toFixed(1)}%</p></div><div className="space-y-2"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Flux Rate</p><p className="text-5xl font-mono font-bold text-green-400 tracking-tighter">+{energy?.flux_rate.toFixed(3) || "0.00"}</p></div></div><div className="mt-12 h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div animate={{ width: `${(energy?.field_stability || 0) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-green-500" /></div></div></div>
                    </div>
                  )}
                  {activeLayer === "L3" && (
                    <>
                      <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Evolutionary Progress</h3>
                        <div className="h-[240px] w-full text-sm text-sm"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs><linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} /><XAxis dataKey="generation" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#818cf8', fontSize: '12px' }} /><Area type="monotone" dataKey="best_fitness" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBest)" /></AreaChart></ResponsiveContainer></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">{population.sort((a,b) => b.fitness - a.fitness).map((org) => (<motion.div layout key={org.id} onClick={() => { if (!isMuted) playSound('click'); setSelectedOrganism(org); }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer text-sm"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-indigo-400 font-mono text-[10px]">#{org.id}</div><div><p className="text-sm font-bold text-white uppercase">Organism {org.id}</p><p className="text-[10px] text-slate-500 font-mono">DNA Active</p></div></div><div className="text-right"><p className="text-lg font-mono text-white">{org.fitness.toFixed(2)}</p><p className="text-[10px] text-slate-500 uppercase">Fitness</p></div></div><div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div animate={{ width: `${(org.fitness / 20) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div></motion.div>))}</div>
                    </>
                  )}
                  {activeLayer === "L5" && (
                    <div className="flex flex-col h-[600px] bg-indigo-500/5 border border-indigo-500/20 rounded-3xl backdrop-blur-xl overflow-hidden text-sm">
                      <div className="p-6 border-b border-white/10 flex items-center justify-between"><div className="flex items-center gap-4"><Radio className="w-6 h-6 text-indigo-400 animate-pulse" /><h3 className="text-xl font-bold text-white uppercase">Interstellar Signal Stream</h3></div><span className="text-[10px] text-indigo-500 font-mono animate-pulse uppercase font-black tracking-widest">Encrypted Channel</span></div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">{messages.map((msg) => (<motion.div initial={{ opacity: 0, x: msg.username === user?.username ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.username === user?.username ? "ml-auto items-end" : "mr-auto items-start")}><div className="flex items-center gap-2 mb-1 px-2"><span className="text-[10px] font-bold text-indigo-400 uppercase">{msg.username}</span><span className="text-[8px] text-slate-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span></div><div className={cn("px-4 py-3 rounded-2xl text-sm", msg.username === user?.username ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none")}>{msg.content}</div></motion.div>))}<div ref={chatEndRef} /></div>
                      <form onSubmit={sendMessage} className="p-6 bg-black/40 border-t border-white/10 flex gap-4"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={user ? "Broadcast your signal..." : "Connect Identity to broadcast"} disabled={!user} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600" /><button type="submit" disabled={!user || !newMessage.trim()} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"><Send className="w-5 h-5" /></button></form>
                    </div>
                  )}
                  {activeLayer === "L1" && (
                    <div className="space-y-6 text-sm text-sm">
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl"><div className="flex items-center gap-4 mb-8"><WalletIcon className="w-8 h-8 text-indigo-400" /><h3 className="text-2xl font-bold text-white tracking-tight uppercase">Chronos Wallet</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="p-8 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Coins className="w-24 h-24 text-indigo-500" /></div><p className="text-xs text-slate-500 uppercase font-black mb-2 tracking-widest text-sm">Available Balance</p><p className="text-4xl font-mono font-bold text-white">{wallet?.balance.toFixed(2) || "0.00"} <span className="text-indigo-500 text-sm">IXI</span></p></div><div className="p-8 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Zap className="w-24 h-24 text-purple-500" /></div><p className="text-xs text-slate-500 uppercase font-black mb-2 tracking-widest text-sm">Entropy Potential</p><p className="text-4xl font-mono font-bold text-white">{wallet?.entropy_potential.toFixed(0) || "0"}%</p></div></div></div>
                    </div>
                  )}
                  {activeLayer === "L0" && (
                    <div className="space-y-6 text-sm text-sm">
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl"><div className="flex items-center gap-4 mb-8"><Zap className="w-8 h-8 text-indigo-400" /><h3 className="text-2xl font-bold text-white tracking-tight uppercase">Quantum State Monitor</h3></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="p-6 rounded-2xl bg-black/40 border border-white/5"><p className="text-indigo-400 font-mono text-2xl">{(quantumState?.entropy || 0).toFixed(4)}</p><p className="text-[10px] text-slate-500 uppercase mt-2 font-bold">Entropy Level</p></div><div className="col-span-2 p-6 rounded-2xl bg-black/40 border border-white/5"><p className="text-white font-mono text-sm break-all">{quantumState?.key_fragment || "GENERATING..."}</p><p className="text-[10px] text-slate-500 uppercase mt-2 font-bold">QKD Key Fragment</p></div></div><button onClick={fetchQuantum} className="mt-8 px-8 py-3 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all uppercase tracking-widest">Resample Quantum Field</button></div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-8 text-sm">
                  <section className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Control Unit</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4"><div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-white">{generation}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Gen</p></div><div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-indigo-400">{population.length || 0}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Pop</p></div></div>
                      <button onClick={triggerLayerAction} disabled={isEvolving || !backendStatus.includes("Active")} className={cn("w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden", (isEvolving || !backendStatus.includes("Active")) ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-95")}>{isEvolving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 fill-current" /> Trigger Layer Action</>}</button>
                      <p className="text-[10px] text-center text-slate-500 animate-pulse italic">Auto-Evolution active: 30s cycle</p>
                    </div>
                  </section>
                  <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl flex flex-col h-[400px]">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2"><Terminal className="w-4 h-4 text-purple-500" /> System Logs</h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">{logs.map((log, i) => (<div key={i} className="flex gap-3 text-[10px] font-mono leading-relaxed"><span className="text-indigo-500 shrink-0">[{new Date().toLocaleTimeString([], {hour12:false})}]</span><span className={i === 0 ? "text-slate-200" : "text-slate-500"}>{log}</span></div>))}</div>
                  </section>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="h-12 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between px-8 text-[9px] text-slate-500 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-8"><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Quantum Secure</span><span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> L1 Sync: Active</span><span className="hidden md:flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Nodes: 12.4k</span></div>
          <div className="hidden sm:block font-bold text-indigo-500/50 uppercase">OMNIXIUS CORE v0.1.0-BETA</div>
        </footer>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <DnaModal organism={selectedOrganism} onClose={() => setSelectedOrganism(null)} />
    </div>
  );
}
