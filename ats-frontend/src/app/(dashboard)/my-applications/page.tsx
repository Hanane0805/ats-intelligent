'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Briefcase, CalendarDays, CheckCircle, Clock } from 'lucide-react';
import { api, Candidature, auth } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function MyApplicationsPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  // Read user client-side only to avoid SSR/hydration mismatch
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof auth.getUser>>(null);

  useEffect(() => {
    const user = auth.getUser();
    setCurrentUser(user);
    if (user?.id) {
      fetchCandidatures(user.id);
    } else {
      setLoading(false);
      setError("Utilisateur non connecté.");
    }
  }, []);

  const fetchCandidatures = (candidatId: number) => {
    setLoading(true);
    api.getCandidaturesByCandidat(candidatId)
      .then(data => {
        setCandidatures(data);
        setError('');
      })
      .catch(err => setError(err.message || "Erreur lors du chargement des candidatures"))
      .finally(() => setLoading(false));
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200"><Clock className="w-3 h-3" /> {t('status.pending')}</span>;
      case 'EN_ANALYSE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200"><Loader2 className="w-3 h-3 animate-spin" /> {t('status.inAnalysis')}</span>;
      case 'ENTRETIEN':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200"><CalendarDays className="w-3 h-3" /> {t('status.interview')}</span>;
      case 'ACCEPTE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle className="w-3 h-3" /> {t('status.accepted')}</span>;
      case 'REJETE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {t('status.rejected')}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-200">{statut}</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myApps.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('myApps.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">{t('myApps.loading')}</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100">
            Erreur : {error}
          </div>
        )}

        {!loading && !error && candidatures.length === 0 && (
          <div className="py-20 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('myApps.empty')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('myApps.emptyHint')}</p>
          </div>
        )}

        {!loading && !error && candidatures.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('myApps.colPosition')}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('myApps.colDate')}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('myApps.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidatures.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{c.fichePosteTitre || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                      {formatDate(c.datePostulation)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(c.statut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
