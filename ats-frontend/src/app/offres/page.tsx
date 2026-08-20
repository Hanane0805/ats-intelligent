'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Search, ArrowRight, Loader2, MapPin, Calendar, Building2, ChevronRight, Globe, Sparkles, CheckCircle, AlertCircle, X } from 'lucide-react';
import { auth, api } from '../../services/api';

interface Job {
  id: number;
  titre: string;
  description: string;
  dateCreation: string;
  statut: string;
  recruteurNom: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function PublicJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof auth.getUser>>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    setCurrentUser(auth.getUser());
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApply = async (job: Job) => {
    // Not logged in → go to login
    if (!currentUser) {
      router.push('/');
      return;
    }
    // Wrong role → show message
    if (currentUser.role !== 'CANDIDAT') {
      showToast('warning',
        lang === 'fr'
          ? 'Vous devez être connecté en tant que Candidat pour postuler.'
          : 'You must be logged in as a Candidate to apply.'
      );
      return;
    }
    // CANDIDAT → apply directly
    setApplying(job.id);
    try {
      await api.createCandidature(currentUser.id, job.id);
      showToast('success',
        lang === 'fr'
          ? `Candidature envoyée pour "${job.titre}" !`
          : `Application sent for "${job.titre}"!`
      );
    } catch (err: any) {
      showToast('error', err.message || (lang === 'fr' ? 'Erreur lors de la candidature.' : 'Error submitting application.'));
    } finally {
      setApplying(null);
    }
  };

  useEffect(() => {
    // Use a Next.js API route proxy to avoid CORS issues
    fetch('/api/proxy/jobs')
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        const open = Array.isArray(data) ? data.filter((j: Job) => j.statut === 'OUVERT') : [];
        setJobs(open);
      })
      .catch(() => setError(lang === 'fr' ? 'Impossible de charger les offres.' : 'Could not load job offers.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.titre.toLowerCase().includes(search.toLowerCase()) ||
    (j.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-medium max-w-sm animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">ATS Intelligent</p>
              <p className="text-[10px] text-blue-300 uppercase tracking-wider">AI Recruitment</p>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {currentUser ? (
              <>
                <Link href={currentUser.role === 'CANDIDAT' ? '/my-applications' : '/dashboard'}
                  className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
                >
                  {currentUser.role === 'CANDIDAT' ? t('Mon Espace', 'My Space') : t('Tableau de bord', 'Dashboard')}
                </Link>
                <button
                  onClick={async () => { await auth.clearSession(); window.location.href = '/offres'; }}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
                >
                  {t('Déconnexion', 'Logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/10"
                >
                  {t('Se connecter', 'Sign In')}
                </Link>
                <Link href="/register"
                  className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
                >
                  {t('Créer un compte', 'Create Account')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3 h-3" />
            {t('Recrutement Intelligent', 'Intelligent Recruitment')}
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            {t('Trouvez votre prochain', 'Find your next')}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('emploi idéal', 'ideal job')}
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
            {t(
              'Des offres sélectionnées et analysées par notre IA pour vous matcher avec les meilleures opportunités.',
              'Offers selected and analyzed by our AI to match you with the best opportunities.'
            )}
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Rechercher un poste, une compétence...', 'Search for a position, skill...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
            />
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-8 text-center">
            <div>
              <p className="text-2xl font-extrabold text-white">{jobs.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('Offres actives', 'Active offers')}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-extrabold text-emerald-400">94.2%</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('Précision IA', 'AI Accuracy')}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-extrabold text-blue-400">3x</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('Plus rapide', 'Faster')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Jobs List ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{t('Chargement des offres...', 'Loading offers...')}</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-red-400">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">
              {search
                ? t('Aucune offre ne correspond à votre recherche.', 'No offer matches your search.')
                : t('Aucune offre disponible pour le moment.', 'No offers available at the moment.')}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 mb-6">
              {filtered.length} {t('offre(s) disponible(s)', 'offer(s) available')}
            </p>

            {filtered.map((job) => (
              <div
                key={job.id}
                className="group relative bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/8 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm cursor-default"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                        {job.titre}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {t('Ouvert', 'Open')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                      {job.recruteurNom && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.recruteurNom}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(job.dateCreation)}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={() => handleApply(job)}
                    disabled={applying === job.id}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:scale-100 whitespace-nowrap flex-shrink-0 self-start sm:self-center"
                  >
                    {applying === job.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <ArrowRight className="w-4 h-4" />
                    }
                    {applying === job.id ? t('Envoi...', 'Sending...') : t('Postuler', 'Apply')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer CTA ── */}
      <div className="border-t border-white/10 bg-white/3 py-12 text-center px-4">
        <p className="text-slate-400 mb-4 text-sm">
          {t('Vous avez déjà un compte ?', 'Already have an account?')}
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
        >
          {t('Se connecter pour postuler', 'Sign in to apply')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
