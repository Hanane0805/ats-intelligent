'use client';

import React, { useState, useEffect } from 'react';
import { Medal, Loader2, Trophy, ChevronDown, Wand2, X, AlertCircle, FileText, Bot } from 'lucide-react';
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
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' };
};

const getScoreLabel = (score: number) => {
  if (score >= 75) return 'Excellent';
  if (score >= 55) return 'Bon';
  if (score >= 35) return 'Moyen';
  return 'Faible';
};

const getRecommendation = (score: number) => {
  if (score >= 80) return { label: 'Strongly Recommended', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: 'Recommended', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score > 0)   return { label: 'To Consider', classes: 'bg-gray-50 text-gray-600 border-gray-200' };
  return { label: '—', classes: 'bg-gray-50 text-gray-400 border-gray-200' };
};

const avatarColors = ['bg-amber-500','bg-teal-500','bg-purple-500','bg-rose-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-cyan-500'];

const getMedalStyle = (rank: number) => {
  if (rank === 1) return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-500', ring: 'ring-2 ring-yellow-400 ring-offset-2' };
  if (rank === 2) return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-400', ring: 'ring-2 ring-gray-300 ring-offset-2' };
  if (rank === 3) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600', ring: 'ring-2 ring-orange-300 ring-offset-2' };
  return { bg: '', text: '', ring: '' };
};

// ============================================================
// Parser du texte de recommandation pour extraire les 2 scores
// Format attendu (Java → recommandation) :
//   [Compatibilite: {verdict} - {score}% | Qualite ATS: {score}%]
//   Details: Semantique={s}%, Competences={s}%, Experience={s}%, Mots-cles={s}%.
//   Competences correspondantes: skill1, skill2.
//   Competences manquantes: skill3, skill4.
//   Experience: X ans (requis: Y).
//   Analyse IA: ...texte multiligne...
// ============================================================
interface ParsedAnalysis {
  atsScore: number;
  atsVerdict: string;
  compatScore: number;
  compatVerdict: string;
  semantic: number;
  skills: number;
  experience: number;
  keywords: number;
  matchedSkills: string[];
  missingSkills: string[];
  cvExpYears: number;
  reqExpYears: number;
  llmAnalysis: string;
}

