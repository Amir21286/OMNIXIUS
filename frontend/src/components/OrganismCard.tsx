'use client';

import { motion } from 'framer-motion';
import type { Organism } from '@/lib/types';
import { DNA, Zap, TrendingUp, Heart } from 'lucide-react';

interface OrganismCardProps {
  organism: Organism;
  onEvolve?: (id: string) => void;
  onSelect?: (organism: Organism) => void;
}

export default function OrganismCard({ organism, onEvolve, onSelect }: OrganismCardProps) {
  const { traits } = organism;
  const color = `rgb(${traits.color.r}, ${traits.color.g}, ${traits.color.b})`;

  const handleEvolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEvolve) onEvolve(organism.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 cursor-pointer group"
      onClick={() => onSelect?.(organism)}
    >
      <div className="relative mb-4">
        <div
          className="w-20 h-20 mx-auto rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}40, ${color})`,
            boxShadow: `0 0 30px ${color}80`,
          }}
        />
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          Gen {organism.generation}
        </div>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-1">{organism.name}</h3>
        <p className="text-sm text-gray-400">ID: {organism.id.slice(0, 8)}...</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { Icon: Zap, label: 'Скорость', value: traits.speed * 20, color: 'bg-cyan-500' },
          { Icon: TrendingUp, label: 'Сила', value: traits.strength * 15, color: 'bg-green-500' },
          { Icon: DNA, label: 'Интеллект', value: traits.intelligence * 8, color: 'bg-purple-500' },
          { Icon: Heart, label: 'Фертильность', value: traits.fertility * 40, color: 'bg-pink-500' },
        ].map(({ Icon, label, value, color }) => (
          <div key={label} className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, value)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-gray-400">Здоровье</p>
          <div className="h-2 w-16 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${organism.health}%` }} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Энергия</p>
          <div className="h-2 w-16 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${organism.energy}%` }} />
          </div>
        </div>
      </div>

      {onEvolve && (
        <button onClick={handleEvolve} className="w-full glow-button flex items-center justify-center space-x-2">
          <DNA className="w-5 h-5" />
          <span>Эволюционировать</span>
        </button>
      )}
    </motion.div>
  );
}
