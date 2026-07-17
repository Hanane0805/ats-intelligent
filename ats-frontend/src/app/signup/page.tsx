'use client';

import { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, LayoutGrid, Activity, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      
      {/* LEFT SIDE: BRANDING PANEL (Consistent with Login) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary text-white p-16 space-y-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 flex items-center space-x-3 z-30">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 p-2 border border-emerald-500/20">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight leading-none">ATS Intelligent</h1>
            <p className="text-[10px] text-slate-300 font-normal mt-1 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              Join the ecosystem
            </p>
          </div>
        </div>

        <div className="text-center max-w-md space-y-6 z-30">
          <h2 className="text-4xl font-bold tracking-tight">Start Hiring Smarter</h2>
          <p className="text-base text-slate-200/80 leading-relaxed">
            Create your account to access AI-powered candidate screening, automated ranking, and real-time hiring insights.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: SIGNUP FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-16 bg-background">
        <div className="w-full max-w-md space-y-6 bg-card p-8 sm:p-10 rounded-2xl border border-border shadow-sm">
          
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ChevronLeft className="w-3 h-3 mr-1" /> Back to login
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Get started with ATS Intelligent today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Full Name"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="name@company.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Create a password"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Account'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted-foreground font-medium">Or</span></div>
          </div>

          <button className="w-full flex justify-center items-center py-2.5 px-4 border border-border rounded-lg text-sm font-medium bg-card text-foreground hover:bg-muted/40 transition-all">
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}