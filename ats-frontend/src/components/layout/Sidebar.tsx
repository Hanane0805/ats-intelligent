'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Briefcase, Users, FileText, BarChart2, 
  History, Settings, Shield, UserCog, ClipboardList, LogOut, Bot,
  Activity
} from 'lucide-react';
import { auth, User } from '../../services/api';

const recruitingLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Positions', href: '/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'CV Analysis', href: '/analysis', icon: FileText },
  { name: 'Rankings', href: '/rankings', icon: BarChart2 },
  { name: 'History', href: '/history', icon: History },
  { name: 'Statistics', href: '/stats', icon: Activity },
  { name: 'Profile', href: '/profil', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminLinks = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/users', icon: UserCog },
  { name: 'Role Management', href: '/roles', icon: ClipboardList },
  { name: 'Audit Logs', href: '/logs', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);


  return (
    <aside className="w-64 bg-[#1e3a8a] text-blue-100 flex flex-col min-h-screen flex-shrink-0 shadow-xl">
      {/* Logo & Branding */}
      <div className="p-6 pb-4">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Bot className="w-8 h-8 text-emerald-400" /> ATS Intelligent
        </h1>
        <p className="text-blue-300 text-[10px] uppercase tracking-wider ml-10">AI Recruitment Platform</p>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 mt-4 px-4">Recruiting</p>
        <div className="space-y-1">
          {recruitingLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#2d46a8] text-white shadow-sm' : 'hover:bg-[#2d46a8]/50 text-blue-100'}`}>
                <link.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 mt-8 px-4">Administration</p>
        <div className="space-y-1">
          {adminLinks.map((link) => {
             const isActive = pathname === link.href;
             return (
              <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#2d46a8] text-white' : 'hover:bg-[#2d46a8]/50 text-blue-100'}`}>
                <link.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-[#2d46a8]">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            {user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : '??'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </p>
            <p className="text-blue-300 text-[11px]">{user ? user.role : 'HR Recruiter'}</p>
          </div>
        </div>
        <button 
          onClick={async () => {
            await auth.clearSession();
            window.location.href = '/';
          }}
          className="flex items-center gap-2 text-blue-300 hover:text-white px-2 py-2 text-sm w-full transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}