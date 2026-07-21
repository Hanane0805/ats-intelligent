/**
 * Minimal JWT payload decoder.
 *
 * This does NOT verify the token's signature — it only reads the claims so
 * the UI can populate the session (email/role/userId) right after the
 * Google OAuth2 callback, where the backend's OAuth2Response body does not
 * include those fields directly (see services/auth.service.ts).
 *
 * Signature verification always happens server-side, on every authenticated
 * request, via the backend's JwtAuthenticationFilter — this client-side
 * decode is purely for display/session bootstrapping and is never used as a
 * security boundary.
 */

export interface AtsJwtClaims {
  /** Subject — the backend puts the user's email here (JwtService#generateToken). */
  sub: string;
  /** Role claim as issued by the backend (e.g. "ADMIN", "RECRUTEUR", or "USER" for Google logins). */
  role?: string;
  /** userId claim as issued by the backend. */
  userId?: number;
  iat?: number;
  exp?: number;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  if (typeof atob === 'function') {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  // Fallback for non-browser environments (e.g. SSR)
  return Buffer.from(padded, 'base64').toString('utf-8');
}

/**
 * Decodes a JWT's payload segment. Returns null if the token is missing,
 * malformed, or not a 3-segment JWT.
 */
export function decodeJwt<T = AtsJwtClaims>(token: string | null | undefined): T | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
