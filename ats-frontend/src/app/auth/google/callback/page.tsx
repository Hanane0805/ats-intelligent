'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion avec Google en cours...');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setStatus('error');
      setMessage('Code d\'autorisation Google manquant.');
      return;
    }

    fetch(`/api/auth/oauth2/google/callback?code=${encodeURIComponent(code)}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erreur de connexion Google');
        // Store session
        localStorage.setItem('ats_token', data.accessToken);
        // Fetch user info from JWT
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.accessToken }),
        });
        setStatus('success');
        setMessage('Connecté ! Redirection...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Erreur lors de la connexion Google.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{message}</p>
            <a href="/" className="text-sm text-primary hover:underline block mt-2">
              Retourner à la connexion
            </a>
          </>
        )}
      </div>
    </div>
  );
}
