'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Search, Filter, Eye, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getScreeningHistory } from '@/lib/api/screening';
import { ScreeningResult } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

const PAGE_SIZE = 15;

export default function ScreeningHistoryPage() {
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, riskFilter, gradeFilter, dateFrom, dateTo]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getScreeningHistory(
          {
            search: debouncedSearch,
            riskLevel: riskFilter,
            drGrade: gradeFilter,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          page,
          PAGE_SIZE
        );
        setScreenings(result.items);
        setTotalPages(result.pages);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to load screenings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [debouncedSearch, riskFilter, gradeFilter, dateFrom, dateTo, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-teal-600" />
          <span>Screening Assessment History</span>
        </h1>
        <p className="text-xs text-slate-500">
          Complete archive of AI Diabetic Retinopathy screening evaluations.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by patient name, ID or screening ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Risk:</span>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW RISK">Low Risk</option>
            <option value="MONITOR">Monitor</option>
            <option value="HIGH RISK">High Risk</option>
            <option value="URGENT">Urgent</option>
            <option value="RECAPTURE">Recapture Required</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All DR Grades</option>
            <option value="0">Grade 0 (No DR)</option>
            <option value="1">Grade 1 (Mild)</option>
            <option value="2">Grade 2 (Moderate)</option>
            <option value="3">Grade 3 (Severe)</option>
            <option value="4">Grade 4 (Proliferative)</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Screenings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading history records...</p>
          </div>
        ) : screenings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No matching screening records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Screening ID</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Eye</th>
                    <th className="py-3.5 px-4">AI Prediction</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-4">Risk Triage</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
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
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-xs text-slate-700 font-medium">
                        {s.eye} Eye
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {s.prediction?.label || 'Quality Issue'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {s.prediction ? `${s.prediction.confidence}%` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.risk?.level === 'HIGH RISK' || s.risk?.level === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : s.risk?.level === 'LOW RISK'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {s.risk?.level || 'RECAPTURE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/screening/${s.screeningId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md border border-teal-200"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
