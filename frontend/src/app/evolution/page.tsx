'use client';

import { useAtom } from 'jotai';
import { authAtom } from '@/lib/auth';
import EvolutionPanel from '@/components/EvolutionPanel';

export default function EvolutionPage() {
  const [auth] = useAtom(authAtom);
  const userId = auth.user?.id?.toString() ?? '';

  if (!userId) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400">Войдите, чтобы управлять организмами.</p>
        <a href="/login" className="text-cyan-400 hover:underline mt-2 inline-block">Войти</a>
      </div>
    );
  }

  return <EvolutionPanel userId={userId} />;
}
