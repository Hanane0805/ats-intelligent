'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Search, Filter, ShieldAlert, History } from 'lucide-react';
import { api } from '../../../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    api.getAuditLogs()
      .then(data => {
        // Sort by date descending
        const sorted = data.sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime());
        setLogs(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const filtered = logs.filter(l => {
    const term = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.utilisateurNom && l.utilisateurNom.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term))
    );
  });

  const getActionTheme = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('LOGIN') || a.includes('CONNEXION')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (a.includes('DELETE') || a.includes('SUPPRESSION') || a.includes('FAIL')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (a.includes('CREATE') || a.includes('CREATION') || a.includes('AJOUT')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (a.includes('UPDATE') || a.includes('MODIFICATION')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Track and monitor all activities across the platform</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <History className="w-4 h-4" /> Refresh Logs
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-2">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative max-w-md w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by action, user or details..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading audit logs...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100">
            Error : {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No logs found.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((log) => {
                  const dateObj = new Date(log.dateAction);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors bg-white group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors">
                          {dateObj.toLocaleDateString()}
                        </p>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">
                          {dateObj.toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">
                        {log.utilisateurNom || 'Système'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionTheme(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-gray-500">
                        {log.adresseIP || '127.0.0.1'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