function parseRecommandation(text: string): ParsedAnalysis {
  const empty: ParsedAnalysis = {
    atsScore: 0, atsVerdict: '',
    compatScore: 0, compatVerdict: '',
    semantic: 0, skills: 0, experience: 0, keywords: 0,
    matchedSkills: [], missingSkills: [],
    cvExpYears: 0, reqExpYears: 0,
    llmAnalysis: ''
  };
  if (!text) return empty;

  // ---- Header : [Compatibilite: Moyen - Profil partiellement compatible - 36.4% | Qualite ATS: 100.0%] ----
  // .+ (greedy) backtrace pour trouver le dernier " - NN.N%" avant le " |"
  const headerMatch = text.match(/Compatibilite:\s*(.+)\s*-\s*([\d.]+)%\s*\|\s*Qualite ATS:\s*([\d.]+)%/);
  if (!headerMatch) {
    // Fallback: ancien format avec un seul score
    const oldScore = text.match(/([\d.]+)%/);
    if (oldScore) {
      return { ...empty, compatScore: parseFloat(oldScore[1]), atsScore: 0, llmAnalysis: text };
    }
    return { ...empty, llmAnalysis: text };
  }

  const result: ParsedAnalysis = {
    ...empty,
    compatVerdict: headerMatch[1].trim(),
    compatScore: parseFloat(headerMatch[2]),
    atsScore: parseFloat(headerMatch[3]),
  };

  // ---- Details : Semantique=37.6%, Competences=8.9%, Experience=88.9%, Mots-cles=8.8% ----
  const detailsMatch = text.match(/Semantique=([\d.]+)%.*?Competences=([\d.]+)%.*?Experience=([\d.]+)%.*?Mots-cles=([\d.]+)%/);
  if (detailsMatch) {
    result.semantic = parseFloat(detailsMatch[1]);
    result.skills = parseFloat(detailsMatch[2]);
    result.experience = parseFloat(detailsMatch[3]);
    result.keywords = parseFloat(detailsMatch[4]);
  }

  // ---- Competences correspondantes : docker, api, git. ----
  // Le lookahead s'arrete a ". " ou "Competences manquantes" ou "Analyse IA" ou fin de chaine
  const matchedMatch = text.match(/Competences correspondantes\s*:\s*(.*?)(?=\s*\.\s|Competences manquantes|Analyse IA|$)/i);
  if (matchedMatch && matchedMatch[1].trim()) {
    result.matchedSkills = matchedMatch[1]
      .split(',')
      .map(s => s.trim().replace(/^\.+\s*/, ''))  // nettoyer les points residuels
      .filter(s => s.length > 0);
  }

  // ---- Competences manquantes : java, spring, react. ----
  const missingMatch = text.match(/Competences manquantes\s*:\s*(.*?)(?=\s*\.\s|Experience\s*:|Analyse IA|$)/i);
  if (missingMatch && missingMatch[1].trim()) {
    result.missingSkills = missingMatch[1]
      .split(',')
      .map(s => s.trim().replace(/^\.+\s*/, ''))
      .filter(s => s.length > 0);
  }

  // ---- Experience : 4 ans (requis: 3) ----
  const expMatch = text.match(/Experience\s*:\s*(\d+)\s*ans?\s*\(?requis?\s*:\s*(\d+)\)?/i);
  if (expMatch) {
    result.cvExpYears = parseInt(expMatch[1]);
    result.reqExpYears = parseInt(expMatch[2]);
  }

  // ---- Analyse IA : ... (tout ce qui suit, multiligne) ----
  const llmMatch = text.match(/Analyse IA\s*:\s*([\s\S]+)$/);
  if (llmMatch) {
    result.llmAnalysis = llmMatch[1].trim();
  }

  return result;
}

