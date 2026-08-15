'use client';

import { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, LayoutGrid, Activity, ChevronLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../services/api';
import { isPasswordValid } from '../../lib/passwordValidation';
import PasswordStrengthChecklist from '../../components/ui/PasswordStrengthChecklist';

export default function SignupPage() {
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', departement: 'RH' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordValid = isPasswordValid(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Defense in depth: never send the request if the password policy
    // isn't satisfied, even if the submit button was somehow triggered.
    if (!passwordValid) {
      setPasswordTouched(true);
      setError('Le mot de passe ne respecte pas toutes les exigences ci-dessous.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        departement: formData.departement,
      });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      
      {/* LEFT SIDE: BRANDING PANEL (Consistent with Login) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary text-white p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 flex items-center space-x-3 z-30">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 p-2 border border-emerald-500/20">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight leading-none">ATS Intelligent</h1>
            <p className="text-[10px] text-slate-300 font-normal mt-1 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              Rejoignez la plateforme
            </p>
          </div>
        </div>

        <div className="text-center max-w-md space-y-6 z-30">
          <h2 className="text-4xl font-bold tracking-tight">Recrutez plus intelligemment</h2>
          <p className="text-base text-slate-200/80 leading-relaxed">
            Créez votre compte pour accéder à la sélection de candidats pilotée par l'IA, au classement automatisé, et aux insights de recrutement en temps réel.
          </p>
        </div>

        <div className="flex justify-between w-full max-w-md text-center pt-6 border-t border-white/10 z-30">
          <div className="flex-1 space-y-0.5">
            <p className="text-2xl font-extrabold text-white tracking-tight">1 247</p>
            <p className="text-xs text-slate-300 font-normal">CVs Analysés</p>
          </div>
          <div className="flex-1 space-y-0.5 border-x border-white/10 px-2">
            <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">94.2%</p>
            <p className="text-xs text-slate-300 font-normal">Précision IA</p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-2xl font-extrabold text-amber-400 tracking-tight">3x</p>
            <p className="text-xs text-slate-300 font-normal">Plus Rapide</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: SIGNUP FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-16 bg-background">
        <div className="w-full max-w-md space-y-6 bg-card p-6 sm:p-10 rounded-2xl border border-border shadow-sm relative">
          
          {isLoading && (
            <div className="absolute inset-0 bg-card/75 backdrop-blur-[1px] z-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
          )}

          <div className="mb-4">
            <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ChevronLeft className="w-3 h-3 mr-1" /> Retour à la connexion
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Créer votre compte</h1>
            <p className="text-sm text-muted-foreground mt-1">Commencez à utiliser ATS Intelligent aujourd&apos;hui.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Prénom"
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nom"
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
              </div>
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
                placeholder="email@entreprise.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Department Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Département (ex: RH)"
                className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setFormData({...formData, departement: e.target.value})}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  required
                  aria-invalid={passwordTouched && !passwordValid}
                  aria-describedby="password-requirements"
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Créer un mot de passe"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onBlur={() => setPasswordTouched(true)}
                />
              </div>
              <div id="password-requirements">
                <PasswordStrengthChecklist password={formData.password} active={passwordTouched} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordValid}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Créer mon compte'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}