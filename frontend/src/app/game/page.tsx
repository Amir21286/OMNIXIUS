'use client';

import GameCanvas from '@/components/GameCanvas';

export default function GamePage() {
  return (
    <div className="glass-card p-4 min-h-[500px]">
      <h2 className="text-xl font-semibold mb-4">Игровой мир</h2>
      <GameCanvas />
    </div>
  );
}
