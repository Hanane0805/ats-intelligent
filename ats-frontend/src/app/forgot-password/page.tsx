'use client';

import { useState } from 'react';
import { Mail, ArrowRight, ChevronLeft, LayoutGrid, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      
      {/* LEFT SIDE: BRANDING PANEL (Consistent) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary text-white p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 flex items-center space-x-3 z-30">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 p-2 border border-emerald-500/20">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight leading-none">ATS Intelligent</h1>
            <p className="text-[10px] text-slate-300 font-normal mt-1 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              Secure Access
            </p>
          </div>
        </div>

        <div className="text-center max-w-md space-y-6 z-30">
          <h2 className="text-4xl font-bold tracking-tight">Recover Access</h2>
          <p className="text-base text-slate-200/80 leading-relaxed">
            Don't worry, it happens to the best of us. Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: FORGOT PASSWORD FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-16 bg-background">
        <div className="w-full max-w-md space-y-6 bg-card p-6 sm:p-10 rounded-2xl border border-border shadow-sm relative">
          {isLoading && (
            <div className="absolute inset-0 bg-card/75 backdrop-blur-[1px] z-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
          )}

          <div className="mb-4">
            <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ChevronLeft className="w-3 h-3 mr-1" /> Back to login
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSubmitted ? "Check your email inbox." : "No problem, we'll send a reset link to your email."}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}