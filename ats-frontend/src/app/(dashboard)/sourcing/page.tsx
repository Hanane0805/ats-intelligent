'use client';

import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Users, FileText, ArrowRight, Activity, Filter, BrainCircuit } from 'lucide-react';
import { api } from '../../../services/api';
import { useRouter } from 'next/navigation';

export default function SourcingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.semanticSearch(query);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmbedAll = async () => {
    try {
      if (confirm('Voulez-vous regénérer les vecteurs pour tous les CV existants ? (Cette opération peut prendre du temps)')) {
        await api.embedAllExistingCVs();
        alert('Génération lancée !');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" /> Sourcing Intelligent (RAG)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Recherche sémantique de candidats dans tout le vivier de CVs.</p>
        </div>
        <button onClick={handleEmbedAll} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
          Indexation globale (Sync)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'Développeur Java avec expérience bancaire et React' ou 'Expert comptable anglais courant'"
            className="w-full pl-12 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Chercher
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-2">
            Résultats ({results.length})
          </p>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
               <Loader2 className="w-8 h-8 animate-spin mb-4" />
               <p className="text-sm font-medium">Recherche sémantique en cours...</p>
             </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun candidat correspondant trouvé.</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de formuler votre recherche différemment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((c, i) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {`${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{c.prenom} {c.nom}</h3>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      <BrainCircuit className="w-3 h-3" /> Match Sémantique
                    </span>
                    <button 
                      onClick={() => router.push(`/candidates/${c.id}`)}
                      className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Voir le profil <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
