"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dna, Zap, Database, Activity, ShieldCheck, Cpu, ChevronRight,
  RefreshCw, Globe, User as UserIcon, LogOut, Layers, Atom,
  Link as LinkIcon, Brain, Users, Radio, Stars, Menu, X, Sparkles, TrendingUp,
  Wallet as WalletIcon, Coins, Trophy, Medal, Crown, Send, Battery, ArrowRight,
  BarChart3, GraduationCap, Briefcase, Play, Trophy as SportIcon, Heart, Terminal,
  CheckCircle2, Plus, Search as SearchIcon, Volume2, VolumeX, Mic2, Landmark,
  ArrowUpRight, AlertTriangle, Map as MapIcon, Target, Rocket, Gamepad2
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
const DayMohkGame = dynamic(() => import("@/components/DayMohkGame"), { ssr: false });

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
interface Asset { id: string; name: string; price: number; volatility: number; }
interface Investment { asset_id: string; amount: number; entry_price: number; }
interface UserData { subscriptions: string[]; courses: string[]; investments: Investment[]; }
interface GlobalEvent { event_type: string; intensity: number; message: string; expires_at: number; }
interface Quest { id: number; title: string; description: string; reward_ixi: number; category: string; is_completed: boolean; }
interface GeoLocation { id: string; name: string; lat: number; lng: number; altitude: number; category: string; population: number; local_energy: number; deployed_organisms: number[]; }

type LayerID = "L-1" | "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "GAMES";

