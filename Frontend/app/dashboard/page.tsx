'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Search,
  Building2,
  Calendar,
} from 'lucide-react';
import { getScreeningHistory } from '@/lib/api/screening';
import { fetchReportsSummary, fetchScreenings } from '@/lib/api/backendClient';
import { getPHCProfile } from '@/lib/api/phc';
import { ScreeningResult, PHCProfile } from '@/lib/api/types';

export default function PHCDashboardPage() {
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [summary, setSummary] = useState<{
    totalScreenings: number;
    completedScreenings: number;
    qualityFailedScreenings: number;
    gradeDistribution: Record<string, number>;
    riskDistribution: Record<string, number>;
  } | null>(null);
  const [phc, setPHC] = useState<PHCProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, screeningsData, phcData] = await Promise.all([
          fetchReportsSummary(),
          fetchScreenings({ limit: 10 }),
          getPHCProfile(),
        ]);
        setSummary(summaryData);
        setScreenings(screeningsData.items);
        setPHC(phcData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredScreenings = screenings.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.screeningId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalScreened = summary?.totalScreenings ?? screenings.length;
  const noDrCount = summary?.gradeDistribution?.['0'] ?? screenings.filter((s) => s.prediction?.grade === 0).length;
  const atRiskCount =
    (summary?.riskDistribution?.['high'] ?? 0) + (summary?.riskDistribution?.['urgent'] ?? 0) ||
    screenings.filter((s) => s.risk?.level === 'HIGH RISK' || s.risk?.level === 'URGENT').length;
  const referralCount = atRiskCount;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-medium border border-white/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>{phc?.name || 'Alandi Rural Primary Health Centre'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Diabetic Retinopathy Screening
          </h1>
          <p className="text-teal-100 text-sm max-w-xl leading-relaxed">
            AI-assisted early detection & triage for diabetic patients in rural healthcare centres.
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/screening/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-teal-900 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition-all"
          >
            <PlusCircle className="w-5 h-5 text-teal-700" />
            <span>+ New Patient Screening</span>
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs animate-pulse">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-7 w-14 bg-slate-100 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
            ))
          : (
            <>
              {/* Total Screened */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Screened
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">{totalScreened}</div>
                  <span className="text-xs text-slate-500">Patients evaluated</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* No DR (Normal) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    No DR (Normal)
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600">{noDrCount}</div>
                  <span className="text-xs text-slate-500">Annual routine follow-up</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* At Risk */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    At Risk (DR Detected)
                  </span>
                  <div className="text-2xl font-extrabold text-amber-600">{atRiskCount}</div>
                  <span className="text-xs text-slate-500">Moderate / Severe DR</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              {/* Specialist Referrals */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Specialist Referrals
                  </span>
                  <div className="text-2xl font-extrabold text-rose-600">{referralCount}</div>
                  <span className="text-xs text-slate-500">Referred to District Hospital</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            </>
          )}
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search recent screenings by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients/register"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Register New Patient</span>
          </Link>
          <Link
            href="/dashboard/screenings"
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </Link>
        </div>
      </div>

      {/* Recent Screenings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>Recent Screening Assessments</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredScreenings.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading PHC screening records...</p>
          </div>
        ) : filteredScreenings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Eye className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No screening records found</p>
            <p className="text-xs text-slate-500">Start by registering a patient or creating a new screening.</p>
            <Link
              href="/dashboard/screening/new"
              className="inline-block mt-2 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg"
            >
              + Start First Screening
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Patient ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Eye</th>
                  <th className="py-3.5 px-4">AI DR Screening</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScreenings.map((s) => {
                  const isHighRisk = s.risk?.level === 'HIGH RISK' || s.risk?.level === 'URGENT';
                  const isLowRisk = s.risk?.level === 'LOW RISK';

                  return (
                    <tr key={s.screeningId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.patientName}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {s.patientId}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(s.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-xs font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {s.eye} Eye
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.prediction ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {s.prediction.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({s.prediction.confidence}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Quality Issue</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isHighRisk
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLowRisk
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHighRisk ? 'bg-rose-600' : isLowRisk ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          {s.risk?.level || 'RECAPTURE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/screening/${s.screeningId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md border border-teal-200 transition-colors"
                        >
                          <span>View Result</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
