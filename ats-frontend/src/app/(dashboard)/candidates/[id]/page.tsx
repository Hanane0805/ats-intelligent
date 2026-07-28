'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, FileText, Briefcase, Calendar, Star,
  TrendingUp, TrendingDown, Loader2, CheckCircle, XCircle,
  Clock, MessageSquare, Wand2, AlertCircle, CloudUpload, Eye, Trash2,
  Video, Phone, MapPin, Plus, X
} from 'lucide-react';
import { api, Candidature } from '../../../../services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  EN_ATTENTE:  { label: 'En attente',   color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: <Clock className="w-3.5 h-3.5" /> },
  EN_ANALYSE:  { label: 'En analyse',   color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Wand2 className="w-3.5 h-3.5" /> },
  ENTRETIEN:   { label: 'Entretien',    color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ACCEPTE:     { label: 'Accepté',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  REJETE:      { label: 'Rejeté',       color: 'bg-rose-100 text-rose-700 border-rose-200',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

const avatarColors = ['bg-amber-500','bg-teal-500','bg-purple-500','bg-rose-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-cyan-500'];

async function fetchCVs(candidatId: number): Promise<any[]> {
  const token = localStorage.getItem('ats_token');
  const res = await fetch(`${API_BASE}/api/documents-cv/candidat/${candidatId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store'
  });
  if (!res.ok) return [];
  return res.json();
}

async function uploadCV(candidatId: number, file: File): Promise<void> {
  const token = localStorage.getItem('ats_token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/documents-cv/upload/${candidatId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || d.message || 'Erreur upload');
  }
}

export default function CandidatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidatId = Number(params.id);

  const [candidat, setCandidat] = useState<any>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [cvList, setCvList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actions
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Entretiens
  const [entretiens, setEntretiens] = useState<any[]>([]);
  const [showEntretienModal, setShowEntretienModal] = useState(false);
  const [entretienCandidatureId, setEntretienCandidatureId] = useState<number | null>(null);
  const [entretienForm, setEntretienForm] = useState({
    dateHeure: '', dureeMinutes: 60, typeEntretien: 'VISIO', lienVisio: '', lieu: '', notes: ''
  });
  const [savingEntretien, setSavingEntretien] = useState(false);
  const [entretienMsg, setEntretienMsg] = useState('');

  useEffect(() => {
    if (!candidatId) return;
    Promise.all([
      fetch(`${API_BASE}/api/candidats/${candidatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ats_token') || ''}` },
      }).then(r => r.ok ? r.json() : Promise.reject('Candidat introuvable')),
      api.getCandidatures(),
      fetchCVs(candidatId),
      fetch(`${API_BASE}/api/entretiens/candidat/${candidatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ats_token') || ''}` },
      }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([c, allCandidatures, cvs, ents]) => {
      setCandidat(c);
      setCandidatures(allCandidatures.filter((ca: Candidature) => ca.candidatId === candidatId));
      setCvList(cvs);
      setEntretiens(ents);
    }).catch(err => setError(typeof err === 'string' ? err : err.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [candidatId]);

  const handleStatusChange = async (candidatureId: number, newStatus: string) => {
    setUpdatingId(candidatureId);
    try {
      await api.updateCandidatureStatus(candidatureId, newStatus);
      setCandidatures(prev => prev.map(c => c.id === candidatureId ? { ...c, statut: newStatus } : c));
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAnalyze = async (candidatureId: number) => {
    setAnalyzingId(candidatureId);
    try {
      const updated = await api.analyzeCandidature(candidatureId);
      setCandidatures(prev => prev.map(c => c.id === candidatureId ? { ...c, ...updated } : c));
    } catch (e: any) {
      alert('Erreur IA : ' + e.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      await uploadCV(candidatId, file);
      setUploadMsg('CV téléversé avec succès !');
      const cvs = await fetchCVs(candidatId);
      setCvList(cvs);
    } catch (err: any) {
      setUploadMsg('Erreur : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCV = async (docId: number) => {
    if (!confirm('Supprimer ce CV ?')) return;
    const token = localStorage.getItem('ats_token');
    await fetch(`${API_BASE}/api/documents-cv/${docId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setCvList(prev => prev.filter(d => d.id !== docId));
  };

  const openEntretienModal = (candidatureId: number) => {
    setEntretienCandidatureId(candidatureId);
    setEntretienForm({ dateHeure: '', dureeMinutes: 60, typeEntretien: 'VISIO', lienVisio: '', lieu: '', notes: '' });
    setEntretienMsg('');
    setShowEntretienModal(true);
  };

  const handleSaveEntretien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entretienCandidatureId) return;
    setSavingEntretien(true);
    setEntretienMsg('');
    try {
      const token = localStorage.getItem('ats_token');
      const res = await fetch(`${API_BASE}/api/entretiens/candidature/${entretienCandidatureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...entretienForm, dureeMinutes: Number(entretienForm.dureeMinutes) }),
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      const saved = await res.json();
      setEntretiens(prev => [...prev, saved]);
      // Auto-update candidature status in UI
      setCandidatures(prev => prev.map(c => c.id === entretienCandidatureId ? { ...c, statut: 'ENTRETIEN' } : c));
      setEntretienMsg('Entretien planifié avec succès !');
      setTimeout(() => setShowEntretienModal(false), 1200);
    } catch (err: any) {
      setEntretienMsg('Erreur : ' + err.message);
    } finally {
      setSavingEntretien(false);
    }
  };

  const handleDeleteEntretien = async (entretienId: number) => {
    if (!confirm('Supprimer cet entretien ?')) return;
    const token = localStorage.getItem('ats_token');
    await fetch(`${API_BASE}/api/entretiens/${entretienId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setEntretiens(prev => prev.filter(e => e.id !== entretienId));
  };


  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
    </div>
  );

  const color = avatarColors[(candidatId || 0) % avatarColors.length];
  const initials = `${candidat?.prenom?.[0] || ''}${candidat?.nom?.[0] || ''}`.toUpperCase();
  const bestScore = Math.round(candidatures.reduce((max, c) => Math.max(max, c.scoreCompatibilite || 0), 0) * 100);

  return (
    <>
      <div className="max-w-5xl mx-auto w-full space-y-6 pb-10">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-600 h-24 relative" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className={`w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white font-black text-2xl ${color} shadow-lg`}>
              {initials}
            </div>
            {bestScore > 0 && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${
                bestScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                bestScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <Star className="w-4 h-4" />
                Meilleur score IA : {bestScore}%
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900">{candidat?.prenom} {candidat?.nom}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Mail className="w-4 h-4" />
              {candidat?.email || '—'}
            </div>
            {candidat?.email && (
              <a
                href={`mailto:${candidat.email}?subject=Votre candidature - ATS Intelligent&body=Bonjour ${candidat.prenom},%0A%0ANous revenons vers vous concernant votre candidature.%0A%0ACordialement,`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition-all"
              >
                <Mail className="w-3.5 h-3.5" /> Envoyer email
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — CVs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> CVs Téléversés
            </h2>

            {/* Upload button */}
            <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all mb-4 ${
              uploading ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-500'
            }`}>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} disabled={uploading} />
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              <span className="text-sm font-medium">{uploading ? 'Upload...' : 'Ajouter un CV'}</span>
            </label>

            {uploadMsg && (
              <p className={`text-xs mb-3 font-medium ${uploadMsg.startsWith('Erreur') ? 'text-rose-600' : 'text-emerald-600'}`}>
                {uploadMsg}
              </p>
            )}

            {cvList.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Aucun CV téléversé</p>
            ) : (
              <div className="space-y-2">
                {cvList.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate">{doc.nomFichier}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-1">
                      <a href={`${API_BASE}/api/documents-cv/${doc.id}/download`} target="_blank" rel="noreferrer"
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Voir">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => handleDeleteCV(doc.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Candidatures */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Candidatures ({candidatures.length})
          </h2>

          {candidatures.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
              <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aucune candidature pour ce candidat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidatures.map(c => {
                const statusConf = STATUS_CONFIG[c.statut] || { label: c.statut, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
                const score = Math.round((c.scoreCompatibilite || 0) * 100);
                const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
                const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                // Also fix analyseIA score display (stored as 0-1)
                const analyseIAScore = c.analyseIA?.scoreCompatibilite
                  ? Math.round(c.analyseIA.scoreCompatibilite * 100)
                  : null;

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                    {/* Candidature header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{c.posteTitre || 'Poste non défini'}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusConf.color}`}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(c.datePostulation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      {/* AI Score */}
                      <div className="text-right flex-shrink-0">
                        {score > 0 ? (
                          <>
                            <p className={`text-2xl font-black ${scoreColor}`}>{score}%</p>
                            <p className="text-xs text-gray-400">score IA</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Non analysé</p>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    {score > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
                      </div>
                    )}

                    {/* AI Analysis */}
                    {c.analyseIA && (
                      <div className="space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {c.analyseIA.syntheseForces && (
                          <div className="flex gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-emerald-700 text-xs uppercase tracking-wide mb-0.5">Forces</p>
                              <p className="text-gray-700">{c.analyseIA.syntheseForces}</p>
                            </div>
                          </div>
                        )}
                        {c.analyseIA.syntheseFaiblesses && (
                          <div className="flex gap-2 text-sm">
                            <TrendingDown className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-rose-600 text-xs uppercase tracking-wide mb-0.5">Faiblesses</p>
                              <p className="text-gray-700">{c.analyseIA.syntheseFaiblesses}</p>
                            </div>
                          </div>
                        )}
                        {c.analyseIA.recommandation && (
                          <div className="flex gap-2 text-sm pt-2 border-t border-gray-200">
                            <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-amber-700 text-xs uppercase tracking-wide mb-0.5">Recommandation</p>
                              <p className="text-gray-700 font-medium">{c.analyseIA.recommandation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleAnalyze(c.id)}
                        disabled={analyzingId === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {analyzingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        {analyzingId === c.id ? 'Analyse...' : 'Analyser IA'}
                      </button>

                      {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                        key !== c.statut && (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(c.id, key)}
                            disabled={updatingId === c.id}
                            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all hover:opacity-80 ${conf.color}`}
                          >
                            {updatingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : conf.icon}
                            {conf.label}
                          </button>
                        )
                      ))}

                      {/* Plan interview button */}
                      <button
                        onClick={() => openEntretienModal(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-xs font-bold transition-all ml-auto"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Planifier entretien
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Entretiens Section ── */}
      {entretiens.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Entretiens planifiés ({entretiens.length})
          </h2>
          <div className="space-y-3">
            {entretiens.map((ent: any) => {
              const dt = new Date(ent.dateHeure);
              const typeIcon = ent.typeEntretien === 'VISIO' ? <Video className="w-4 h-4 text-blue-500" />
                : ent.typeEntretien === 'TELEPHONIQUE' ? <Phone className="w-4 h-4 text-green-500" />
                : <MapPin className="w-4 h-4 text-orange-500" />;
              const statutColor = ent.statutEntretien === 'PLANIFIE' ? 'bg-amber-100 text-amber-700'
                : ent.statutEntretien === 'CONFIRME' ? 'bg-emerald-100 text-emerald-700'
                : ent.statutEntretien === 'ANNULE' ? 'bg-rose-100 text-rose-700'
                : 'bg-gray-100 text-gray-600';
              return (
                <div key={ent.id} className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      {typeIcon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' à '}
                        {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-gray-400 font-normal ml-2">· {ent.dureeMinutes} min</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{ent.typeEntretien}</span>
                        {ent.lienVisio && <a href={ent.lienVisio} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">{ent.lienVisio}</a>}
                        {ent.lieu && <span className="text-xs text-gray-500">{ent.lieu}</span>}
                      </div>
                      {ent.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{ent.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statutColor}`}>{ent.statutEntretien}</span>
                    <button onClick={() => handleDeleteEntretien(ent.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {/* ── Schedule Interview Modal ── */}
      {showEntretienModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" /> Planifier un entretien
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {candidat?.prenom} {candidat?.nom}
                </p>
              </div>
              <button onClick={() => setShowEntretienModal(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntretien} className="p-6 space-y-4">
              {/* Date + Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Date et heure <span className="text-rose-500">*</span></label>
                <input
                  type="datetime-local"
                  required
                  value={entretienForm.dateHeure}
                  onChange={e => setEntretienForm(f => ({ ...f, dateHeure: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Type + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Type</label>
                  <select
                    value={entretienForm.typeEntretien}
                    onChange={e => setEntretienForm(f => ({ ...f, typeEntretien: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="VISIO">📹 Visio</option>
                    <option value="TELEPHONIQUE">📞 Téléphonique</option>
                    <option value="PRESENTIEL">📍 Présentiel</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Durée (min)</label>
                  <select
                    value={entretienForm.dureeMinutes}
                    onChange={e => setEntretienForm(f => ({ ...f, dureeMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1h</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2h</option>
                  </select>
                </div>
              </div>

              {/* Link / Location */}
              {entretienForm.typeEntretien === 'VISIO' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Lien visio</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={entretienForm.lienVisio}
                    onChange={e => setEntretienForm(f => ({ ...f, lienVisio: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}
              {entretienForm.typeEntretien === 'PRESENTIEL' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Lieu</label>
                  <input
                    type="text"
                    placeholder="Salle de réunion A, 2ème étage..."
                    value={entretienForm.lieu}
                    onChange={e => setEntretienForm(f => ({ ...f, lieu: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Questions à poser, thèmes à aborder..."
                  value={entretienForm.notes}
                  onChange={e => setEntretienForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {entretienMsg && (
                <p className={`text-sm font-medium px-3 py-2 rounded-lg ${entretienMsg.startsWith('Erreur') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {entretienMsg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEntretienModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={savingEntretien}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {savingEntretien ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : <><Plus className="w-4 h-4" /> Planifier</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
