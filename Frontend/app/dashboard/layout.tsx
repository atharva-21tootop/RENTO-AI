import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import SidebarNav from '@/components/dashboard/SidebarNav';
import HeaderNav from '@/components/dashboard/HeaderNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.needsProfile) {
    redirect('/onboarding');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row relative">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        <SidebarNav user={user} />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <HeaderNav user={user} />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
