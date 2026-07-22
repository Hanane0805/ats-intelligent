'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight, LayoutGrid, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Live Stats State
  const [candidatesAnalyzed, setCandidatesAnalyzed] = useState(1247);
  const [accuracyRate, setAccuracyRate] = useState(94.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandidatesAnalyzed(prev => prev + Math.floor(Math.random() * 3) + 1);
      setAccuracyRate(prev => {
        const fluctuation = (Math.random() * 0.4) - 0.2;
        const newRate = prev + fluctuation;
        return Math.min(Math.max(newRate, 93.5), 98.9);
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.login({ email, password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      // Redirects the browser to Google's consent screen; on success this
      // component unmounts, so there's no "finally" resetting the spinner.
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Impossible de démarrer la connexion avec Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-200">
      {/* LEFT SIDE: BRANDING PANEL */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary text-white p-16 space-y-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 flex items-center space-x-3 z-30">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 p-2 border border-emerald-500/20">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight leading-none">ATS Intelligent</h1>
            <p className="text-[10px] text-slate-300 font-normal mt-1 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              Live System Active
            </p>
          </div>
        </div>

        <div className="relative w-80 h-80 flex items-center justify-center">
          <div className="absolute w-12 h-20 bg-emerald-500 rounded-full flex items-center justify-center p-1 border-4 border-emerald-300 z-10 animate-pulse">
             <div className="w-full h-full bg-emerald-50 rounded-full"></div>
          </div>
          <div className="absolute w-64 h-64 border-2 border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
          
          <div className="absolute w-52 h-52 border border-dashed border-emerald-400/50 bg-primary/40 backdrop-blur-md rounded-full flex flex-col items-center justify-center z-20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="text-center space-y-4 w-full">
              <div>
                <p className="text-4xl font-black tracking-tight text-white">{candidatesAnalyzed.toLocaleString('en-US')}</p>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">CVs Analyzed</p>
              </div>
              <div className="w-16 h-px bg-white/20 mx-auto"></div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1">{accuracyRate.toFixed(1)}%</p>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">AI Accuracy</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center max-w-md space-y-3 z-30">
          <h2 className="text-3xl font-bold tracking-tight">Smarter Hiring with AI</h2>
          <p className="text-base text-slate-200/80 font-normal leading-relaxed">
            Analyze CVs instantly, rank candidates automatically, and make data-driven hiring decisions in real-time.
          </p>
        </div>

        {/* Analytics Stats Metrics Footer */}
        <div className="flex justify-between w-full max-w-md text-center pt-6 border-t border-white/10 z-30">
          <div className="flex-1 space-y-0.5">
            <p className="text-2xl font-extrabold text-white tracking-tight">{candidatesAnalyzed.toLocaleString('en-US')}</p>
            <p className="text-xs text-slate-300 font-normal">Total Processed</p>
          </div>
          <div className="flex-1 space-y-0.5 border-x border-white/10 px-2">
            <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">{accuracyRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-300 font-normal">Precision Rate</p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-2xl font-extrabold text-amber-400 tracking-tight">3x</p>
            <p className="text-xs text-slate-300 font-normal">Faster Hiring</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTH FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-16 bg-background">
        <div className="text-center space-y-1.5 mb-8 w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <div className="w-full max-w-md space-y-6 bg-card p-8 sm:p-10 rounded-2xl border border-border shadow-sm relative">
          {(isLoading || isGoogleLoading) && (
            <div className="absolute inset-0 bg-card/75 backdrop-blur-[1px] z-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="name@company.com"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <Link href="/signup" className="text-primary hover:underline font-medium">Create an account</Link>
                <Link href="/forgot-password" className="text-primary hover:underline font-medium">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <div className="relative pt-3 pb-1 border-t border-border">
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground font-medium">Or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading || isGoogleLoading}
            type="button"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-border rounded-lg text-sm font-medium bg-card text-foreground hover:bg-muted/40 transition-all"
          >
            <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}