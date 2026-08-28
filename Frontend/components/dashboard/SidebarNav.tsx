'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Eye,
  Users,
  History,
  FileText,
  Building2,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onCloseMobile?: () => void;
}

export default function SidebarNav({ user, onCloseMobile }: SidebarNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'PHC Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'New Screening',
      href: '/dashboard/screening/new',
      icon: Eye,
      badge: 'AI Screening',
    },
    {
      name: 'Patients',
      href: '/dashboard/patients',
      icon: Users,
      badge: null,
    },
    {
      name: 'Screening History',
      href: '/dashboard/screenings',
      icon: History,
      badge: null,
    },
    {
      name: 'Screening Reports',
      href: '/dashboard/reports',
      icon: FileText,
      badge: null,
    },
    {
      name: 'PHC Profile & Settings',
      href: '/dashboard/phc',
      icon: Building2,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col justify-between h-full select-none">
      {/* Top Header Branding */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" onClick={onCloseMobile} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight leading-tight block">
                Retino<span className="text-teal-400">Care</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                PHC DR Screening AI
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'W'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Healthcare Worker'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                <span>Authenticated</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
