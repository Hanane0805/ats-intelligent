'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Utilisateur, AuthResponse } from '../types/auth';
import { authService } from '../services/auth.service';
import { auth as sessionAuth } from '../services/api';
import { decodeJwt } from '../lib/jwt';

interface AuthContextType {
  user: Utilisateur | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, mdp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: (data: AuthResponse) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from the same storage services/api.ts writes to, so a page refresh
    // reflects whichever login method (password or Google) was actually used.
    const storedUser = sessionAuth.getUser();
    const storedToken = sessionAuth.getToken();
    if (storedUser && storedToken) {
      setUser(storedUser as unknown as Utilisateur);
    }
    setLoading(false);
  }, []);

  /**
   * Persists an authentication result (from local login OR the Google OAuth
   * callback, once normalized - see loginWithGoogleCallback) using the SAME
   * storage keys (`ats_token` / `ats_user`) and the same httpOnly
   * session-cookie route that every dashboard API call (services/api.ts) and
   * middleware.ts already rely on.
   */
  const hydrateSession = async (data: AuthResponse) => {
    await sessionAuth.setSession({
      token: data.token,
      role: data.role,
      userId: data.userId,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
    });
    setUser({ id: data.userId, email: data.email, nom: data.nom, prenom: data.prenom, role: data.role });
  };

  const login = async (email: string, mdp: string) => {
    const data = await authService.login(email, mdp);
    await hydrateSession(data);
  };

  const loginWithGoogle = async () => {
    const authUrl = await authService.getGoogleAuthUrl();
    window.location.href = authUrl;
  };

  /**
   * Completes the Google OAuth2 flow started by loginWithGoogle().
   *
   * The backend's oauth2/google/callback endpoint returns an OAuth2Response
   * (accessToken/tokenType/provider) - NOT an AuthResponse. It doesn't include
   * role/userId/email/nom/prenom directly, so those are recovered from the
   * JWT's own claims (the backend embeds `sub` = email, `role`, and `userId`
   * when it signs the token - see JwtService#generateToken). The backend's
   * Google flow does not have access to nom/prenom at token-issuing time, so
   * those are left blank here rather than invented.
   */
  const loginWithGoogleCallback = async (code: string) => {
    const oauthResult = await authService.handleGoogleCallback(code);
    const claims = decodeJwt(oauthResult.accessToken);

    if (!claims || !claims.sub) {
      throw new Error("Impossible de lire la session renvoyée par Google.");
    }

    await hydrateSession({
      token: oauthResult.accessToken,
      role: (claims.role as AuthResponse['role']) ?? 'USER',
      userId: claims.userId ?? 0,
      email: claims.sub,
      nom: '',
      prenom: '',
    });
  };

  const logout = async () => {
    await sessionAuth.clearSession();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, loginWithGoogle, loginWithGoogleCallback, logout, hydrateSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Nothing previously consumed AuthContext (the login page called
 * services/api.ts directly), so there was no way for the Google button or
 * the callback page to reach `loginWithGoogle` / `loginWithGoogleCallback`.
 * This hook is that missing piece.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
