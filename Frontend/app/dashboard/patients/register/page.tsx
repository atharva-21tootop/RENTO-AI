'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { registerPatient } from '@/lib/api/patients';

export default function PatientRegistrationPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [diabetesDurationYears, setDiabetesDurationYears] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !diabetesDurationYears) return;

    setSubmitting(true);

    try {
      const created = await registerPatient({
        patientId: patientIdInput.trim() || `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
        diabetesDurationYears: parseInt(diabetesDurationYears, 10),
        contactNumber: contactNumber.trim() || undefined,
      });

      setSuccessMsg(true);

      setTimeout(() => {
        router.push(`/dashboard/screening/new?patientId=${created.id}`);
      }, 600);
    } catch (err) {
      console.error('Failed to register patient:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-teal-600" />
            <span>Patient Registration</span>
          </h1>
          <p className="text-xs text-slate-500">
            Register a diabetic patient at the Primary Health Centre for DR screening.
          </p>
        </div>

        <Link
          href="/dashboard/patients"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Patient List</span>
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Patient registered successfully! Redirecting to new screening...</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Savitri Devi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Patient ID (Optional / Auto-generated)</label>
            <input
              type="text"
              placeholder="e.g. PAT-2026-0895"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Age (Years) *</label>
            <input
              type="number"
              required
              min="1"
              max="120"
              placeholder="e.g. 58"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Gender *</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Diabetes Duration (Years) *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 8"
              value={diabetesDurationYears}
              onChange={(e) => setDiabetesDurationYears(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Contact Number (Optional)</label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Continue to Screening</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
