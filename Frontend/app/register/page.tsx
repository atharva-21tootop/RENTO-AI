import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { Eye, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Netra<span className="text-teal-600">Care</span> PHC
            </span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already have an account? Sign In</span>
          </Link>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Register Primary Health Centre Account
          </h1>
          <p className="text-xs text-slate-500">
            Set up your PHC credentials and healthcare worker account for AI DR screening.
          </p>
        </div>

        <RegisterForm />
      </div>

      <footer className="text-center text-xs text-slate-400 py-4">
        NetraCare PHC &bull; Smart India Hackathon DR Screening System
      </footer>
    </main>
  );
}
