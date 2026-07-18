'use client';

import React, { useState, useEffect } from 'react';
import { Medal, Loader2, Trophy, ChevronDown } from 'lucide-react';
import { api, Candidature } from '../../../services/api';

const STATUS_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'Pending', classes: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
  { value: 'EN_ANALYSE', label: 'Analyzing', classes: 'bg-purple-50 text-purple-600 border-purple-200', dot: 'bg-purple-500' },
  { value: 'ENTRETIEN', label: 'Interview', classes: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500' },
  { value: 'ACCEPTE', label: 'Accepted', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'REJETE', label: 'Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
];

const getStatusDisplay = (statut: string) =>
  STATUS_OPTIONS.find(s => s.value === statut) || { label: statut, classes: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };

const getScoreColor = (score: number) => {
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600' };
  return { bar: 'bg-rose-500', text: 'text-rose-600' };
};

const getRecommendation = (score: number) => {
  if (score >= 80) return { label: '⭐ Strongly Recommended', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: '👍 Recommended', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score > 0)   return { label: '🤔 To Consider', classes: 'bg-gray-50 text-gray-600 border-gray-200' };
  return { label: '—', classes: 'bg-gray-50 text-gray-400 border-gray-200' };
};

const avatarColors = ['bg-amber-500','bg-teal-500','bg-purple-500','bg-rose-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-cyan-500'];

const getMedalStyle = (rank: number) => {
  if (rank === 1) return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-500', ring: 'ring-2 ring-yellow-400 ring-offset-2' };
  if (rank === 2) return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-400', ring: 'ring-2 ring-gray-300 ring-offset-2' };
  if (rank === 3) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600', ring: 'ring-2 ring-orange-300 ring-offset-2' };
  return { bg: '', text: '', ring: '' };
};

export default function RankingsPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterJob, setFilterJob] = useState<string>('all');

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const fetchCandidatures = () => {
    api.getCandidatures()
      .then(data => {
        const sorted = [...data].sort((a, b) => (b.scoreCompatibilite || 0) - (a.scoreCompatibilite || 0));
        setCandidatures(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.updateCandidatureStatus(id, newStatus);
      setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut: newStatus } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Unique job titles for filter
  const jobTitles = [...new Set(candidatures.map(c => c.fichePosteTitre).filter(Boolean))];

  const filtered = filterJob === 'all'
    ? candidatures
    : candidatures.filter(c => c.fichePosteTitre === filterJob);

  const topThree = filtered.slice(0, 3);

  const getInitials = (nom: string) => nom ? nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mt-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Rankings</h1>
          <p className="text-sm text-gray-500 mt-1">Leaderboard ranked by AI compatibility score</p>
        </div>
        <div className="flex items-center gap-3">
          {jobTitles.length > 0 && (
            <div className="relative">
              <select
                value={filterJob}
                onChange={e => setFilterJob(e.target.value)}
                className="appearance-none px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-8"
              >
                <option value="all">All Positions</option>
                {jobTitles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Chargement des classements...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 rounded-xl border border-rose-100">
          Erreur : {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-100">
          <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune candidature trouvée.</p>
          <p className="text-gray-400 text-sm mt-1">Liez des candidats à des offres depuis la page <strong>Candidates</strong>.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              {topThree.map((c, idx) => {
                const rank = idx + 1;
                const medal = getMedalStyle(rank);
                const score = Math.round((c.scoreCompatibilite || 0) * 100);
                const scoreColor = getScoreColor(score).text;
                const statusTheme = getStatusDisplay(c.statut);
                const initials = getInitials(c.candidatNom);
                const avatarColor = avatarColors[c.candidatId % avatarColors.length];

                return (
                  <div key={c.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center relative ${medal.ring}`}>
                    <div className={`absolute -top-3.5 flex items-center justify-center w-9 h-9 rounded-full border-2 shadow ${medal.bg} ${medal.text}`}>
                      {rank <= 3 ? <Medal className="w-4 h-4" /> : <span className="text-xs font-black">{rank}</span>}
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 mt-2 ${avatarColor}`}>
                      {initials}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{c.candidatNom}</h3>
                    <p className="text-xs text-gray-400 mt-1 mb-4">{c.fichePosteTitre || '—'}</p>
                    <div className="mb-3">
                      <span className={`text-3xl font-black ${scoreColor}`}>{score > 0 ? `${score}%` : '—'}</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Match Score</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusTheme.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`}></span>
                      {statusTheme.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-bold text-gray-700 text-sm">Full Leaderboard</span>
              <span className="ml-auto text-xs font-medium text-gray-400">{filtered.length} applications</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Match Score</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">AI Recommendation</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((c, idx) => {
                    const statusTheme = getStatusDisplay(c.statut);
                    const score = Math.round((c.scoreCompatibilite || 0) * 100);
                    const scoreTheme = getScoreColor(score);
                    const initials = getInitials(c.candidatNom);
                    const rec = getRecommendation(score);
                    const avatarColor = avatarColors[c.candidatId % avatarColors.length];
                    const isUpdating = updatingId === c.id;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group bg-white">
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-[#1e3a8a]">#{idx + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${avatarColor}`}>
                              {initials}
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors">{c.candidatNom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{c.fichePosteTitre || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreTheme.bar} transition-all`} style={{ width: `${score}%` }}></div>
                            </div>
                            <span className={`text-sm font-bold ${scoreTheme.text}`}>{score > 0 ? `${score}%` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${rec.classes}`}>
                            {rec.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {/* Inline status changer */}
                          <div className="relative">
                            <select
                              value={c.statut}
                              disabled={isUpdating}
                              onChange={e => handleStatusChange(c.id, e.target.value)}
                              className={`appearance-none pl-6 pr-7 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${statusTheme.classes} ${isUpdating ? 'opacity-50' : ''}`}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${statusTheme.dot}`}></span>
                            {isUpdating
                              ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-gray-400" />
                              : <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
