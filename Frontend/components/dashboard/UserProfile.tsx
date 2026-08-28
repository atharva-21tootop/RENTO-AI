'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, User as UserIcon, Shield, Mail, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserProfileProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
    createdAt?: Date | string | null;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const provider = user.provider || 'credentials';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          {/* Avatar or Fallback Initials */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User Avatar'}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {user.name || 'Anonymous Developer'}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  provider === 'google'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                <Shield className="w-3 h-3" />
                {provider}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {user.email || 'No email provided'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Quick Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
          <UserIcon className="w-4 h-4 text-zinc-400" />
          <div>
            <div className="text-zinc-400 font-medium">User ID</div>
            <div className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
              {user.id || 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
          <Shield className="w-4 h-4 text-zinc-400" />
          <div>
            <div className="text-zinc-400 font-medium">Auth Provider</div>
            <div className="capitalize text-zinc-700 dark:text-zinc-300">
              {provider} OAuth / Credentials
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <div>
            <div className="text-zinc-400 font-medium">Session Status</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Active Session
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
