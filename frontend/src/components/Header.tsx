'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAtom } from 'jotai';
import { Home, Gem, Brain, Gamepad2, User, LogOut } from 'lucide-react';
import { authAtom, logout } from '@/lib/auth';

export default function Header() {
  const [auth, setAuth] = useAtom(authAtom);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth((prev) => ({ ...prev, user, token, isLoading: false }));
      } catch {
        setAuth((prev) => ({ ...prev, user: null, token: null, isLoading: false }));
      }
    } else {
      setAuth((prev) => ({ ...prev, isLoading: false }));
    }
  }, [setAuth]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 glass-card mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                OMNIXIUS
              </h1>
              <p className="text-xs text-gray-400">Мультивселенная эволюции</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 hover:text-cyan-400 transition-colors">
              <Home className="w-5 h-5" />
              <span>Главная</span>
            </Link>
            <Link href="/evolution" className="flex items-center space-x-2 hover:text-cyan-400 transition-colors">
              <Brain className="w-5 h-5" />
              <span>Эволюция</span>
            </Link>
            <Link href="/economy" className="flex items-center space-x-2 hover:text-cyan-400 transition-colors">
              <Gem className="w-5 h-5" />
              <span>Экономика</span>
            </Link>
            <Link href="/game" className="flex items-center space-x-2 hover:text-cyan-400 transition-colors">
              <Gamepad2 className="w-5 h-5" />
              <span>Игра</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {auth.user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="font-semibold">{auth.user.username}</p>
                    <p className="text-sm text-gray-400">{auth.user.reputation} репутация</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Выйти">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link href="/login" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Войти
                </Link>
                <Link href="/register" className="px-4 py-2 border border-purple-500 rounded-lg font-semibold hover:bg-purple-500/10 transition-colors">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
