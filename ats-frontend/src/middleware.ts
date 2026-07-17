import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for token in cookies (populated during login)
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname === '/';
  const isCallbackPage = request.nextUrl.pathname.startsWith('/auth/callback');

  // If trying to access dashboard without a token, boot them to login
  if (!token && !isAuthPage && !isCallbackPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If already logged in and trying to see login page, send to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Protect all routes inside your dashboard route group
export const config = {
  matcher: ['/', '/fiches-postes/:path*', '/candidatures/:path*', '/candidats/:path*', '/profil/:path*'],
};