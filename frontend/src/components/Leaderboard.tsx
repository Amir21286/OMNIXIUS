'use client';

import { useState, useEffect } from 'react';
import { l1Api, handleApiResponse } from '@/lib/api';
import { TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [entries, setEntries] = useState<[string, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await handleApiResponse(l1Api.getLeaderboard(20));
        setEntries(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="mr-2 text-yellow-500" />
          Лидерборд
        </h2>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <TrendingUp className="mr-2 text-yellow-500" />
        Лидерборд по балансу IXI
      </h2>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-gray-500">Пока нет данных</p>
        ) : (
          entries.map(([userId, balance], index) => (
            <div
              key={userId}
              className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <span className="text-gray-500 w-6">#{index + 1}</span>
                <span className="font-mono text-sm">{userId}</span>
              </span>
              <span className="font-semibold text-cyan-400">{balance} IXI</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
