"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Lock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, username: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/register";
    
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        if (isLogin && data.token) {
          onSuccess(data.token, username);
          onClose();
        } else if (!isLogin) {
          setIsLogin(true);
          setError("Registration successful! Please login.");
        }
      }
    } catch (err) {
      setError("Server unreachable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 relative shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  OMNIXIUS Identity Protocol
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Username</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="Enter your alias"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "text-sm text-center font-medium",
                    error.includes("successful") ? "text-green-400" : "text-red-400"
                  )}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Register Now"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
