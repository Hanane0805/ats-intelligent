'use client';

import React, { useState, useEffect } from 'react';
import { History, Loader2, FileText, ArrowRight, Activity } from 'lucide-react';
import { api } from '../../../services/api';

export default function HistoryPage() {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setLoading(true);
    api.getHistory()
      .then(data => {
        // Sort descending by date
        const sorted = data.sort((a, b) => new Date(b.dateChangement).getTime() - new Date(a.dateChangement).getTime());
        setHistoryLogs(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const getStatusColor = (statut: string) => {
    const s = statut?.toUpperCase() || '';
    if (s.includes('ACCEPTE')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (s.includes('REJETE')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (s.includes('ENTRETIEN') || s.includes('ANALYSE')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment History</h1>
          <p className="text-sm text-gray-500 mt-1">Timeline of all candidate status changes and activities</p>
        </div>
        <button 
          onClick={fetchHistory}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <History className="w-4 h-4" /> Refresh Timeline
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-2 p-6">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading history...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100 rounded-lg">
            Error : {error}
          </div>
        )}

        {!loading && !error && historyLogs.length === 0 && (
          <div className="py-20 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No history events found.</p>
            <p className="text-sm text-gray-400 mt-1">Status changes from the Rankings page will appear here.</p>
          </div>
        )}

        {!loading && !error && historyLogs.length > 0 && (
          <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-8 py-4">
            {historyLogs.map((log) => {
              const dateObj = new Date(log.dateChangement);
              const oldTheme = getStatusColor(log.ancienStatut);
              const newTheme = getStatusColor(log.nouveauStatut);

              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[35px] bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {log.candidatNom || 'Unknown Candidate'}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> {log.posteTitre || 'Unknown Position'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{dateObj.toLocaleDateString()}</p>
                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">{dateObj.toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 mt-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${oldTheme}`}>
                        {log.ancienStatut || 'NO STATUS'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${newTheme}`}>
                        {log.nouveauStatut}
                      </span>
                    </div>

                    {log.commentaire && (
                      <p className="text-sm text-gray-600 mt-3 pl-1 italic">
                        "{log.commentaire}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
