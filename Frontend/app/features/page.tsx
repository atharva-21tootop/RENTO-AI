'use client';

import { useEffect, useState } from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import SectionHeading from '@/components/public/SectionHeading';
import CTAButton from '@/components/public/CTAButton';
import Reveal from '@/components/public/Reveal';
import RetinaScanner from '@/components/public/RetinaScanner';
import { ArrowRight, ShieldCheck, Activity, GitBranch, Clock, Lock, Eye } from 'lucide-react';

/* Image Analysis hover text cycle */
function ImageAnalysisCard() {
  const lines = ['Analyzing vessels...', 'Detecting anomalies...', 'Extracting features...', 'Classification complete.'];
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) { setIdx(0); return; }
    const iv = setInterval(() => setIdx((i) => (i + 1) % lines.length), 900);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  return (
    <div
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-vision/10 text-vision">
        <Eye className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">Image Analysis</h3>
      <p className="mt-2 text-sm text-ink-soft">Vessel detection, feature extraction, structural analysis.</p>
      <p className="mt-auto pt-3 h-5 text-xs font-medium text-vision transition-opacity">
        {hovered ? lines[idx] : '\u00A0'}
      </p>
    </div>
  );
}

/* Risk Classification gauge */
function RiskGauge() {
  const [angle, setAngle] = useState(-90);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setAngle(reduced ? 10 : 10), reduced ? 0 : 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 120 80" className="w-full max-w-[160px]" aria-hidden="true">
        <path d="M15 70 A45 45 0 0 1 105 70" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M15 70 A45 45 0 0 1 105 70"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="141"
          strokeDashoffset={141 - ((angle + 90) / 180) * 141}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00C9B7" />
            <stop offset="50%" stopColor="#FFCA6B" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex gap-4 text-[10px] font-semibold tracking-wider text-ink-muted">
        <span className="text-electric">LOW</span>
        <span className="text-honey">MODERATE</span>
        <span className="text-red-500">HIGH</span>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <PublicLayout>
      {/* §4.1 Hero */}
      <section className="relative overflow-hidden bg-navy pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #00C9B720 0%, transparent 70%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Everything Needed for AI-Assisted Retinal Screening
            </h1>
          </Reveal>
        </div>
      </section>

      {/* §4.2 Bento Grid */}
      <section className="bg-snow py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI-Assisted Screening — large card, spans 2 cols */}
            <Reveal className="sm:col-span-2 lg:col-span-2">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md sm:p-8">
                <div className="grid flex-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink sm:text-2xl">AI-Assisted Screening</h3>
                    <p className="mt-2 text-sm text-ink-soft sm:text-base">Retinal analysis that flags risk in seconds, not days.</p>
                  </div>
                  <div className="mx-auto w-full max-w-[240px] sm:mx-0 sm:w-[200px]">
                    <RetinaScanner />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* PHC-Ready */}
            <Reveal delay={50}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-electric/10 text-electric">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">PHC-Ready</h3>
                <p className="mt-2 text-sm text-ink-soft">Built for primary care, not specialist clinics.</p>
              </div>
            </Reveal>

            {/* Image Analysis — hover text cycle */}
            <Reveal delay={100}>
              <ImageAnalysisCard />
            </Reveal>

            {/* Risk Classification — animated gauge */}
            <Reveal delay={150}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-honey/10 text-honey">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Risk Classification</h3>
                <div className="mt-4 flex-1">
                  <RiskGauge />
                </div>
              </div>
            </Reveal>

            {/* Referral Workflow */}
            <Reveal delay={200}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-vision/10 text-vision">
                  <GitBranch className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Referral Workflow</h3>
                <p className="mt-2 text-sm text-ink-soft">PHC → Doctor → Specialist, without the wait.</p>
                {/* animated route line */}
                <div className="mt-auto flex items-center gap-1 pt-4 text-[10px] font-semibold text-ink-muted">
                  {['PHC', 'Doctor', 'Specialist'].map((n, i) => (
                    <span key={n} className="flex items-center gap-1">
                      <span className="rounded border border-slate-200 bg-snow px-2 py-1">{n}</span>
                      {i < 2 && <span className="text-electric">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Patient History — only backend-supported fields
                Backend: patient (name, age, gender, diabetes_type, diabetes_duration)
                screening (date, eye, grade, risk_level, recommendation) */}
            <Reveal delay={250}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-electric/10 text-electric">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Patient History</h3>
                <div className="mt-3 space-y-2 text-xs text-ink-soft">
                  {[
                    { date: '2026-03-15', result: 'Low Risk', eye: 'Right' },
                    { date: '2026-06-22', result: 'Moderate DR', eye: 'Left' },
                    { date: '2026-08-10', result: 'High Risk — Referred', eye: 'Right' },
                  ].map((s) => (
                    <div key={s.date} className="flex items-center justify-between rounded-lg bg-snow px-3 py-2">
                      <span className="font-mono text-ink">{s.date}</span>
                      <span className={`font-semibold ${s.result.includes('High') ? 'text-red-500' : s.result.includes('Moderate') ? 'text-honey' : 'text-electric'}`}>{s.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Secure Data Handling — NO compliance claims per pages.md */}
            <Reveal delay={300}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-navy/10 text-navy">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Secure Data Handling</h3>
                <p className="mt-2 text-sm text-ink-soft">Patient data stays protected, end to end.</p>
                <p className="mt-auto pt-3 text-[10px] text-ink-muted"> ponytail: no compliance claims (HIPAA/ISO) without real certification — upgrade when certified.</p>
              </div>
            </Reveal>

            {/* Explainable Results — shows actual model outputs, not lesion types
                Model outputs: DR grade (No DR / Mild / Moderate / Severe / Proliferative)
                + confidence score + Grad-CAM heatmap. Does NOT output individual lesion types. */}
            <Reveal delay={350}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-electric/30 hover:shadow-md">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-electric/10 text-electric">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Explainable Results</h3>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                    <span className="text-ink">DR Grade Classification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                    <span className="text-ink">Confidence Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                    <span className="text-ink">Grad-CAM Heatmap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                    <span className="text-ink">Risk-Level Recommendation</span>
                  </div>
                </div>
                <p className="mt-auto pt-3 text-[10px] text-ink-muted">Not &quot;Disease: YES&quot; — shows what the model actually outputs.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* §4.3 CTA */}
      <section className="bg-navy-surface py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              See How It All Fits Together
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/how-it-works" variant="primary">
                See How It Works <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton href="/contact" variant="secondary">
                Get in Touch
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
