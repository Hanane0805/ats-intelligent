'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

type Status = 'processing' | 'success' | 'error';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const { loginWithGoogleCallback } = useAuth();

  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('Connexion avec Google en cours...');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const oauthError = searchParams.get('error');
    const code = searchParams.get('code');

    if (oauthError) {
      setStatus('error');
      setMessage('La connexion avec Google a été refusée ou a échoué.');
      setTimeout(() => { window.location.href = '/'; }, 2500);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage("Code d'autorisation Google manquant.");
      setTimeout(() => { window.location.href = '/'; }, 2500);
      return;
    }

    (async () => {
      try {
        await loginWithGoogleCallback(code);
        setStatus('success');
        setMessage('Connexion réussie. Redirection...');
        window.location.href = '/dashboard';
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ||
          err?.message ||
          "Impossible de finaliser la connexion avec Google."
        );
        setTimeout(() => { window.location.href = '/'; }, 3000);
      }
    })();
  }, [searchParams, loginWithGoogleCallback]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 p-2 border border-emerald-500/20">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-medium tracking-tight">ATS Intelligent</h1>
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-sm">
        {status === 'processing' && <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />}
        {status === 'success' && <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />}
        {status === 'error' && <XCircle className="mx-auto h-10 w-10 text-destructive" />}

        <p className="text-sm text-muted-foreground">{message}</p>

        {status === 'error' && (
          <Link href="/" className="inline-block text-sm font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
