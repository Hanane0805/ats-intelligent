'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Briefcase, Loader2, X, AlertCircle } from 'lucide-react';
import { api, FichePoste, auth } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function JobPositionsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [jobs, setJobs] = useState<FichePoste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ titre: '', description: '' });

  // Read user client-side only to avoid SSR/hydration mismatch
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
                            api.createCandidature(currentUser.id, job.id)
                              .then(() => alert('Candidature envoyée avec succès !'))
                              .catch((err) => alert('Erreur : ' + err.message));
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

      {/* Create Position Modal */}
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