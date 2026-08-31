import PublicLayout from '@/components/public/PublicLayout';
import SectionHeading from '@/components/public/SectionHeading';
import CTAButton from '@/components/public/CTAButton';
import Reveal from '@/components/public/Reveal';
import HeroEye from '@/components/public/HeroEye';
import ProblemSolution from '@/components/public/ProblemSolution';
import AIDemoSequence from '@/components/public/AIDemoSequence';
import ImpactNumbers from '@/components/public/ImpactNumbers';
import NodeNetwork from '@/components/public/NodeNetwork';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  Users,
  Stethoscope,
  HeartPulse,
  Camera,
  BrainCircuit,
  BarChart3,
  ClipboardCheck,
  Send,
} from 'lucide-react';

/* ─── Trust Strip items ─── */
const TRUST = [
  { icon: Stethoscope, text: 'Designed for PHCs' },
  { icon: BrainCircuit, text: 'AI-Assisted' },
  { icon: Zap, text: 'Fast Screening' },
  { icon: Lock, text: 'Secure Patient Data' },
  { icon: ClipboardCheck, text: 'Human Review' },
  { icon: HeartPulse, text: 'Rural-Ready' },
];

/* ─── Problem cards (§1.4) ─── */
const PROBLEMS = [
  {
    icon: Users,
    title: 'Specialist Access',
    desc: 'Retinal specialists aren\'t available everywhere. (~1 ophthalmologist per 100,000 rural population.)',
  },
  {
    icon: Eye,
    title: 'Delayed Detection',
    desc: 'Damage often occurs before symptoms appear. By the time vision changes are noticed, intervention may be too late.',
  },
  {
    icon: ShieldCheck,
    title: 'Screening Bottleneck',
    desc: 'Manual screening can\'t scale to match demand. 77M+ diabetic adults in India need regular eye screening.',
  },
];

/* ─── Solution pipeline (§1.6) ─── */
const PIPELINE = [
  { icon: Camera, label: 'Capture', color: 'text-electric' },
  { icon: BrainCircuit, label: 'Analyze', color: 'text-vision' },
  { icon: BarChart3, label: 'Classify', color: 'text-honey' },
  { icon: ClipboardCheck, label: 'Review', color: 'text-electric' },
  { icon: Send, label: 'Refer', color: 'text-vision' },
];

/* ─── Who Benefits (§1.8) ─── */
const PERSONAS = [
  {
    icon: HeartPulse,
    role: 'Healthcare Worker',
    desc: 'Capture retinal image → Upload → Receive AI-assisted result',
    color: 'bg-electric/10 text-electric',
  },
  {
    icon: Stethoscope,
    role: 'Doctor',
    desc: 'Review → Interpret → Refer',
    color: 'bg-vision/10 text-vision',
  },
  {
    icon: Users,
    role: 'Patient',
    desc: 'Screen → Understand → Act Earlier',
    color: 'bg-honey/10 text-honey',
  },
];

export default function HomePage() {
  return (
    <PublicLayout>
      {/* ════════════════════════════════════════
          §1.2 HERO
          ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-navy pt-24 pb-16 sm:pt-32 sm:pb-24">
        {/* subtle gradient deco */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 50% at 50% 0%, #00C9B720 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6 text-center lg:text-left">
              <Reveal>
                <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                  See Diabetic Retinopathy Risk,{' '}
                  <span className="text-electric">Sooner</span>
                </h1>
              </Reveal>
              <Reveal delay={100}>
                <p className="mx-auto max-w-lg text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
                  AI-assisted retinal screening built for Primary Health Centres
                  — where specialists can&apos;t always reach.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <CTAButton href="/register" variant="primary">
                    Start Screening <ArrowRight className="h-4 w-4" />
                  </CTAButton>
                  <CTAButton href="/how-it-works" variant="secondary">
                    See How It Works
                  </CTAButton>
                </div>
              </Reveal>
            </div>
            <Reveal delay={300} className="flex justify-center">
              <HeroEye />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.3 TRUST STRIP
          ════════════════════════════════════════ */}
      <section className="border-b border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST.map((t) => (
              <Reveal key={t.text} className="flex items-center gap-2 text-sm text-ink-soft">
                <t.icon className="h-4 w-4 text-electric" />
                {t.text}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.4 THE PROBLEM
          ════════════════════════════════════════ */}
      <section className="bg-snow py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The Challenge"
            title="The Bottleneck Isn't Patients. It's Screening."
            lede="Millions of diabetic patients in rural India need regular eye screening — but the infrastructure to deliver it doesn't exist at scale."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-electric/30">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-electric/10 text-electric transition-colors group-hover:bg-electric group-hover:text-navy">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.5 PROBLEM → SOLUTION TRANSFORMATION
          ════════════════════════════════════════ */}
      <ProblemSolution />

      {/* ════════════════════════════════════════
          §1.6 SOLUTION PIPELINE
          ════════════════════════════════════════ */}
      <section className="bg-snow py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The Workflow"
            title="From Retinal Image to Actionable Insight"
          />
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-0">
            {PIPELINE.map((step, i) => (
              <Reveal key={step.label} delay={i * 120} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-electric/40 hover:shadow-md">
                    <step.icon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {step.label}
                  </span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.7 LIVE AI VISUALIZATION
          ════════════════════════════════════════ */}
      <section className="bg-navy py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Live Demo"
            title={
              <span className="text-white">See the AI in Action</span>
            }
            lede="This is an illustrated demonstration of the screening workflow. The actual system analyzes real retinal fundus images."
            className="[&_*]:text-white/70 [&_h2]:text-white"
          />
          <div className="mt-12">
            <AIDemoSequence mode="auto" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.8 WHO BENEFITS
          ════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Who Benefits"
            title="Built for Everyone in the Chain"
            lede="From the healthcare worker capturing the image to the patient receiving earlier care."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PERSONAS.map((p, i) => (
              <Reveal key={p.role} delay={i * 100}>
                <div className="rounded-2xl border border-slate-200 bg-snow p-6 text-center">
                  <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ${p.color}`}>
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">{p.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.9 RURAL HEALTHCARE NETWORK
          ════════════════════════════════════════ */}
      <section className="bg-snow py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Rural Healthcare"
            title="Built for Where Specialists Aren't"
            lede="Primary Health Centres are already closer to patients than any specialist ever will be. AI helps them screen effectively."
          />
          {/* India silhouette + PHC nodes — simplified visual */}
          <Reveal className="mx-auto mt-12 max-w-3xl">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-center gap-6 text-sm text-ink-soft">
                <span className="font-semibold text-electric">Village</span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
                <span className="font-semibold text-electric">PHC</span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
                <span className="font-semibold text-vision">District Hospital</span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
                <span className="font-semibold text-honey">Specialist</span>
              </div>
              <p className="mt-4 text-center text-xs text-ink-muted">
                AI screening at the PHC level connects rural patients to specialist care faster.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.10 IMPACT NUMBERS
          ════════════════════════════════════════ */}
      <ImpactNumbers />

      {/* ════════════════════════════════════════
          §1.11 FINAL CTA
          ════════════════════════════════════════ */}
      <section className="bg-navy-surface py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Make Early Eye Screening Part of Primary Care
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-base text-white/60">
              AI can help identify risk. Healthcare professionals make the decision.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/features" variant="primary">
                Explore the Platform
              </CTAButton>
              <CTAButton href="/how-it-works" variant="secondary">
                See How It Works
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          §1.12 PHC NETWORK WOW ELEMENT
          ════════════════════════════════════════ */}
      <NodeNetwork />
    </PublicLayout>
  );
}
