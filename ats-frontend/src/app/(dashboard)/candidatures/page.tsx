'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, KanbanSquare, CheckCircle, Clock, Search, Briefcase, FileText, CalendarDays } from 'lucide-react';
import { api, Candidature } from '../../../services/api';

const STATUS_COLUMNS = [
  { id: 'EN_ATTENTE', title: 'À traiter', color: 'bg-amber-100', borderColor: 'border-amber-200', headerColor: 'bg-amber-500' },
  { id: 'EN_ANALYSE', title: 'En analyse', color: 'bg-purple-100', borderColor: 'border-purple-200', headerColor: 'bg-purple-500' },
  { id: 'ENTRETIEN', title: 'Entretien', color: 'bg-blue-100', borderColor: 'border-blue-200', headerColor: 'bg-blue-500' },
  { id: 'ACCEPTE', title: 'Accepté', color: 'bg-emerald-100', borderColor: 'border-emerald-200', headerColor: 'bg-emerald-500' },
  { id: 'REJETE', title: 'Rejeté', color: 'bg-rose-100', borderColor: 'border-rose-200', headerColor: 'bg-rose-500' },
];

export default function CandidaturesKanbanPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const fetchCandidatures = () => {
    setLoading(true);
    api.getCandidatures()
      .then(data => {
        setCandidatures(data);
        setError('');
      })
      .catch(err => setError(err.message || "Erreur lors du chargement des candidatures"))
      .finally(() => setLoading(false));
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', id.toString());
    
    // Create a custom drag image (optional, to make it look nicer)
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverColumn(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedId) return;

    const candidature = candidatures.find(c => c.id === draggedId);
    if (!candidature || candidature.statut === columnId) return;

    // Optimistic UI update
    const previousStatut = candidature.statut;
    setCandidatures(prev => prev.map(c => 
      c.id === draggedId ? { ...c, statut: columnId } : c
    ));

    try {
      await api.updateCandidatureStatus(draggedId, columnId);
    } catch (err: any) {
      // Revert on error
      console.error("Failed to update status", err);
      setCandidatures(prev => prev.map(c => 
        c.id === draggedId ? { ...c, statut: previousStatut } : c
      ));
      alert("Erreur lors de la mise à jour du statut : " + err.message);
    }
  };

  // Filter
  const filteredCandidatures = candidatures.filter(c => {
    const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
    const role = c.posteTitre?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || role.includes(term);
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="font-medium">Chargement du pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-gray-50/30">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-primary" />
            Pipeline des Candidatures
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez vos candidats par simple glisser-déposer.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un candidat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {STATUS_COLUMNS.map(col => {
          const colCandidatures = filteredCandidatures.filter(c => c.statut === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div 
              key={col.id}
              className={`flex-shrink-0 w-80 flex flex-col rounded-xl border transition-all duration-200 ${
                isOver ? 'border-primary ring-2 ring-primary/20 bg-gray-50' : 'border-gray-200 bg-gray-100/50'
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.headerColor}`} />
                  <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                  {colCandidatures.length}
                </span>
              </div>

              {/* Column Body / Cards List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {colCandidatures.map(c => {
                  const score = Math.round((c.scoreCompatibilite || 0) * 100);
                  const isDragging = draggedId === c.id;

                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white p-4 rounded-xl border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
                        isDragging ? 'border-primary opacity-50 scale-95' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-900 text-sm truncate pr-2">
                          {c.prenom} {c.nom}
                        </div>
                        {score > 0 && (
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${
                            score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {score}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-1 truncate">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{c.posteTitre || 'Candidature Spontanée'}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
                        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                        {new Date(c.datePostulation).toLocaleDateString()}
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs font-medium text-gray-500 hover:text-primary flex items-center gap-1">
                          <FileText className="w-3 h-3" /> CV
                        </button>
                        <a href={`/rankings`} className="text-xs font-medium text-primary hover:underline">
                          Détails &rarr;
                        </a>
                      </div>
                    </div>
                  );
                })}

                {colCandidatures.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs text-center px-4">
                    Glissez un candidat ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
