import { NextRequest, NextResponse } from 'next/server';

/**
 * This cookie exists for ONE reason: to let middleware.ts know a session
 * exists, without middleware needing access to localStorage (which it can't
 * reach — it runs on the edge/server, not in the browser).
 *
 * It is NOT used to authenticate requests to the Spring Boot backend — that
 * still happens via the Bearer token pulled from localStorage in
 * services/api.ts. The backend lives on a different origin
 * (NEXT_PUBLIC_API_URL), so this cookie wouldn't even be sent there.
 *
 * Middleware only checks whether this cookie is PRESENT — it never decodes
 * or verifies the JWT inside it. Real verification still happens on your
 * backend on every API call, same as today.
 */
const SESSION_COOKIE = 'ats_session';

// Keep this in sync with your backend JWT expiry if you know it.
// 24h is a reasonable default matching the old dead code's assumption.
const MAX_AGE_SECONDS = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  let token: string | undefined;

  try {
    const body = await request.json();
    token = body?.token;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
