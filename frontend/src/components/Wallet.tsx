'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { l1Api, handleApiResponse } from '@/lib/api';
import type { Transaction } from '@/lib/types';
import { Wallet as WalletIcon, Send, History, TrendingUp } from 'lucide-react';

interface WalletProps {
  userId: string;
}

export default function Wallet({ userId }: WalletProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendError, setSendError] = useState('');
  const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [balanceData, transactionsData, leaderboardData] = await Promise.all([
        handleApiResponse(l1Api.getBalance(userId)),
        handleApiResponse(l1Api.getTransactions(userId, 10)),
        handleApiResponse(l1Api.getLeaderboard(10)),
      ]);
      setBalance(typeof balanceData === 'number' ? balanceData : 0);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    const amount = parseInt(sendAmount, 10);
    if (!amount || amount <= 0) {
      setSendError('Введите положительную сумму');
      return;
    }
    if (!sendTo.trim()) {
      setSendError('Введите ID получателя');
      return;
    }
    try {
      await handleApiResponse(l1Api.transferIXI(userId, sendTo.trim(), amount));
      setShowSendModal(false);
      setSendAmount('');
      setSendTo('');
      await loadWalletData();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Ошибка перевода');
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-8 animate-pulse">
        <div className="h-12 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-24 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <WalletIcon className="mr-2 text-cyan-400" />
          Кошелёк IXI
        </h2>
        <button onClick={() => setShowSendModal(true)} className="glow-button flex items-center space-x-2 py-2 px-4">
          <Send className="w-5 h-5" />
          <span>Перевести</span>
        </button>
      </div>

      <div className="mb-8">
        <p className="text-gray-400 text-sm mb-1">Баланс</p>
        <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          {balance} IXI
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Последние операции
        </h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет операций</p>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm">{tx.tx_type}: {tx.description}</span>
                <span className={tx.to_user_id === userId ? 'text-green-400' : 'text-red-400'}>
                  {tx.to_user_id === userId ? '+' : '-'}{tx.amount} IXI
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSendModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Перевод IXI</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID получателя</label>
                <input
                  type="text"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="user_id"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Сумма</label>
                <input
                  type="number"
                  min="1"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              {sendError && <p className="text-red-400 text-sm">{sendError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSendModal(false)} className="flex-1 py-2 border border-white/20 rounded-lg hover:bg-white/5">
                  Отмена
                </button>
                <button type="submit" className="flex-1 glow-button py-2">Отправить</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
