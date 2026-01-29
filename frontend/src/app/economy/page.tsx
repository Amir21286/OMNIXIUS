'use client';

import { useAtom } from 'jotai';
import { authAtom } from '@/lib/auth';
import Wallet from '@/components/Wallet';
import Leaderboard from '@/components/Leaderboard';

export default function EconomyPage() {
  const [auth] = useAtom(authAtom);
  const userId = auth.user?.id?.toString() ?? '';

  if (!userId) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400">Войдите, чтобы видеть кошелёк и лидерборд.</p>
        <a href="/login" className="text-cyan-400 hover:underline mt-2 inline-block">Войти</a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Wallet userId={userId} />
      <Leaderboard />
    </div>
  );
}
