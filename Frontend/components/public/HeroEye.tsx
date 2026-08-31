'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated hero eye (design.md §A.2). SVG stroke-dashoffset draw → retina →
 * scanning ring → detection markers → "AI ANALYSIS READY". Hidden hover
 * interaction reveals "AI CAN SEE MORE...".
 * Respects prefers-reduced-motion (shows final state).
 */
export default function HeroEye() {
  const [phase, setPhase] = useState<'draw' | 'retina' | 'scan' | 'detect' | 'ready'>('draw');
  const [hovered, setHovered] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase('ready');
      return;
    }
    const seq: typeof phase[] = ['draw', 'retina', 'scan', 'detect', 'ready'];
    const delays = [1200, 600, 1600, 1500, 0];
    let i = 0;
    const step = () => {
      if (i >= seq.length) return;
      setPhase(seq[i]);
      if (i < seq.length - 1) {
        timers.current.push(setTimeout(() => { i++; step(); }, delays[i]));
      }
    };
    timers.current.push(setTimeout(step, 400));
    const cleanup = [...timers.current];
    return () => cleanup.forEach(clearTimeout);
  }, []);

  const scanning = phase === 'scan' || phase === 'detect';
  const showMarkers = phase === 'detect' || phase === 'ready';
  const strokeColor = scanning ? '#4DE8FF' : '#F7FAFC';

  return (
    <div
      className="relative mx-auto aspect-[5/3] w-full max-w-lg select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="heroRetina" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1b3b4f" />
            <stop offset="100%" stopColor="#071A2B" />
          </radialGradient>
        </defs>
        {/* eye outline — draws itself */}
        <path
          d="M100 30 C 145 30, 185 60, 100 90 C 15 60, 55 30, 100 30 Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          className="scanner-draw"
        />
        {/* retina (appears after draw) */}
        {phase !== 'draw' && (
          <>
            <circle cx="100" cy="60" r="22" fill="url(#heroRetina)" stroke="#00C9B7" strokeWidth="2" />
            <circle cx="100" cy="60" r="9" fill="#4DE8FF" className={scanning ? 'animate-pulse-soft' : ''} />
          </>
        )}
        {/* detection markers */}
        {showMarkers && (
          <g>
            <circle cx="82" cy="50" r="4" fill="#FFCA6B" className="animate-blink" />
            <circle cx="118" cy="72" r="3.5" fill="#FFCA6B" className="animate-blink" style={{ animationDelay: '0.3s' }} />
            <circle cx="108" cy="46" r="3" fill="#FFCA6B" className="animate-blink" style={{ animationDelay: '0.6s' }} />
          </g>
        )}
      </svg>

      {/* scanning ring */}
      {scanning && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-electric animate-pulse-ring"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-vision animate-spin-slow"
          />
        </>
      )}

      {/* status label */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest transition-all duration-500 ${
          phase === 'ready'
            ? 'border-electric bg-electric/20 text-vision'
            : scanning
            ? 'border-honey/60 bg-honey/10 text-honey'
            : 'border-white/20 bg-white/5 text-white/70'
        }`}
        style={{ opacity: phase === 'draw' ? 0.5 : 1 }}
      >
        {phase === 'ready' ? '● AI ANALYSIS READY' : phase === 'draw' ? '● LOADING...' : scanning ? '◌ SCANNING...' : '● ...'}
      </div>

      {/* hover reveal */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-navy/80 transition-opacity duration-300 ${
          hovered ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <p className="px-6 text-center text-sm leading-relaxed text-white/90">
          <span className="font-semibold text-vision">AI CAN SEE MORE</span>
          <br />
          but healthcare professionals decide what happens next.
        </p>
      </div>
    </div>
  );
}
