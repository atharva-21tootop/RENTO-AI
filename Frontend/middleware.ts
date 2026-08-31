import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth/token';

/**
 * Route guard for the backend-owned cookie session. Protects the dashboard +
 * onboarding; sends authenticated users away from the auth pages.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthed = token ? (await verifyToken(token)) !== null : false;

  const isProtected = pathname.startsWith('/dashboard') || pathname === '/onboarding';
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isProtected && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password'],
};