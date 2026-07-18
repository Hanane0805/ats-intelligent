'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Upload, Loader2, Users, Mail, X, Link2, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { api, FichePoste } from '../../../services/api';
import { useRouter } from 'next/navigation';

const avatarColors = [
  'bg-amber-500','bg-teal-500','bg-purple-500','bg-rose-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-cyan-500'
];

export default function CandidatesPage() {
  const [candidats, setCandidats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<FichePoste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  useEffect(() => {
    Promise.all([api.getCandidats(), api.getJobs()])
      .then(([c, j]) => { setCandidats(c); setJobs(j.filter(j => j.statut === 'OUVERT')); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidats.filter(c => {
    const term = search.toLowerCase();
    return c.nom?.toLowerCase().includes(term) || c.prenom?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
  });

  const getInitials = (nom: string, prenom: string) =>
    `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || '??';

  const openLinkModal = (candidat: any) => {
    setSelectedCandidat(candidat);
    setSelectedJobId('');
    setLinkError('');
    setLinkSuccess('');
    setShowModal(true);
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    setLinking(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      await api.createCandidature(selectedCandidat.id, Number(selectedJobId));
      const job = jobs.find(j => j.id === Number(selectedJobId));
      setLinkSuccess(`${selectedCandidat.prenom} ${selectedCandidat.nom} a été lié au poste "${job?.titre}" avec succès !`);
      setSelectedJobId('');
    } catch (err: any) {
      setLinkError(err.message || 'Erreur lors de la liaison.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidats.length} candidate{candidats.length !== 1 ? 's' : ''} in database</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => router.push('/analysis')}
            className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload CVs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Chargement des candidats...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100">
            Erreur : {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun candidat trouvé.</p>
            <p className="text-gray-400 text-sm mt-1">
              Uploadez des CVs depuis la page{' '}
              <button onClick={() => router.push('/analysis')} className="text-[#1e3a8a] underline font-medium">
                CV Analysis
              </button>{' '}
              pour commencer.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, idx) => {
                  const initials = getInitials(c.nom, c.prenom);
                  const color = avatarColors[idx % avatarColors.length];
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group bg-white">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${color}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.prenom} {c.nom}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Candidate</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {c.email || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-[#1e3a8a]">#{c.id}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openLinkModal(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white border border-blue-200 hover:border-[#1e3a8a] rounded-lg text-xs font-bold transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5" /> Link to Job
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link to Job Modal */}
      {showModal && selectedCandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Link to a Job Position</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create an application for{' '}
                  <span className="font-bold text-gray-700">{selectedCandidat.prenom} {selectedCandidat.nom}</span>
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLink} className="p-6 flex flex-col gap-4">
              {/* Candidate info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColors[selectedCandidat.id % avatarColors.length]}`}>
                  {getInitials(selectedCandidat.nom, selectedCandidat.prenom)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedCandidat.prenom} {selectedCandidat.nom}</p>
                  <p className="text-xs text-gray-500">{selectedCandidat.email}</p>
                </div>
              </div>

              {/* Job select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Select Job Position <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(e.target.value)}
                    required
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all pr-10"
                  >
                    <option value="">— Choose a position —</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.titre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {jobs.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium">No open positions available. Create a job first.</p>
                )}
              </div>

              {/* Feedback */}
              {linkError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{linkSuccess}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={linking || !selectedJobId}
                  className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {linking ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking...</> : <><Link2 className="w-4 h-4" /> Create Application</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
