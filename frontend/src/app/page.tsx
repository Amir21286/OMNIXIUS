'use client';

import Link from 'next/link';
import { Brain, Gem, Users, Gamepad2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          OMNIXIUS
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Мультивселенная эволюции. Создавайте организмы, зарабатывайте IXI, развивайте сообщество.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { href: '/evolution', icon: Brain, label: 'Эволюция', desc: 'Лаборатория организмов' },
          { href: '/economy', icon: Gem, label: 'Экономика', desc: 'Кошелёк и IXI' },
          { href: '/login', icon: Users, label: 'Социальность', desc: 'Посты и подписки' },
          { href: '/game', icon: Gamepad2, label: 'Игра', desc: 'Игровой мир' },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="glass-card p-6 hover:border-purple-500/50 transition-colors block"
          >
            <Icon className="w-12 h-12 text-cyan-400 mb-3" />
            <h2 className="text-xl font-semibold mb-1">{label}</h2>
            <p className="text-sm text-gray-400">{desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
