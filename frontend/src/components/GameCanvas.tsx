'use client';

import { useRef, useEffect, useState } from 'react';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 400 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, 'rgba(88, 28, 135, 0.3)');
    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
    gradient.addColorStop(1, 'rgba(88, 28, 135, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Игровой мир — скоро', w / 2, h / 2 + 60);
  }, [size]);

  useEffect(() => {
    const onResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setSize({ w: Math.min(800, rect.width - 32), h: 400 });
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size.w}
      height={size.h}
      className="w-full max-w-full rounded-lg border border-white/10"
      style={{ maxHeight: 400 }}
    />
  );
}
