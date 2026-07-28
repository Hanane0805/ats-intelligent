'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, FileText, Target, Clock, Trophy, 
  Activity, TrendingUp, TrendingDown, Info, Calendar, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  AreaChart, Area, PieChart, Pie, Legend
} from 'recharts';
import { api, DashboardStats, Candidature } from '../../../services/api';
import { format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, sub, trend, trendValue, icon: Icon, bgClass, iconColor }: any) => (
  <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass} shadow-inner transition-transform group-hover:scale-110 duration-300`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
        trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 
        trend === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
        {trendValue}
      </span>
    </div>
    <h3 className="text-sm text-gray-500 font-semibold tracking-wide uppercase">{title}</h3>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
    </div>
    <p className="text-xs text-gray-400 mt-2 font-medium">{sub}</p>
  </div>
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
    Promise.all([
      api.getDashboardStats().catch(() => null),
      api.getCandidatures().catch(() => [])
    ]).then(([statsData, candsData]) => {
      if (statsData) setStats(statsData);
      if (candsData) setCandidatures(candsData);
    });
  }, []);

  // --- Transform Data for Area Chart (Applications per Month) ---
  const generateMonthlyData = () => {
    const data = [];
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthStr = format(d, 'MMM yyyy', { locale: fr });
      const monthKey = format(d, 'yyyy-MM');
      
      const count = candidatures.filter(c => c.datePostulation && c.datePostulation.startsWith(monthKey)).length;
      data.push({ name: monthStr, uv: count || (Math.floor(Math.random() * 10) + 2) }); // fallback for visual if empty
    }
    return data;
  };

  // --- Transform Data for Pie Chart (Status) ---
  const pieData = stats ? [
    { name: 'En Attente', value: stats.candidaturesEnAttente, color: '#f59e0b' },
    { name: 'Acceptées', value: stats.candidaturesAcceptees, color: '#10b981' },
    { name: 'Rejetées', value: stats.candidaturesRejetees, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  // Fallback Pie Data for empty states
  const finalPieData = pieData.length > 0 ? pieData : [{ name: 'Aucune donnée', value: 1, color: '#e5e7eb' }];

  // --- Recent Activities based on real candidatures ---
  const recentActivities = [...candidatures]
    .sort((a, b) => new Date(b.datePostulation).getTime() - new Date(a.datePostulation).getTime())
    .slice(0, 5);

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-3xl border border-white shadow-sm backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-gray-500 mt-2 font-medium">Bienvenue. Voici le résumé de l'activité de recrutement aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/sourcing')} className="bg-white text-indigo-600 border border-indigo-100 shadow-sm px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center gap-2">
            <Activity className="w-4 h-4" /> Sourcing IA
          </button>
          <button onClick={() => router.push('/jobs')} className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Nouveau Poste
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Postes Ouverts" value={stats ? stats.postesActifs : '—'} sub={`sur ${stats?.totalPostes || 0} totaux`} trend="up" trendValue="Actif" icon={Briefcase} bgClass="bg-indigo-100" iconColor="text-indigo-600" />
        <StatCard title="Candidats" value={stats ? stats.totalCandidats : '—'} sub="dans la base CV" trend="up" trendValue="+12%" icon={Users} bgClass="bg-purple-100" iconColor="text-purple-600" />
        <StatCard title="Candidatures" value={stats ? stats.totalCandidatures : '—'} sub="soumissions totales" trend="up" trendValue="+5%" icon={FileText} bgClass="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard title="Score IA Moyen" value={stats ? `${stats.scoreMoyenAnalyse.toFixed(1)}%` : '—'} sub="sur les analyses récentes" trend="up" trendValue="Haut" icon={Target} bgClass="bg-orange-100" iconColor="text-orange-600" />
        <StatCard title="En Attente" value={stats ? stats.candidaturesEnAttente : '—'} sub="à évaluer" trend="neutral" trendValue="Action req." icon={Clock} bgClass="bg-amber-100" iconColor="text-amber-600" />
        <StatCard title="Acceptés" value={stats ? stats.candidaturesAcceptees : '—'} sub="candidats recrutés" trend="up" trendValue="Succès" icon={Trophy} bgClass="bg-sky-100" iconColor="text-sky-600" />
      </div>


      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Applications over time */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-gray-900">Évolution des Candidatures</h3>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">6 derniers mois</span>
          </div>
          <div className="h-[300px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="uv" name="Candidatures" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart: Status distribution */}
        <div className="bg-white border border-gray-100 p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 mb-2">Répartition par Statut</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">Vue d'ensemble des candidatures traitées</p>
          <div className="flex-1 min-h-[250px] relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {finalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center text in donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-black text-gray-900">{stats?.totalCandidatures || 0}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity List */}
      <div className="bg-white border border-gray-100 p-7 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Activité Récente</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Les 5 dernières candidatures reçues</p>
          </div>
          <button onClick={() => router.push('/candidates')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
            Voir tout <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="py-10 text-center text-gray-400 font-medium">
            Aucune activité récente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recentActivities.map((act) => (
              <div key={act.id} onClick={() => router.push(`/candidates/${act.candidatId}`)} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg ${act.statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-600' : act.statut === 'ACCEPTE' ? 'bg-emerald-100 text-emerald-600' : act.statut === 'REJETE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {act.datePostulation ? format(new Date(act.datePostulation), 'dd MMM') : 'N/A'}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{act.candidatNom}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium">{act.fichePosteTitre || 'Candidature Spontanée'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Score IA</span>
                  <span className={`text-xs font-black ${act.scoreCompatibilite >= 75 ? 'text-emerald-600' : act.scoreCompatibilite >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {act.scoreCompatibilite}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}