'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Briefcase, Loader2, X, AlertCircle, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { api, FichePoste, auth } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function JobPositionsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [jobs, setJobs] = useState<FichePoste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create Position Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ titre: '', description: '' });

  // Apply Modal state (CV upload)
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<FichePoste | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<ReturnType<typeof auth.getUser>>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentUser(auth.getUser());
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    api.getJobs()
      .then(setJobs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    if (!currentUser?.id) {
      setCreateError("Utilisateur non connecté.");
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await api.createJob({
        titre: form.titre,
        description: form.description,
        recruteurId: currentUser.id,
      });
      setShowModal(false);
      setForm({ titre: '', description: '' });
      fetchJobs();
    } catch (err: any) {
      setCreateError(err.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ===== APPLY WITH CV =====
  const handleApplyClick = (job: FichePoste) => {
    setSelectedJobForApply(job);
    setCvFile(null);
    setApplySuccess(false);
    setApplyError('');
    setShowApplyModal(true);
  };

  // ===== SOUMISSION DE LA CANDIDATURE (CORRIGÉE) =====
  const submitApplication = async () => {
    if (!selectedJobForApply || !cvFile || !currentUser?.id) {
      setApplyError('Informations manquantes (candidat, fichier, poste).');
      return;
    }
    setSubmittingApply(true);
    setApplyError('');

    try {
      // 1. Créer la candidature (le paramètre attendu est l'ID du poste)
      await api.createCandidature(currentUser.id, selectedJobForApply.id);

      // 2. Upload du CV (chemin avec l'ID dans l'URL, PAS en query string)
      const formData = new FormData();
      formData.append('file', cvFile);

           const token = localStorage.getItem('ats_token') || '';
      const uploadRes = await fetch('http://localhost:8080/api/documents-cv/upload/' + currentUser.id, {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
       throw new Error(err.message || err.error || JSON.stringify(err) || 'Erreur upload CV');
      }

      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Erreur upload:', err);
      if (err.response) {
        setApplyError(`Erreur ${err.response.status} : ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setApplyError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setApplyError(err.message || 'Erreur lors de la candidature.');
      }
    } finally {
      setSubmittingApply(false);
    }
  };

  const filtered = jobs.filter(j => {
    const matchesTab = activeTab === 'All' ||
      (activeTab === 'Active' && j.statut === 'OUVERT') ||
      (activeTab === 'Closed' && j.statut === 'FERME');
    const matchesSearch = j.titre.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentUser?.role === 'CANDIDAT' ? t('jobs.titleCandidate') : t('jobs.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} {currentUser?.role === 'CANDIDAT' ? t('jobs.offers') : t('jobs.positions')} {t('common.total')}</p>
        </div>
        {currentUser?.role !== 'CANDIDAT' && (
          <button
            onClick={() => { setShowModal(true); setCreateError(''); }}
            className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> {t('jobs.createBtn')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search positions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {['All', 'Active', 'Closed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Chargement des postes...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100">
            Erreur : {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun poste trouvé.</p>
            <p className="text-gray-400 text-sm mt-1">Créez votre premier poste en cliquant sur &ldquo;Create Position&rdquo;.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Position Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Recruiter</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Posted</th>
                  {currentUser?.role === 'CANDIDAT' && <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer bg-white">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50/50 flex items-center justify-center border border-blue-100 flex-shrink-0 text-[#1e3a8a]">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors">{job.titre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{job.recruteurNom || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 max-w-[220px] truncate">
                      {job.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {job.statut === 'OUVERT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Closed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                      {formatDate(job.dateCreation)}
                    </td>
                    {currentUser?.role === 'CANDIDAT' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyClick(job);
                          }}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Postuler
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== APPLY WITH CV MODAL ===== */}
      {showApplyModal && selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Postuler</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selectedJobForApply.titre}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {applySuccess ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-lg">Candidature envoyée !</p>
                    <p className="text-sm text-gray-500 mt-1">Votre CV a été soumis avec succès.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Job summary */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Briefcase className="w-5 h-5 text-[#1e3a8a] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{selectedJobForApply.titre}</p>
                      <p className="text-xs text-gray-500">{selectedJobForApply.recruteurNom || 'Recruteur'}</p>
                    </div>
                  </div>

                  {/* CV Upload Zone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      Votre CV <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="file"
                      ref={cvInputRef}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCvFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      onClick={() => cvInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                        ${cvFile
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : 'border-gray-200 hover:border-[#1e3a8a] hover:bg-blue-50/30'
                        }
                      `}
                    >
                      {cvFile ? (
                        <>
                          <FileText className="w-8 h-8 text-emerald-600 mb-2" />
                          <p className="text-sm font-bold text-gray-900">{cvFile.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{(cvFile.size / 1024).toFixed(1)} KB</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700">Cliquez pour sélectionner votre CV</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — Max 10 MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {applyError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {applyError}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={submitApplication}
                      disabled={submittingApply || !cvFile}
                      className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      {submittingApply
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                        : <><Upload className="w-4 h-4" /> Envoyer ma candidature</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE POSITION MODAL (Recruiter only) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create New Position</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the details for the new job opening</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                <Briefcase className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
                <p className="text-xs font-medium text-[#1e3a8a]">
                  Created by: <span className="font-bold">{currentUser?.prenom} {currentUser?.nom}</span>
                </p>
              </div>

              {createError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.titre.trim()}
                  className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Position</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}