// --- Sound Engine ---
const playSound = (type: 'click' | 'success' | 'error' | 'evolve') => {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  if (type === 'click') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'success') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'evolve') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
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
  const [currentEvent, setCurrentEvent] = useState<GlobalEvent | null>(null);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [userData, setUserData] = useState<UserData>({ subscriptions: [], courses: [], investments: [] });
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
    { id: "GAMES", name: "Games", icon: Gamepad2, desc: "Homeland Metaverse", color: "text-red-500" },
  ];

  const reportActivity = async (type: 'click' | 'invest' | 'subscribe' | 'chat' | 'view_ad') => {
    if (!user) return;
    try {
      await fetch("http://localhost:4000/api/energy/report-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, activity_type: type, human_token: "human_verified_v1" }),
      });
    } catch (e) {}
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/status");
      const data = await res.json();
      setBackendStatus(`${data.status} (${data.version})`);
      if (data.current_event.event_type !== "Normal" && (!currentEvent || currentEvent.expires_at !== data.current_event.expires_at)) {
        toast.warning(data.current_event.message, { icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, duration: 5000 });
      }
      setCurrentEvent(data.current_event);
      if (data.generation > lastGenRef.current) {
        if (lastGenRef.current !== 0 && !isMuted) playSound('evolve');
        lastGenRef.current = data.generation;
      }
      setGeneration(data.generation); setPopulation(data.population); setHistory(data.history); setEnergy(data.energy);
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
      const [mRes, cRes, aRes, qRes] = await Promise.all([
        fetch("http://localhost:4000/api/noosphere/markets"),
        fetch("http://localhost:4000/api/noosphere/courses"),
        fetch("http://localhost:4000/api/noosphere/assets"),
        fetch("http://localhost:4000/api/noosphere/quests")
      ]);
      setMarkets(await mRes.json()); setCourses(await cRes.json()); setAssets(await aRes.json()); setQuests(await qRes.json());
      if (user) fetchUserData();
    } catch (e) {}
  };

  const fetchOikoumeneData = async () => {
    try {
      const bRes = await fetch("http://localhost:4000/api/oikoumene/bloggers");
      setBloggers(await bRes.json()); fetchLeaderboard();
      if (user) fetchUserData();
    } catch (e) {}
  };

  const fetchAstraData = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/astra/map");
      const data = await res.json();
      setGeoLocations(data);
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
        const sorted = data.Ok.reverse(); setMessages(sorted);
        const lastMsg = sorted[sorted.length - 1];
        if (lastMsg && lastMsg.id > lastMsgIdRef.current) {
          if (lastMsgIdRef.current !== 0 && lastMsg.username !== user?.username && !isMuted) playSound('click');
          lastMsgIdRef.current = lastMsg.id;
        }
      }
    } catch (e) {}
  };

  const handleInvest = async (assetId: string, amount: number) => {
    if (!user) return toast.error("Identity Required");
    try {
      const res = await fetch("http://localhost:4000/api/noosphere/invest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, asset_id: assetId, amount }),
      });
      const data = await res.json();
      if (data.Ok) {
        if (!isMuted) playSound('success');
        toast.success("Investment Successful");
        fetchWallet(); fetchUserData();
      }
    } catch (e) {}
  };

  const handleConvertEnergy = async () => {
    if (!user) return toast.error("Identity Required");
    if (!energy || energy.total_energy < 50) return toast.error("Insufficient Energy");
    try {
      const res = await fetch("http://localhost:4000/api/energy/convert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, amount: 50.0 }),
      });
      const data = await res.json();
      if (data.Ok) { if (!isMuted) playSound('success'); fetchWallet(); fetchStatus(); }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => { fetchStatus(); fetchMessages(); }, 5000);
    if (user) { fetchWallet(); fetchUserData(); }
    if (activeLayer === "L2") fetchNoosphereData();
    if (activeLayer === "L4") fetchOikoumeneData();
    if (activeLayer === "L5") fetchMessages();
    if (activeLayer === "GAMES") fetchAstraData();
    const savedUser = localStorage.getItem("omnixius_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    return () => clearInterval(interval);
  }, [activeLayer, user?.username]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    if (!isMuted) playSound('click');
    try {
      await fetch("http://localhost:4000/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, content: newMessage }),
      });
      setNewMessage(""); fetchMessages();
    } catch (e) {}
  };

  const handleSubscribe = async (blogger: string) => {
    if (!user) return toast.error("Identity Required");
    const isSubscribed = userData.subscriptions.includes(blogger);
    const endpoint = isSubscribed ? "/api/oikoumene/unsubscribe" : "/api/oikoumene/subscribe";
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, target: blogger }),
      });
      const data = await res.json();
      if (data.Ok !== undefined) { fetchUserData(); }
    } catch (e) {}
  };

  const handleBuyCourse = async (course: string) => {
    if (!user) return toast.error("Identity Required");
    try {
      const res = await fetch(`http://localhost:4000/api/noosphere/buy-course`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, target: course }),
      });
      const data = await res.json();
      if (data.Ok) { if (!isMuted) playSound('success'); fetchWallet(); fetchUserData(); }
    } catch (e) {}
  };

  const fetchQuantum = async () => { if (!isMuted) playSound('click'); try { const res = await fetch("http://localhost:4000/api/quantum"); const data = await res.json(); setQuantumState(data); } catch (e) {} };
  const fetchOracle = async () => { if (!isMuted) playSound('click'); try { const res = await fetch("http://localhost:4000/api/oracle"); const data = await res.json(); setOracleAdvice(data); if (data.content) speakOracle(data.content); } catch (e) {} };
  const speakOracle = (text: string) => { if (isMuted || typeof window === 'undefined') return; const utterance = new SpeechSynthesisUtterance(text); utterance.pitch = 0.5; utterance.rate = 0.8; window.speechSynthesis.speak(utterance); };

  const runEvolution = async () => {
    if (isEvolving) return; if (!isMuted) playSound('click'); setIsEvolving(true);
    try {
      const res = await fetch("http://localhost:4000/api/evolve", { method: "POST", headers: user ? { "Authorization": `Bearer ${user.token}` } : {} });
      const data = await res.json(); setGeneration(data.generation); setPopulation(data.population); setHistory(data.history);
      if (data.new_balance) setWallet(prev => prev ? { ...prev, balance: data.new_balance } : null);
      if (!isMuted) playSound('success');
    } catch (e) {} finally { setIsEvolving(false); }
  };

  const triggerLayerAction = () => {
    if (activeLayer === "L3") runEvolution(); else if (activeLayer === "L0") fetchQuantum();
    else if (activeLayer === "L2") fetchNoosphereData(); else if (activeLayer === "L4") fetchOikoumeneData();
    else if (activeLayer === "L5") fetchMessages();
  };

  const handleAuthSuccess = (token: string, username: string) => { if (!isMuted) playSound('success'); const newUser = { token, username }; setUser(newUser); localStorage.setItem("omnixius_user", JSON.stringify(newUser)); fetchWallet(); fetchUserData(); toast.success(`Welcome, ${username}`); };
  const handleLogout = () => { if (!isMuted) playSound('click'); setUser(null); setWallet(null); setUserData({ subscriptions: [], courses: [], investments: [] }); localStorage.removeItem("omnixius_user"); toast.info("Logged out"); };

  const filteredResults = { organisms: population.filter(o => o.id.toString().includes(searchQuery)), bloggers: bloggers.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())), courses: courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) };
  const hasSearchResults = searchQuery.length > 0 && (filteredResults.organisms.length > 0 || filteredResults.bloggers.length > 0 || filteredResults.courses.length > 0);

  if (!isEntered) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 z-0 opacity-40"><UniverseMap /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-1" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-6xl px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-8"><Layers className="text-white w-10 h-10" /></div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase tracking-tighter">OMNIXIUS</h1>
          <p className="text-sm md:text-base text-slate-400 font-bold mb-16 tracking-[0.4em] uppercase">Evolutionary Multiverse Portal</p>
          
          {/* Ad/Startup Banner - Promoting Day-Mohk */}
          <div className="mb-12 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex items-center justify-between gap-8 max-w-2xl mx-auto">
            <div className="text-left">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Featured Startup</p>
              <h3 className="text-xl font-bold text-white uppercase">DAY-MOHK: THE METAVERSE</h3>
              <p className="text-xs text-slate-400">Explore the digital twin of the Caucasus. Coming soon.</p>
            </div>
            <button onClick={() => { if (!isMuted) playSound('click'); setActiveLayer("GAMES"); setIsEntered(true); }} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all whitespace-nowrap">PREVIEW NOW</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-16 px-4">
            {layers.slice(0, 5).map((l) => (
              <motion.button key={l.id} whileHover={{ scale: 1.05, y: -10 }} onClick={() => { if (!isMuted) playSound('click'); setActiveLayer(l.id as LayerID); setIsEntered(true); }} className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl transition-all hover:border-indigo-500/50 hover:bg-white/10 text-center flex flex-col items-center">
                <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110", l.color)}><l.icon className="w-8 h-8" /></div>
                <h3 className="text-lg font-black tracking-tight mb-2 uppercase">{l.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{l.desc}</p>
              </motion.button>
            ))}
          </div>
          <button onClick={() => { if (!isMuted) playSound('click'); setIsEntered(true); }} className="group relative px-12 py-6 bg-white text-black font-black text-lg rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] active:scale-95 overflow-hidden"><span className="relative z-10 flex items-center gap-3 uppercase font-black">Enter Multiverse <ArrowRight className="group-hover:translate-x-2 transition-transform" /></span></button>
        </motion.div>
        <footer className="absolute bottom-8 left-0 right-0 z-10 text-center flex flex-col items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">{isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />}</button>
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-bold">Architectural Portal // v0.1.0-BETA</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex overflow-hidden text-sm">
      <ParticleBackground />
      <motion.aside animate={{ width: isSidebarOpen ? 280 : 80 }} className="relative z-30 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col transition-all text-sm font-black">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => { if (!isMuted) playSound('click'); setIsEntered(false); }}>
            <div className="min-w-[40px] h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Layers className="text-white w-5 h-5" /></div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-white uppercase tracking-tighter">OMNIXIUS</span>}
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
        <div className="p-4 border-t border-white/5"><button onClick={() => { if (!isMuted) playSound('click'); setIsSidebarOpen(!isSidebarOpen); }} className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500">{isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button></div>
      </motion.aside>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden text-sm text-sm">
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase">{layers.find(l => l.id === activeLayer)?.name} <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-slate-500 font-mono uppercase">{activeLayer} System</span></h2>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all">{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}</button>
            {wallet && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-indigo-400" /><span className="font-mono font-bold text-white">{wallet.balance.toFixed(1)} <span className="text-indigo-400 text-[10px]">IXI</span></span></div>
                <div className="w-px h-4 bg-white/10" /><div className="flex items-center gap-2"><Zap className="w-3 h-3 text-purple-400" /><span className="font-mono text-xs text-slate-400">{wallet.entropy_potential.toFixed(0)}%</span></div>
              </motion.div>
            )}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-full bg-black/40", backendStatus.includes("Active") ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400")}><div className={cn("w-1.5 h-1.5 rounded-full", backendStatus.includes("Active") ? "bg-green-500 animate-pulse" : "bg-red-500")} /><span className="text-[10px] font-bold uppercase tracking-tighter">{backendStatus}</span></div>
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-white/10"><div className="text-right hidden sm:block"><p className="text-xs font-bold text-white">{user.username}</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Level 1 Hacker</p></div><button onClick={handleLogout} className="p-2 hover:bg-red-500/10 rounded-full text-slate-500 hover:text-red-400 transition-all"><LogOut className="w-4 h-4" /></button></div>
            ) : <button onClick={() => { if (!isMuted) playSound('click'); setIsAuthOpen(true); }} className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-white/10 font-black">Connect Identity</button>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeLayer} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-sm">
                <div className="lg:col-span-12 space-y-8">
                  {activeLayer === "GAMES" && (
                    <div className="h-[calc(100vh-160px)] w-full">
                      <DayMohkGame onExit={() => setActiveLayer("L3")} />
                    </div>
                  )}
                  {activeLayer === "L3" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 space-y-8 text-sm">
                        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-black"><TrendingUp className="w-4 h-4 text-indigo-500" /> Evolutionary Progress</h3><div className="h-[240px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs><linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} /><XAxis dataKey="generation" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#818cf8', fontSize: '12px' }} /><Area type="monotone" dataKey="best_fitness" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBest)" /></AreaChart></ResponsiveContainer></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{population.sort((a,b) => b.fitness - a.fitness).map((org) => (<motion.div layout key={org.id} onClick={() => { if (!isMuted) playSound('click'); setSelectedOrganism(org); }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-indigo-400 font-mono text-[10px]">#{org.id}</div><div><p className="text-sm font-bold text-white uppercase">Organism {org.id}</p><p className="text-[10px] text-slate-500 font-mono">DNA Active</p></div></div><div className="text-right"><p className="text-lg font-mono text-white">{org.fitness.toFixed(2)}</p><p className="text-[10px] text-slate-500 uppercase font-black text-sm">Fitness</p></div></div><div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div animate={{ width: `${(org.fitness / 20) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div></motion.div>))}</div>
                      </div>
                      <div className="lg:col-span-4 space-y-8 text-sm text-sm">
                        <section className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-2xl"><h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Control Unit</h2><div className="space-y-6"><div className="grid grid-cols-2 gap-4"><div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-white">{generation}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Gen</p></div><div className="p-4 rounded-2xl bg-black/40 border border-white/5"><p className="text-2xl font-bold text-indigo-400">{population.length || 0}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Pop</p></div></div><button onClick={triggerLayerAction} disabled={isEvolving || !backendStatus.includes("Active")} className={cn("w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden", (isEvolving || !backendStatus.includes("Active")) ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-95 uppercase font-black")}>{isEvolving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 fill-current" /> Trigger Evolution</>}</button></div></section>
                        <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl flex flex-col h-[400px]"><h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2 font-black"><Terminal className="w-4 h-4 text-purple-500" /> System Logs</h2><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">{logs.map((log, i) => (<div key={i} className="flex gap-3 text-[10px] font-mono leading-relaxed"><span className="text-indigo-500 shrink-0">[{new Date().toLocaleTimeString([], {hour12:false})}]</span><span className={i === 0 ? "text-slate-200" : "text-slate-500"}>{log}</span></div>))}</div></section>
                      </div>
                    </div>
                  )}
                  {activeLayer === "L2" && (
                    <div className="space-y-8 text-sm">
                      <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden text-sm"><div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-32 h-32 text-purple-500" /></div><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-4"><Sparkles className="w-8 h-8 text-purple-400" /><h3 className="text-2xl font-bold text-white tracking-tight uppercase font-black">Noosphere Oracle</h3></div><button onClick={fetchOracle} className="p-3 bg-purple-600 rounded-2xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"><Mic2 className="w-5 h-5 text-white" /></button></div><div className="min-h-[120px] flex flex-col justify-center"><p className="text-xl text-slate-300 italic font-serif leading-relaxed">"{oracleAdvice?.content || "Connecting to collective mind..."}"</p><p className="text-sm text-purple-400 mt-4 font-bold">— {oracleAdvice?.author || "Oracle"}</p></div></div>
                      <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-sm text-sm"><h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-tighter font-black"><Target className="w-6 h-6 text-green-400" /> Human Ascension Quests</h3><div className="space-y-4">{quests.map(q => (<div key={q.id} className="p-6 rounded-3xl bg-black/40 border border-white/5 flex justify-between items-center group hover:border-green-500/30 transition-all"><div className="flex items-center gap-6"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", q.is_completed ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-slate-500")}>{q.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}</div><div><p className="font-bold text-white uppercase">{q.title}</p><p className="text-xs text-slate-500">{q.description}</p></div></div><div className="text-right"><p className="text-lg font-mono font-bold text-indigo-400">+{q.reward_ixi} IXI</p><p className="text-[10px] text-slate-600 uppercase font-black">{q.category}</p></div></div>))}</div></div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="h-12 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between px-8 text-[9px] text-slate-500 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-8"><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Quantum Secure</span><span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> L1 Sync: Active</span><span className="hidden md:flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Nodes: 12.4k</span></div>
          <div className="hidden sm:block font-bold text-indigo-500/50 uppercase tracking-tighter">OMNIXIUS CORE v0.1.0-BETA</div>
        </footer>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <DnaModal organism={selectedOrganism} onClose={() => setSelectedOrganism(null)} />
    </div>
  );
}
