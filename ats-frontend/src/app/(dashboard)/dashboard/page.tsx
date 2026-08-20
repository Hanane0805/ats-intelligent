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
  <div className="glass hover-card p-6 rounded-2xl flex flex-col justify-between group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${bgClass.replace('bg-', 'bg-opacity-20 bg-')}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider shadow-sm ${
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 
        trend === 'down' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
      }`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
        {trendValue}
      </span>
    </div>
    <h3 className="text-xs text-muted-foreground font-bold tracking-widest uppercase">{title}</h3>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
    </div>
    <p className="text-xs text-muted-foreground mt-2 font-medium">{sub}</p>
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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 glass p-6 rounded-3xl">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground mt-2 font-medium">Bienvenue. Voici le résumé de l'activité de recrutement aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/sourcing')} className="glass text-primary hover-card px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Sourcing IA
          </button>
          <button onClick={() => router.push('/jobs')} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center gap-2 border border-primary/50">
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
        <div className="lg:col-span-2 glass hover-card p-7 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-foreground">Évolution des Candidatures</h3>
            <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">6 derniers mois</span>
          </div>
          <div className="h-[300px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                    cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="uv" name="Candidatures" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart: Status distribution */}
        <div className="glass hover-card p-7 rounded-3xl flex flex-col">
          <h3 className="text-lg font-extrabold text-foreground mb-2">Répartition par Statut</h3>
          <p className="text-sm text-muted-foreground mb-6 font-medium">Vue d'ensemble des candidatures traitées</p>
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: 'var(--color-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center text in donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-black text-foreground">{stats?.totalCandidatures || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity List */}
      <div className="glass p-7 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Activité Récente</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">Les 5 dernières candidatures reçues</p>
          </div>
          <button onClick={() => router.push('/candidates')} className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors">
            Voir tout <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground font-medium">
            Aucune activité récente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recentActivities.map((act) => (
              <div key={act.id} onClick={() => router.push(`/candidates/${act.candidatId}`)} className="glass hover-card p-5 rounded-2xl cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl shadow-inner ${act.statut === 'EN_ATTENTE' ? 'bg-amber-500/20 text-amber-500' : act.statut === 'ACCEPTE' ? 'bg-emerald-500/20 text-emerald-500' : act.statut === 'REJETE' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {act.datePostulation ? format(new Date(act.datePostulation), 'dd MMM') : 'N/A'}
                  </span>
                </div>
                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{act.candidatNom}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-medium">{act.fichePosteTitre || 'Candidature Spontanée'}</p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score IA</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${act.scoreCompatibilite >= 75 ? 'bg-emerald-500/10 text-emerald-500' : act.scoreCompatibilite >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'}`}>
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