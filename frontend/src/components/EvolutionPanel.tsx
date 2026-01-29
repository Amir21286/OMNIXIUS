'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { l3Api, handleApiResponse } from '@/lib/api';
import type { Organism, EvolutionResult } from '@/lib/types';
import OrganismCard from './OrganismCard';
import { DNA, Plus, RefreshCw } from 'lucide-react';

interface EvolutionPanelProps {
  userId: string;
}

export default function EvolutionPanel({ userId }: EvolutionPanelProps) {
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [selectedOrganism, setSelectedOrganism] = useState<Organism | null>(null);
  const [evolutionResult, setEvolutionResult] = useState<EvolutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvolving, setIsEvolving] = useState(false);
  const [newOrganismName, setNewOrganismName] = useState('');

  useEffect(() => {
    loadOrganisms();
  }, [userId]);

  const loadOrganisms = async () => {
    setIsLoading(true);
    try {
      const list = await handleApiResponse(l3Api.getUserOrganisms(userId));
      setOrganisms(Array.isArray(list) ? list : []);
      if (list.length > 0 && !selectedOrganism) setSelectedOrganism(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganism = async () => {
    if (!newOrganismName.trim()) return;
    try {
      const organism = await handleApiResponse(l3Api.createOrganism(userId, newOrganismName));
      setOrganisms((prev) => [...prev, organism]);
      setSelectedOrganism(organism);
      setNewOrganismName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEvolve = async () => {
    if (!selectedOrganism) return;
    setIsEvolving(true);
    try {
      const result = await handleApiResponse(l3Api.evolveOrganism(selectedOrganism.id));
      setEvolutionResult(result);
      await loadOrganisms();
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvolving(false);
    }
  };

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <DNA className="mr-3 text-purple-500" />
            Лаборатория эволюции
          </h2>
          <p className="text-gray-400">Создавайте и развивайте организмы</p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadOrganisms}
            className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOrganismName}
              onChange={(e) => setNewOrganismName(e.target.value)}
              placeholder="Имя нового организма"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 w-48"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOrganism()}
            />
            <button onClick={handleCreateOrganism} className="p-3 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg hover:opacity-90">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Ваши организмы ({organisms.length})</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse h-64" />
              ))}
            </div>
          ) : organisms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {organisms.map((org) => (
                  <OrganismCard
                    key={org.id}
                    organism={org}
                    onEvolve={handleEvolve}
                    onSelect={setSelectedOrganism}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <DNA className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">У вас пока нет организмов</p>
              <p className="text-sm text-gray-500">Создайте организм выше</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedOrganism && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Выбранный организм</h3>
              <div className="space-y-2">
                <p><span className="text-gray-400">Имя:</span> {selectedOrganism.name}</p>
                <p><span className="text-gray-400">Поколение:</span> Gen {selectedOrganism.generation}</p>
              </div>
              <button
                onClick={handleEvolve}
                disabled={isEvolving}
                className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 ${isEvolving ? 'bg-gray-700 cursor-not-allowed' : 'glow-button'}`}
              >
                {isEvolving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Эволюция...</span>
                  </>
                ) : (
                  <>
                    <DNA className="w-5 h-5" />
                    <span>Эволюционировать</span>
                  </>
                )}
              </button>
            </div>
          )}

          {evolutionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-green-500/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-green-400">Эволюция успешна</h3>
              <div className="space-y-3">
                {evolutionResult.mutations.map((m, i) => (
                  <div
                    key={i}
                    className={`flex justify-between p-2 rounded ${m.is_beneficial ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                  >
                    <span>{m.trait_name}</span>
                    <span className={m.is_beneficial ? 'text-green-400' : 'text-red-400'}>
                      {m.change > 0 ? '+' : ''}{m.change.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => setEvolutionResult(null)} className="w-full mt-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">
                Закрыть
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
