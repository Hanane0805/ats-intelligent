'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Briefcase, Users, FileText, BarChart2, 
  History, Settings, Shield, UserCog, ClipboardList, LogOut, Bot,
  Activity, KanbanSquare, Moon, Sun, BrainCircuit, X
} from 'lucide-react';
import { auth, User } from '../../services/api';

const recruitingLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sourcing IA', href: '/sourcing', icon: BrainCircuit },
  { name: 'Job Positions', href: '/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'CV Analysis', href: '/analysis', icon: FileText },
  { name: 'Rankings', href: '/rankings', icon: BarChart2 },
  { name: 'Pipeline (Track)', href: '/candidatures', icon: KanbanSquare },
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setUser(auth.getUser());
    const saved = localStorage.getItem('ats_dark_mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close the mobile drawer automatically whenever the route changes
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('ats_dark_mode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col min-h-screen h-screen flex-shrink-0 shadow-sm
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        lg:static lg:h-screen lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Branding */}
      <div className="p-6 pb-4 flex flex-col items-center">
        {/* Norsys Logo */}
        <div className="w-full flex justify-center py-2 mb-4">
          <img 
            src="/norsys-logo.png" 
            alt="Norsys" 
            className="h-10 object-contain drop-shadow-sm dark:brightness-0 dark:invert"
          />
        </div>
        
        {/* ATS App Branding */}
        <div className="w-full flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary drop-shadow-sm flex-shrink-0" /> 
          <div>
            <h1 className="font-bold text-lg leading-tight">ATS Intelligent</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI Recruitment</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-2 px-4">Recruiting</p>
        <div className="space-y-1">
          {recruitingLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}
                className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden ${
                  isActive ? 'bg-primary/10 text-primary shadow-sm dark:bg-primary/20' : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-primary'
                }`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                <link.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                {link.name}
              </Link>
            );
          })}
        </div>

        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-4">Administration</p>
        <div className="space-y-1">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}
                className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden ${
                  isActive ? 'bg-primary/10 text-primary shadow-sm dark:bg-primary/20' : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-primary'
                }`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                <link.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3 bg-sidebar/50 backdrop-blur-sm">
        {/* Dark mode toggle */}
        <button onClick={toggleDark}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-sm font-medium text-sidebar-foreground border border-transparent hover:border-sidebar-border">
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
          <span className={`ml-auto w-8 h-4 rounded-full flex items-center px-0.5 transition-colors duration-300 ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}>
            <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : '??'}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground text-sm font-semibold truncate">{user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}</p>
            <p className="text-muted-foreground text-[11px] font-medium">{user?.role || 'HR Recruiter'}</p>
          </div>
        </div>

        <button
          onClick={async () => { await auth.clearSession(); window.location.href = '/'; }}
          className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
      </aside>
    </>
  );
}