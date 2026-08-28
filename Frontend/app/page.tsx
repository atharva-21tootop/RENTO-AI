import { auth } from '@/auth';
import Link from 'next/link';
import {
  Eye,
  Building2,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  Users,
  Activity,
  FileText,
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-teal-600 selection:text-white">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight block">
                Retino<span className="text-teal-600">Care</span> PHC
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Smart India Hackathon MVP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to PHC Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Healthcare Worker Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
                >
                  Register PHC Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider border border-teal-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Smart India Hackathon &bull; AI Rural Healthcare Solution</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            AI-Powered Diabetic Retinopathy <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-emerald-600 to-indigo-700">
              Screening System for PHCs
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Empowering Primary Health Centre (PHC) healthcare workers in rural India to perform early Diabetic Retinopathy screening, image quality validation, Grad-CAM neural network visual explainability, and automated specialist referral recommendations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-teal-600/20"
              >
                <span>Access PHC Screening Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-teal-600/20"
                >
                  <span>Start DR Screening Workflow</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-base rounded-xl border border-slate-200 transition-all shadow-xs"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 4 Clinical Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Fundus Image Upload</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drag-and-drop retinal fundus image upload with instant format and size validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Quality Assessment</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated blur, contrast, and illumination check to flag ungradable images early.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Grad-CAM Heatmaps</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explainable AI heatmap overlays showing retinal regions influencing AI predictions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Printable Reports</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official PHC screening report generation with risk triage & specialist referral cards.
            </p>
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div className="mt-16 text-center">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4">
            REST API Ready & Protected NextAuth Infrastructure
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'Next.js 15 App Router',
              'TypeScript',
              'Tailwind CSS',
              'NextAuth v5 Auth',
              'MongoDB Atlas',
              'REST Service Abstraction',
            ].map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        Smart India Hackathon MVP &bull; Diabetic Retinopathy Early Screening & Triage System for Rural PHCs
      </footer>
    </div>
  );
}
