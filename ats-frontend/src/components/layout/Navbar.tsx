'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Users, Briefcase, FileText, X, Loader2, Menu } from 'lucide-react';
import { auth, User, api } from '../../services/api';
import NotificationCenter from '../NotificationCenter';
import { useRouter } from 'next/navigation';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ candidats: any[]; jobs: any[]; candidatures: any[] }>({ candidats: [], jobs: [], candidatures: [] });
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => { setUser(auth.getUser()); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults({ candidats: [], jobs: [], candidatures: [] });
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const term = debouncedQuery.toLowerCase();
    Promise.all([api.getCandidats(), api.getJobs(), api.getCandidatures()])
      .then(([candidats, jobs, candidatures]) => {
        setResults({
          candidats: candidats.filter((c: any) =>
            `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(term)
          ).slice(0, 4),
          jobs: jobs.filter((j: any) =>
            (j.titre || '').toLowerCase().includes(term)
          ).slice(0, 3),
          candidatures: candidatures.filter((c: any) =>
            (c.candidatNom || '').toLowerCase().includes(term) ||
            (c.fichePosteTitre || '').toLowerCase().includes(term)
          ).slice(0, 3),
        });
        setShowDropdown(true);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const total = results.candidats.length + results.jobs.length + results.candidatures.length;

  const navigate = (path: string) => {
    setQuery('');
    setShowDropdown(false);
    router.push(path);
  };

  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center gap-2 sm:gap-4 justify-between px-3 sm:px-6 flex-shrink-0 shadow-sm">

      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search */}
      <div className="relative flex-1 min-w-0 max-w-sm" ref={searchRef}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />}
        {query && !searching && (
          <button onClick={() => { setQuery(''); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input
          type="text"
          placeholder="Rechercher candidats, postes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => total > 0 && setShowDropdown(true)}
          className="w-full min-w-0 pl-10 pr-9 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-11 left-0 w-[92vw] sm:w-[420px] max-w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {total === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Aucun résultat pour « {query} »</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {/* Candidats */}
                {results.candidats.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-3 h-3" /> Candidats
                    </p>
                    {results.candidats.map((c: any) => (
                      <button key={c.id} onClick={() => navigate(`/candidates/${c.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {`${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.prenom} {c.nom}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                        <span className="ml-auto text-xs text-gray-300 flex-shrink-0">#{c.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Jobs */}
                {results.jobs.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Postes
                    </p>
                    {results.jobs.map((j: any) => (
                      <button key={j.id} onClick={() => navigate('/jobs')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{j.titre}</p>
                          <p className="text-xs text-gray-400">{j.statut}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Candidatures */}
                {results.candidatures.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Candidatures
                    </p>
                    {results.candidatures.map((c: any) => (
                      <button key={c.id} onClick={() => navigate('/candidatures')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.candidatNom}</p>
                          <p className="text-xs text-gray-400 truncate">{c.fichePosteTitre} · {c.statut}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
                  {total} résultat{total > 1 ? 's' : ''} · Appuyez sur Entrée pour rechercher
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <NotificationCenter />
        <div className="hidden sm:block h-8 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer flex-shrink-0"
            onClick={() => router.push('/profil')}>
            {user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : '??'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user ? `${user.prenom} ${user.nom}` : '...'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Recruteur'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}