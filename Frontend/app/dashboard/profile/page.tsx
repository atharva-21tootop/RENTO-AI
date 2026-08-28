import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UserProfile from '@/components/dashboard/UserProfile';
import { User, ShieldCheck, HeartPulse } from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
          <User className="w-3.5 h-3.5" />
          <span>Patient Account</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl mt-1">
          Manage your account settings, authenticated identity, and healthcare screening preferences.
        </p>
      </div>

      {/* User Profile Card */}
      <UserProfile user={user} />

      {/* Security & Health Record Privacy Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Health Record Privacy & Authentication Security</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Your account is secured with Auth.js v5 encrypted session tokens and MongoDB Atlas schema protection. All health screening logs are protected and anonymized before being computed into community health insights.
        </p>

        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Health Screening ID: Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>OAuth & Password Security: Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
