import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Must match the cookie name set/cleared in app/api/auth/session/route.ts.
 * This middleware only checks whether the cookie is PRESENT — it does not
 * decode or verify the JWT. Real verification happens on the backend on
 * every API call, same as before. This is the standard "optimistic check"
 * pattern: fast, edge-safe, and good enough to gate page navigation.
 */
const SESSION_COOKIE = 'ats_session';

/**
 * Pages reachable WITHOUT a session. Everything else in the app — including
 * every route currently under app/(dashboard)/ (dashboard, jobs, candidates,
 * analysis, rankings, history, stats, profil, settings, admin, users, roles,
 * logs, notifications, and the legacy fiches-postes/candidatures/candidats
 * duplicates) — is protected by default.
 *
 * Doing it this way (deny-by-default) instead of enumerating protected
 * routes means new routes you add under (dashboard) later are automatically
 * protected without anyone having to remember to update this list — which is
 * exactly the bug that made the old middleware.ts silently stop protecting
 * most of the app.
 */
const PUBLIC_PATHS = ['/', '/signup', '/register', '/forgot-password', '/auth/callback'];

/** Paths that should redirect an already-authenticated user away. */
const AUTH_ONLY_PATHS = ['/', '/signup', '/register'];

function matchesPath(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((path) => matchesPath(pathname, path));
  const isPublicPath = PUBLIC_PATHS.some((path) => matchesPath(pathname, path));

  // Already logged in? Don't show login/register/signup again.
  if (hasSession && isAuthOnlyPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // No session and trying to reach a protected page? Back to login.
  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *  - /api/**            (API routes handle their own concerns)
     *  - /_next/static, /_next/image (Next.js internals)
     *  - files with an extension (favicon.ico, images, etc.)
     */
    '/((?!api|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map)$).*)',
  ],
};
