import type { Metadata } from 'next';
import '../styles/globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'OMNIXIUS — Мультивселенная эволюции',
  description: 'Phoenix Engine Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
