'use client';

import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Target, Clock, Award, Users, Briefcase, CheckCircle2, XCircle, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api, DashboardStats } from '../../../services/api';

const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_ANALYSE: 'En analyse',
  ENTRETIEN: 'Entretien',
  ACCEPTE: 'Accepté',
  REJETE: 'Rejeté',
};

export default function StatisticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getCandidatures()])
      .then(([s, c]) => { setStats(s); setCandidatures(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Pipeline breakdown
  const pipelineData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: candidatures.filter(c => c.statut === key).length,
  })).filter(d => d.value > 0);

  // Score distribution
  const scoreBuckets = [
    { name: '0–25%', count: 0 }, { name: '26–50%', count: 0 },
    { name: '51–75%', count: 0 }, { name: '76–100%', count: 0 },
  ];
  candidatures.forEach(c => {
    const s = Math.round((c.scoreCompatibilite || 0) * 100);
    if (s <= 25) scoreBuckets[0].count++;
    else if (s <= 50) scoreBuckets[1].count++;
    else if (s <= 75) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  });

  // Accepted vs rejected
  const accepted = candidatures.filter(c => c.statut === 'ACCEPTE').length;
  const rejected = candidatures.filter(c => c.statut === 'REJETE').length;
  const hiringRate = candidatures.length > 0
    ? Math.round((accepted / candidatures.length) * 100)
    : 0;

  const avgScore = candidatures.length > 0
    ? Math.round(candidatures.reduce((sum, c) => sum + (c.scoreCompatibilite || 0), 0) / candidatures.length * 100)
    : 0;

  const exportStatsCSV = () => {
    const rows = [
      ['Métrique', 'Valeur'],
      ['Total candidats', stats?.totalCandidats ?? 0],
      ['Total candidatures', stats?.totalCandidatures ?? 0],
      ['Postes actifs', stats?.postesActifs ?? 0],
      ['Taux d\'embauche', `${hiringRate}%`],
      ['Score IA moyen', `${avgScore}%`],
      ['Candidatures acceptées', accepted],
      ['Candidatures rejetées', rejected],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'statistiques-ats.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: 'Total Candidats', value: stats?.totalCandidats ?? '—', icon: Users, color: 'bg-blue-50 text-blue-600', trend: null },
    { label: 'Total Candidatures', value: stats?.totalCandidatures ?? '—', icon: Briefcase, color: 'bg-purple-50 text-purple-600', trend: null },
    { label: 'Taux d\'embauche', value: `${hiringRate}%`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', trend: null },
    { label: 'Score IA moyen', value: `${avgScore}%`, icon: Target, color: 'bg-amber-50 text-amber-600', trend: null },
    { label: 'Postes actifs', value: stats?.postesActifs ?? '—', icon: BarChart2, color: 'bg-indigo-50 text-indigo-600', trend: null },
    { label: 'Acceptés', value: accepted, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', trend: null },
    { label: 'Rejetés', value: rejected, icon: XCircle, color: 'bg-rose-50 text-rose-600', trend: null },
    { label: 'En attente', value: stats?.candidaturesEnAttente ?? '—', icon: Clock, color: 'bg-orange-50 text-orange-600', trend: null },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Données en temps réel de votre pipeline de recrutement</p>
        </div>
        <button
          onClick={exportStatsCSV}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Pipeline Pie */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-1">Pipeline par statut</h3>
              <p className="text-xs text-gray-400 mb-5">Répartition des candidatures</p>
              {pipelineData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune candidature</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}>
                        {pipelineData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs font-medium text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Score Distribution Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-1">Distribution des scores IA</h3>
              <p className="text-xs text-gray-400 mb-5">Nombre de candidatures par tranche de score</p>
              {candidatures.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune candidature analysée</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(v: any) => [v, 'Candidatures']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {scoreBuckets.map((_, idx) => <Cell key={idx} fill={['#ef4444','#f59e0b','#3b82f6','#10b981'][idx]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Accepted vs Rejected */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Acceptés vs Rejetés</h3>
            <div className="flex items-center gap-6">
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-emerald-700">✅ Acceptés</span>
                    <span className="font-bold">{accepted}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: candidatures.length ? `${(accepted / candidatures.length) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-rose-600">❌ Rejetés</span>
                    <span className="font-bold">{rejected}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-rose-500 h-3 rounded-full transition-all" style={{ width: candidatures.length ? `${(rejected / candidatures.length) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-amber-600">⏳ En cours</span>
                    <span className="font-bold">{candidatures.length - accepted - rejected}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-amber-400 h-3 rounded-full transition-all" style={{ width: candidatures.length ? `${((candidatures.length - accepted - rejected) / candidatures.length) * 100}%` : '0%' }} />
                  </div>
                </div>
              </div>
              <div className="text-center flex-shrink-0 w-32">
                <p className="text-5xl font-black text-[#1e3a8a]">{hiringRate}%</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Taux d'embauche</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
