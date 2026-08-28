'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, Printer, Calendar, ArrowRight } from 'lucide-react';
import { getScreeningHistory } from '@/lib/api/screening';
import { ScreeningResult } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

export default function ReportsIndexPage() {
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { items } = await getScreeningHistory({ search: debouncedSearch });
        setScreenings(items);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" />
          <span>Screening Reports Archive</span>
        </h1>
        <p className="text-xs text-slate-500">
          Official printable screening reports for PHC patients and specialist referrals.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search reports by patient name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading screening reports...</p>
          </div>
        ) : screenings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Screening ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">DR Prediction</th>
                  <th className="py-3.5 px-4">Risk Triage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {screenings.map((s) => (
                  <tr key={s.screeningId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.patientName}
                      <span className="block text-[11px] font-mono font-normal text-slate-400">{s.patientId}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {s.screeningId}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {new Date(s.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {s.prediction?.label || 'Quality Issue'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.risk?.level === 'HIGH RISK' || s.risk?.level === 'URGENT'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {s.risk?.level || 'RECAPTURE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/reports/${s.screeningId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-md border border-teal-200"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
