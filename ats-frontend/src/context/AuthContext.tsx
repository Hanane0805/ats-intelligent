'use client';

import React, { createContext, useState, useEffect } from 'react';
import { Utilisateur, AuthResponse } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: Utilisateur | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, mdp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  hydrateSession: (token: string, userData: Utilisateur) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, mdp: string) => {
    const data = await authService.login(email, mdp);
    localStorage.setItem('token', data.token);
    
    // Set cookie so middleware can read it on the server side
    document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
    
    const userProfile: Utilisateur = { id: data.id, email: data.email, nom: data.nom, prenom: data.prenom, role: data.role };
    localStorage.setItem('user', JSON.stringify(userProfile));
    setUser(userProfile);
  };

  const loginWithGoogle = async () => {
    const authUrl = await authService.getGoogleAuthUrl();
    window.location.href = authUrl;
  };

  const hydrateSession = (token: string, userData: Utilisateur) => {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    document.cookie = 'token=; Max-Age=0; path=/;';
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, loginWithGoogle, logout, hydrateSession }}>
      {children}
    </AuthContext.Provider>
  );
}