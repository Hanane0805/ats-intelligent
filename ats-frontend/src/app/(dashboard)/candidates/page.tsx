'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Upload, Loader2, Users, Mail, X, Link2, AlertCircle, CheckCircle2, ChevronDown, FileText, Trash2, Eye, CloudUpload, Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react';
import { api, FichePoste } from '../../../services/api';
import { useRouter } from 'next/navigation';

const avatarColors = [
  'bg-amber-500','bg-teal-500','bg-purple-500','bg-rose-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-cyan-500'
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchCVs(candidatId: number): Promise<any[]> {
  const token = localStorage.getItem('ats_token');
  const res = await fetch(`${API_BASE}/api/documents-cv/candidat/${candidatId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}

async function uploadCV(candidatId: number, file: File): Promise<any> {
  const token = localStorage.getItem('ats_token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/documents-cv/upload/${candidatId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Erreur lors de l\'upload');
  return data;
}

async function deleteCV(docId: number): Promise<void> {
  const token = localStorage.getItem('ats_token');
  await fetch(`${API_BASE}/api/documents-cv/${docId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export default function CandidatesPage() {
  const [candidats, setCandidats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<FichePoste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'nom' | 'prenom' | 'id'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  // Link-to-job modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // CV Upload modal
  const [showCVModal, setShowCVModal] = useState(false);
  const [cvCandidat, setCvCandidat] = useState<any>(null);
  const [cvList, setCvList] = useState<any[]>([]);
  const [cvLoading, setCvLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, j] = await Promise.all([api.getCandidats(), api.getJobs()]);
      setCandidats(c);
      setJobs(j.filter((j: FichePoste) => j.statut === 'OUVERT'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = candidats
    .filter(c => {
      const term = search.toLowerCase();
      return c.nom?.toLowerCase().includes(term) || c.prenom?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const valA = (a[sortBy] || '').toString().toLowerCase();
      const valB = (b[sortBy] || '').toString().toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const toggleSort = (col: 'nom' | 'prenom' | 'id') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Prénom', 'Nom', 'Email'];
    const rows = filtered.map(c => [c.id, c.prenom || '', c.nom || '', c.email || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'candidats.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (nom: string, prenom: string) =>
    `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || '??';

  // --- Link to Job ---
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

  // --- CV Upload ---
  const openCVModal = async (candidat: any) => {
    setCvCandidat(candidat);
    setUploadError('');
    setUploadSuccess('');
    setShowCVModal(true);
    setCvLoading(true);
    try {
      const docs = await fetchCVs(candidat.id);
      setCvList(docs);
    } catch {
      setCvList([]);
    } finally {
      setCvLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!cvCandidat) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setUploadError('Seuls les fichiers PDF, DOC et DOCX sont acceptés.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la limite de 10 MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      await uploadCV(cvCandidat.id, file);
      setUploadSuccess('CV téléversé avec succès !');
      const docs = await fetchCVs(cvCandidat.id);
      setCvList(docs);
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDeleteCV = async (docId: number) => {
    if (!confirm('Supprimer ce CV ?')) return;
    try {
      await deleteCV(docId);
      setCvList(prev => prev.filter(d => d.id !== docId));
    } catch {
      setUploadError('Erreur lors de la suppression.');
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
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
          </button>
          <button
            onClick={exportCSV}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
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
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Tri :</span>
            {(['nom','prenom','id'] as const).map(col => (
              <button key={col} onClick={() => toggleSort(col)}
                className={`px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                  sortBy === col ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {col === 'nom' ? 'Nom' : col === 'prenom' ? 'Prénom' : 'ID'}
                {sortBy === col && (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
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
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none" onClick={() => toggleSort('prenom')}>
                    <span className="flex items-center gap-1">Candidate {sortBy === 'prenom' && (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none" onClick={() => toggleSort('id')}>
                    <span className="flex items-center gap-1">ID {sortBy === 'id' && (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                      <div className="flex items-center justify-end gap-2">
                          {/* Detail page button */}
                          <button
                            onClick={() => router.push(`/candidates/${c.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-700 text-gray-600 hover:text-white border border-gray-200 hover:border-gray-700 rounded-lg text-xs font-bold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Détail
                          </button>
                          {/* Upload CV button */}
                          <button
                            onClick={() => openCVModal(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-xs font-bold transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" /> CV
                          </button>
                          {/* Link to job button */}
                          <button
                            onClick={() => openLinkModal(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white border border-blue-200 hover:border-[#1e3a8a] rounded-lg text-xs font-bold transition-all"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Link to Job
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CV Upload Modal ── */}
      {showCVModal && cvCandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gestion des CVs</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-bold text-gray-700">{cvCandidat.prenom} {cvCandidat.nom}</span>
                </p>
              </div>
              <button onClick={() => setShowCVModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-emerald-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-medium text-sm">Téléversement en cours...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <CloudUpload className={`w-10 h-10 transition-colors ${dragOver ? 'text-emerald-500' : ''}`} />
                    <p className="font-semibold text-gray-600">Glissez un fichier ici</p>
                    <p className="text-xs">ou <span className="text-emerald-600 font-bold">cliquez pour choisir</span></p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 10 MB</p>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {uploadError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{uploadSuccess}
                </div>
              )}

              {/* Existing CVs */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">CVs existants</p>
                {cvLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                  </div>
                ) : cvList.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">Aucun CV téléversé pour ce candidat.</p>
                ) : (
                  <div className="space-y-2">
                    {cvList.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{doc.nomFichier}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{doc.dateUpload}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <a
                            href={`${API_BASE}/api/documents-cv/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir le CV"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteCV(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Link to Job Modal ── */}
      {showModal && selectedCandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Link to a Job Position</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create an application for{' '}
                  <span className="font-bold text-gray-700">{selectedCandidat.prenom} {selectedCandidat.nom}</span>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLink} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColors[selectedCandidat.id % avatarColors.length]}`}>
                  {getInitials(selectedCandidat.nom, selectedCandidat.prenom)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedCandidat.prenom} {selectedCandidat.nom}</p>
                  <p className="text-xs text-gray-500">{selectedCandidat.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Select Job Position <span className="text-rose-500">*</span></label>
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
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Close
                </button>
                <button type="submit" disabled={linking || !selectedJobId} className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
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
