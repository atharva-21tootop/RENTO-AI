'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Eye, PlusCircle, Building2, UserCheck } from 'lucide-react';
import SidebarNav from './SidebarNav';
import { getPHCProfile } from '@/lib/api/phc';
import { PHCProfile } from '@/lib/api/types';

interface HeaderNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function HeaderNav({ user }: HeaderNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phc, setPHC] = useState<PHCProfile | null>(null);

  useEffect(() => {
    async function loadHeaderPHC() {
      try {
        const data = await getPHCProfile();
        setPHC(data);
      } catch (err) {
        console.error('Failed to load header PHC info:', err);
      }
    }
    loadHeaderPHC();
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Menu Toggle & Brand title for mobile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Retino<span className="text-teal-600">Care</span> PHC
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{phc?.name || 'Alandi Rural PHC'} ({phc?.code || 'PHC-001'})</span>
          </div>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{user?.name || 'Healthcare Worker'}</span>
          </div>

          <Link
            href="/dashboard/screening/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Patient Screening</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-64 h-full bg-white shadow-xl">
            <SidebarNav user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