export default function RankingsPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterJob, setFilterJob] = useState<string>('all');
  
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);

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

  const handleAnalyze = async (id: number) => {
    setAnalyzingId(id);
    try {
      const updated = await api.analyzeCandidature(id);
      setCandidatures(prev => {
        const sorted = prev.map(c => c.id === id ? updated : c).sort((a, b) => (b.scoreCompatibilite || 0) - (a.scoreCompatibilite || 0));
        return sorted;
      });
      setSelectedCandidature(updated);
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'analyse");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette candidature ?")) return;
    try {
      await api.deleteCandidature(id);
      setCandidatures(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      alert(e.message || "Erreur lors de la suppression");
    }
  };

  const jobTitles = [...new Set(candidatures.map(c => c.fichePosteTitre).filter(Boolean))];
  const filtered = filterJob === 'all' ? candidatures : candidatures.filter(c => c.fichePosteTitre === filterJob);
  const topThree = filtered.slice(0, 3);
  const getInitials = (nom: string) => nom ? nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  // Parser l'analyse sélectionnée
  const parsed = selectedCandidature?.analyseIA?.recommandation
    ? parseRecommandation(selectedCandidature.analyseIA.recommandation)
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8">
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
          <p className="text-gray-500 font-medium">Aucune candidature trouvee.</p>
          <p className="text-gray-400 text-sm mt-1">Liez des candidats a des offres depuis la page <strong>Candidates</strong>.</p>
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
                    <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (c.analyseIA) {
                                  setSelectedCandidature(c);
                                } else {
                                  handleAnalyze(c.id);
                                }
                              }}
                              disabled={analyzingId === c.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                c.analyseIA 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                              } disabled:opacity-50`}
                            >
                              {analyzingId === c.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse...</>
                              ) : c.analyseIA ? (
                                <><Trophy className="w-3.5 h-3.5" /> Voir Rapport</>
                              ) : (
                                <><Wand2 className="w-3.5 h-3.5" /> Analyser IA</>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors"
                              title="Supprimer la candidature"
                            >
                              <X className="w-4 h-4" />
                            </button>
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

      {/* ============================================================ */}
      {/* AI Analysis Modal - 2 SCORES SEPARES                        */}
      {/* ============================================================ */}
      {selectedCandidature && selectedCandidature.analyseIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e3a8a]/10 text-[#1e3a8a] p-2 rounded-lg">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Rapport d'Analyse IA</h2>
                  <p className="text-xs text-gray-500">
                    {selectedCandidature.candidatNom} ➔ {selectedCandidature.fichePosteTitre}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidature(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">

              {/* ===== SCORE ATS - Qualite du CV ===== */}
              <div className="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Qualite ATS du CV</h3>
                  </div>
                  {parsed && parsed.atsScore > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${getScoreColor(parsed.atsScore).text}`}>
                        {Math.round(parsed.atsScore)}%
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{getScoreLabel(parsed.atsScore)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Non disponible</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {parsed?.atsVerdict || 'Le CV est-il bien structure pour les filtres ATS ?'}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${getScoreColor(parsed?.atsScore || 0).bar}`}
                       style={{ width: `${parsed?.atsScore || 0}%` }} />
                </div>
              </div>

              {/* ===== SCORE COMPATIBILITE - CV vs Offre ===== */}
              <div className="bg-white rounded-xl border-2 border-purple-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">Compatibilite avec l'offre</h3>
                  </div>
                  {parsed && parsed.compatScore > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${getScoreColor(parsed.compatScore).text}`}>
                        {Math.round(parsed.compatScore)}%
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{getScoreLabel(parsed.compatScore)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Non disponible</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {parsed?.compatVerdict || 'Adequation du profil avec le poste'}
                </p>

                {/* Barres de détail */}
                {parsed && parsed.compatScore > 0 && (
                  <div className="space-y-3 mb-4">
                    {[
                      { label: 'Similarite semantique', value: parsed.semantic, color: 'bg-blue-500' },
                      { label: 'Competences techniques', value: parsed.skills, color: 'bg-indigo-500' },
                      { label: 'Experience', value: parsed.experience, color: 'bg-purple-500' },
                      { label: 'Mots-cles', value: parsed.keywords, color: 'bg-pink-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{item.label}</span>
                          <span className="font-bold text-gray-800">{item.value}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Compétences matchées */}
                {parsed && parsed.matchedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-emerald-700 mb-1.5">Competences correspondantes :</p>
                    <div className="flex flex-wrap gap-1">
                      {parsed.matchedSkills.map((s, i) => (
                        <span key={i} className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compétences manquantes */}
                {parsed && parsed.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-rose-700 mb-1.5">Competences manquantes :</p>
                    <div className="flex flex-wrap gap-1">
                      {parsed.missingSkills.map((s, i) => (
                        <span key={i} className="text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {parsed && parsed.reqExpYears > 0 && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    parsed.cvExpYears >= parsed.reqExpYears ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {parsed.cvExpYears >= parsed.reqExpYears ? '✅' : '⚠️'}
                    Experience : {parsed.cvExpYears} ans (requis : {parsed.reqExpYears})
                  </div>
                )}
              </div>

              {/* ===== ANALYSE LLM ===== */}
              {parsed && parsed.llmAnalysis && (
                <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-gray-900">Analyse IA (Ollama)</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {parsed.llmAnalysis}
                  </p>
                </div>
              )}

              {/* ===== POINTS FORTS / FAIBLESSES ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <h4 className="text-emerald-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs">+</span>
                    Points Forts
                  </h4>
                  <div className="text-sm text-emerald-900/80 whitespace-pre-wrap leading-relaxed">
                    {selectedCandidature.analyseIA.syntheseForces || 'Non renseigne.'}
                  </div>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
                  <h4 className="text-rose-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs">!</span>
                    Points a verifier
                  </h4>
                  <div className="text-sm text-rose-900/80 whitespace-pre-wrap leading-relaxed">
                    {selectedCandidature.analyseIA.syntheseFaiblesses || 'Non renseigne.'}
                  </div>
                </div>
              </div>

            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setSelectedCandidature(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              >
                Fermer le rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}