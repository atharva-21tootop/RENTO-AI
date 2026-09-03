'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Building2, Phone, MapPin, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { registerSchema } from '@/lib/validations';

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phcName: '',
    phcCode: '',
    state: 'Maharashtra',
    district: 'Pune',
    address: '',
    contactNumber: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validationResult = registerSchema.safeParse(formData);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      setError(validationResult.error.issues[0]?.message || 'Please fix validation errors');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Account registration failed');
      }

      // Redirect to email verification with OTP
      router.push(`/verify-email?email=${encodeURIComponent(formData.email.toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-saffron-500/10 border border-saffron-500/30 text-[#B36615] text-xs flex items-center gap-2.5 font-medium">
          <AlertCircle className="w-4 h-4 text-saffron-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Account information */}
        <div className="bg-paper-0 p-6 rounded-xl border border-line-200 space-y-4">
          <div className="border-l-[3px] border-petrol-600 pl-3 py-0.5">
            <h2 className="text-sm font-bold text-ink-900">
              Account information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-ink-900 mb-1">
                Full name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  suppressHydrationWarning
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
                />
              </div>
              {fieldErrors.name && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-ink-900 mb-1">
                Email address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  suppressHydrationWarning
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="healthworker@phc.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
                />
              </div>
              {fieldErrors.email && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-ink-900 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  suppressHydrationWarning
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
                />
              </div>
              {fieldErrors.password && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink-900 mb-1">
                Confirm password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  suppressHydrationWarning
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
                />
              </div>
              {fieldErrors.confirmPassword && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 2: Primary Health Centre information */}
        <div className="bg-paper-0 p-6 rounded-xl border border-line-200 space-y-4">
          <div className="border-l-[3px] border-petrol-600 pl-3 py-0.5">
            <h2 className="text-sm font-bold text-ink-900">
              Primary Health Centre information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phcName" className="block text-xs font-semibold text-ink-900 mb-1">
                PHC name *
              </label>
              <input
                id="phcName"
                name="phcName"
                type="text"
                required
                suppressHydrationWarning
                value={formData.phcName}
                onChange={handleChange}
                placeholder="e.g. Alandi Rural PHC"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
              />
              {fieldErrors.phcName && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phcName}</p>}
            </div>

            <div>
              <label htmlFor="phcCode" className="block text-xs font-semibold text-ink-900 mb-1">
                PHC code *
              </label>
              <input
                id="phcCode"
                name="phcCode"
                type="text"
                required
                suppressHydrationWarning
                value={formData.phcCode}
                onChange={handleChange}
                placeholder="e.g. PHC-MH-PN-042"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600 font-mono"
              />
              {fieldErrors.phcCode && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phcCode}</p>}
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-semibold text-ink-900 mb-1">
                State *
              </label>
              <input
                id="state"
                name="state"
                type="text"
                required
                suppressHydrationWarning
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
              />
              {fieldErrors.state && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.state}</p>}
            </div>

            <div>
              <label htmlFor="district" className="block text-xs font-semibold text-ink-900 mb-1">
                District *
              </label>
              <input
                id="district"
                name="district"
                type="text"
                required
                suppressHydrationWarning
                value={formData.district}
                onChange={handleChange}
                placeholder="e.g. Pune"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
              />
              {fieldErrors.district && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.district}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-xs font-semibold text-ink-900 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                required
                suppressHydrationWarning
                value={formData.address}
                onChange={handleChange}
                placeholder="Khed Taluka, Near Bus Stand, Alandi, Pune - 412105"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600"
              />
              {fieldErrors.address && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.address}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="contactNumber" className="block text-xs font-semibold text-ink-900 mb-1">
                Contact phone number *
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                required
                suppressHydrationWarning
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+91 98230 11223"
                className="w-full p-2.5 text-sm bg-mist-100/50 border border-line-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrol-600/20 focus:border-petrol-600 font-mono"
              />
              {fieldErrors.contactNumber && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.contactNumber}</p>}
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          suppressHydrationWarning
          className="w-full py-3.5 px-6 bg-petrol-600 hover:bg-[#0c595c] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Creating PHC Account...</span>
            </>
          ) : (
            <>
              <span>Create PHC account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
