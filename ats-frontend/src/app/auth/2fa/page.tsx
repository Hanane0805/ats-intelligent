'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ShieldCheck, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../services/api';

export default function TwoFactorPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('2fa_email');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    setEmail(stored);
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits filled
    if (newCode.every(d => d !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleVerify = useCallback(async (codeStr?: string) => {
    const fullCode = codeStr || code.join('');
    if (fullCode.length < 6) { setError('Veuillez entrer les 6 chiffres.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await api.verify2FA(email, fullCode);
      setSuccess('Authentification réussie ! Redirection...');
      setTimeout(() => { window.location.href = '/dashboard'; }, 800);
    } catch (err: any) {
      setError(err.message || 'Code incorrect ou expiré.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [code, email]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.resend2FA(email);
      setCountdown(60);
      setCanResend(false);
      setSuccess('Nouveau code envoyé !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du renvoi.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Vérification en 2 étapes</h1>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Code envoyé à <span className="font-semibold text-foreground">{maskedEmail}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consultez vos logs serveur si SMTP n&apos;est pas configuré.
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium text-center">
              {success}
            </div>
          )}

          {/* OTP Input */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={isLoading}
                className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 bg-input-background text-foreground transition-all focus:outline-none
                  ${digit ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.15)]' : 'border-border'}
                  ${error ? 'border-destructive' : ''}
                  ${isLoading ? 'opacity-60' : 'hover:border-primary/50'}
                `}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={isLoading || code.some(d => !d)}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Vérifier le code</>
            )}
          </button>

          {/* Resend */}
          <div className="mt-5 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Renvoyer le code
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Renvoyer dans <span className="font-semibold text-foreground tabular-nums">{countdown}s</span>
              </p>
            )}
          </div>

          {/* Back link */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3 h-3" /> Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
