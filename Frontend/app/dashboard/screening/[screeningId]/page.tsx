'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
  ShieldAlert,
  ArrowLeft,
  Sliders,
  Sparkles,
  Printer,
} from 'lucide-react';
import { getScreeningResult, getAiExplanation } from '@/lib/api/screening';
import { ScreeningResult, DRGrade, AIExplanation } from '@/lib/api/types';

export default function ScreeningResultPage() {
  const pathname = usePathname();
  const screeningId = pathname.split('/').pop() || '';

  const router = useRouter();

  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'original' | 'split'>('split');
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadResult() {
      if (!screeningId) return;
      try {
        const data = await getScreeningResult(screeningId);
        setScreening(data);
        if (data?.prediction) {
          setAiLoading(true);
          const explanation = await getAiExplanation(screeningId);
          setAiExplanation(explanation);
          setAiLoading(false);
        }
      } catch (err) {
        console.error('Failed to load screening result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [screeningId]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading screening result & AI explanation...</p>
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Screening Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested screening assessment does not exist or was removed.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { imageQuality, prediction, risk } = screening;
  const isQualityGood = imageQuality.status === 'good';

  const drGrades: { grade: DRGrade; name: string; description: string }[] = [
    { grade: 0, name: 'No DR', description: 'No signs of retinopathy' },
    { grade: 1, name: 'Mild', description: 'Microaneurysms only' },
    { grade: 2, name: 'Moderate', description: 'Hemorrhages & exudates' },
    { grade: 3, name: 'Severe', description: 'Cotton wool spots & vascular changes' },
    { grade: 4, name: 'Proliferative', description: 'Neovascularization' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Patient Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Screening ID: {screening.screeningId}</span>
            <span>&bull;</span>
            <span>Date: {new Date(screening.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{screening.patientName}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-normal text-slate-600">
              {screening.patientId}
            </span>
          </h1>
          <p className="text-xs text-slate-600">
            {screening.patientAge} Yrs &bull; {screening.patientGender} &bull; Diabetes Duration: <strong>{screening.diabetesDurationYears} Years</strong> &bull; Examined: <strong className="uppercase text-teal-700">{screening.eye} Eye (OD/OS)</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/screening/new"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Screening</span>
          </Link>

          {isQualityGood && (
            <Link
              href={`/dashboard/reports/${screening.screeningId}`}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>View Report</span>
            </Link>
          )}
        </div>
      </div>

      {/* 1. IMAGE QUALITY ASSESSMENT CARD */}
      <div className={`p-6 rounded-2xl border ${isQualityGood ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'} shadow-xs space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isQualityGood ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Image Quality Assessment
              </div>
              <h2 className={`text-lg font-bold ${isQualityGood ? 'text-emerald-900' : 'text-rose-900'}`}>
                {isQualityGood ? 'SUITABLE FOR AI SCREENING ✓' : 'INSUFFICIENT QUALITY ✗'}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Quality Index</span>
            <span className={`text-xl font-extrabold ${isQualityGood ? 'text-emerald-700' : 'text-rose-700'}`}>
              {imageQuality.score} / 100
            </span>
          </div>
        </div>

        {/* Quality Check Items */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {Object.entries(imageQuality.checks).map(([key, val]) => (
            <div
              key={key}
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-1.5 capitalize font-medium ${
                val ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-white border-rose-200 text-rose-800'
              }`}
            >
              {val ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          ))}
        </div>

        <p className={`text-xs ${isQualityGood ? 'text-emerald-800' : 'text-rose-800'} font-medium`}>
          {imageQuality.message}
        </p>

        {!isQualityGood && (
          <div className="pt-2 flex items-center justify-between bg-white p-4 rounded-xl border border-rose-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-900 block">Quality Issues Detected:</span>
              <ul className="text-xs text-rose-700 list-disc list-inside">
                {imageQuality.issues?.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
            <Link
              href="/dashboard/screening/new"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0"
            >
              Upload Another Image
            </Link>
          </div>
        )}
      </div>

      {/* IF QUALITY IS GOOD, DISPLAY AI SCREENING RESULT & EXPLAINABLE AI */}
      {isQualityGood && prediction && (
        <>
          {/* 2. AI SCREENING RESULT CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  AI Screening Assessment
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {prediction.label}
                </h2>
                <p className="text-xs text-slate-600 mt-1">{prediction.description}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-center sm:text-right shrink-0">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  AI Confidence Level
                </span>
                <span className="text-2xl font-extrabold text-teal-700 font-mono">
                  {prediction.confidence}%
                </span>
              </div>
            </div>

            {/* DR Severity Scale 0 - 4 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>DR Severity Scale (ETDRS Standard)</span>
                <span>Class Predicted: Grade {prediction.grade}</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {drGrades.map((g) => {
                  const isSelected = g.grade === prediction.grade;
                  return (
                    <div
                      key={g.grade}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-500/30'
                          : 'bg-slate-50 text-slate-600 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="text-xs font-extrabold mb-1">Grade {g.grade}</div>
                      <div className="text-[11px] font-bold tracking-tight truncate">{g.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision Support Disclaimer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Clinical Decision Support Disclaimer:</strong> This AI screening result is intended for preliminary triage and decision support in primary healthcare settings. It does not replace a comprehensive clinical examination by a qualified ophthalmologist.
              </span>
            </div>
          </div>

          {/* 3. EXPLAINABLE AI / GRAD-CAM HEATMAP COMPARISON */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Explainable AI (Grad-CAM Heatmap Visualization)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual comparison showing regions that influenced the neural network prediction.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200 w-fit">
                <button
                  onClick={() => setActiveTab('split')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'split' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'original' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original Fundus
                </button>
                <button
                  onClick={() => setActiveTab('heatmap')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'heatmap' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grad-CAM Heatmap
                </button>
              </div>
            </div>

            {/* Visual Display */}
            {activeTab === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block text-center">Original Fundus Image</span>
                  <div className="bg-slate-900 rounded-xl overflow-hidden p-2 flex items-center justify-center h-72 border border-slate-200">
                    <img src={screening.imageUrl} alt="Original Fundus" className="max-h-68 object-contain rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block text-center">AI Grad-CAM Heatmap Overlay</span>
                  <div className="bg-slate-900 rounded-xl overflow-hidden p-2 flex items-center justify-center h-72 border border-slate-200">
                    <img src={screening.heatmapUrl || screening.imageUrl} alt="Grad-CAM Heatmap" className="max-h-68 object-contain rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'original' && (
              <div className="bg-slate-900 rounded-xl overflow-hidden p-4 flex items-center justify-center max-h-96 border border-slate-200">
                <img src={screening.imageUrl} alt="Original Fundus" className="max-h-88 object-contain rounded-lg" />
              </div>
            )}

            {activeTab === 'heatmap' && (
              <div className="bg-slate-900 rounded-xl overflow-hidden p-4 flex items-center justify-center max-h-96 border border-slate-200">
                <img src={screening.heatmapUrl || screening.imageUrl} alt="Grad-CAM Heatmap" className="max-h-88 object-contain rounded-lg" />
              </div>
            )}

            <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs text-teal-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Highlighted warm regions (red/yellow) indicate focal areas of high neural network activation that influenced the predicted DR severity score.
              </span>
            </div>
          </div>

          {/* 4. RISK CLASSIFICATION & REFERRAL RECOMMENDATION CARD */}
          {risk && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Screening Triage Classification
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {risk.level}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {risk.recommendation}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Recommended Timeframe</span>
                  <span className="text-sm font-bold text-amber-400">{risk.followUpTimeframe}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Action Required:</strong> {risk.actionRequired}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/dashboard/patients"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  &larr; Back to Patients
                </Link>

                <Link
                  href={`/dashboard/reports/${screening.screeningId}`}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate Printable Report</span>
                </Link>
              </div>
            </div>
          )}
          {/* 5. AI CLINICAL ASSISTANT / PATIENT EXPLANATION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>AI Clinical Assistant — Plain-Language Explanation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A patient-friendly summary to help explain the AI finding and next steps. Assistive only — it never overrides the clinical grade above.
                </p>
              </div>

              {aiExplanation && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  aiExplanation.source === 'llm'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {aiExplanation.source === 'llm' ? 'AI Generated' : 'Template Fallback'}
                </span>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            {aiLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-600 py-4">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Generating AI explanation...</span>
              </div>
            ) : aiExplanation ? (
              <>
                <div className="space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block">
                    Explanation
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">
                    {aiExplanation.explanation}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block">
                    Precautions & Next Steps
                  </span>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiExplanation.precautions.map((p, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {aiExplanation.source === 'fallback' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    A live AI model is not configured, so a deterministic template was used. Add a Gemini API key to enable generated explanations.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                The AI explanation could not be loaded for this screening.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
