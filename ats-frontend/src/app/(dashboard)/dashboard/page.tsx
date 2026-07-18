'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, FileText, Target, Clock, Trophy, 
  Search, Bell, ChevronDown, Activity, TrendingUp, TrendingDown,
  CheckCircle2, Info, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell 
} from 'recharts';

import { api, DashboardStats } from '../../../services/api';

// --- Data for Chart & Activity ---
const barData = [
  { name: '41-60', score: 12 },
  { name: '61-70', score: 18 },
  { name: '71-80', score: 26 },
  { name: '81-90', score: 22 },
  { name: '91-100', score: 14 },
];

const activities = [
  { id: 1, user: 'Rachel Morgan', action: 'Accepted candidate', desc: 'Sarah Johnson', time: '2 min ago', icon: CheckCircle2, color: 'text-emerald-500' },
  { id: 2, user: 'Rachel Morgan', action: 'AI Analysis completed', desc: 'Michael Chen — Backend Engineer', time: '18 min ago', icon: Info, color: 'text-blue-500' },
  { id: 3, user: 'Tom Bradley', action: 'Created job position', desc: 'HR Business Partner', time: '1 hour ago', icon: Info, color: 'text-blue-500' },
  { id: 4, user: 'Rachel Morgan', action: 'Uploaded CVs', desc: '8 files uploaded', time: '2 hours ago', icon: Info, color: 'text-blue-500' },
  { id: 5, user: 'Admin', action: 'User created', desc: 'New recruiter: Emily Zhao', time: '4 hours ago', icon: AlertTriangle, color: 'text-amber-500' },
];

// Define the metric card component
const StatCard = ({ title, value, sub, trend, trendValue, icon: Icon, colorClass }: any) => (
  <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-xs font-medium flex items-center ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {trendValue}
      </span>
    </div>
    <h3 className="text-sm text-muted-foreground font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-1">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  useEffect(() => {
    setMounted(true);
    api.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back. Here&apos;s what&apos;s happening today.</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 flex items-center">
          <Activity className="w-4 h-4 mr-2" /> Quick Analyze
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="JOB POSITIONS" value={stats ? stats.totalPostes : '—'} sub={`${stats ? stats.postesActifs : '—'} active`} trend="up" trendValue="Live" icon={Briefcase} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard title="TOTAL CANDIDATES" value={stats ? stats.totalCandidats : '—'} sub="in database" trend="up" trendValue="Live" icon={Users} colorClass="bg-purple-100 text-purple-600" />
        <StatCard title="CANDIDATURES" value={stats ? stats.totalCandidatures : '—'} sub="all submissions" trend="up" trendValue="Live" icon={FileText} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard title="AVG MATCH SCORE" value={stats ? `${stats.scoreMoyenAnalyse.toFixed(1)}%` : '—'} sub="across all analyses" trend="up" trendValue="Live" icon={Target} colorClass="bg-orange-100 text-orange-600" />
        <StatCard title="PENDING" value={stats ? stats.candidaturesEnAttente : '—'} sub="awaiting review" trend="down" trendValue="Live" icon={Clock} colorClass="bg-amber-100 text-amber-600" />
        <StatCard title="ACCEPTED" value={stats ? stats.candidaturesAcceptees : '—'} sub="successful hires" trend="up" trendValue="Live" icon={Trophy} colorClass="bg-cyan-100 text-cyan-600" />
      </div>


      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-4">Applications by Month</h3>
          <div className="h-64 flex items-center justify-center border-dashed border-2 border-border rounded-lg text-muted-foreground">
            [Line Chart Placeholder]
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-4">Candidates by Status</h3>
          <div className="h-64 flex items-center justify-center border-dashed border-2 border-border rounded-lg text-muted-foreground">
            [Donut Chart Placeholder]
          </div>
        </div>
      </div>

      {/* Bottom Section: Score Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">Matching score histogram</p>
          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => <Cell key={`cell-${index}`} fill="#1e3a8a" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-6">
            {activities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex gap-4">
                  <div className={`mt-0.5 ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium">
                      <span className="font-bold">{act.user}</span> {act.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}