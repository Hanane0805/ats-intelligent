'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Briefcase, Users, FileText, BarChart2, 
  History, Settings, Shield, UserCog, ClipboardList, LogOut, Bot,
  Activity, KanbanSquare, Moon, Sun, BrainCircuit, X, Globe
} from 'lucide-react';
import { auth, User } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const { t, lang, toggleLanguage } = useLanguage();

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

  const recruitingLinks = [
    { nameKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
    { nameKey: 'nav.sourcing', href: '/sourcing', icon: BrainCircuit },
    { nameKey: 'nav.jobs', href: '/jobs', icon: Briefcase },
    { nameKey: 'nav.candidates', href: '/candidates', icon: Users },
    { nameKey: 'nav.analysis', href: '/analysis', icon: FileText },
    { nameKey: 'nav.rankings', href: '/rankings', icon: BarChart2 },
    { nameKey: 'nav.pipeline', href: '/candidatures', icon: KanbanSquare },
    { nameKey: 'nav.history', href: '/history', icon: History },
    { nameKey: 'nav.stats', href: '/stats', icon: Activity },
    { nameKey: 'nav.profile', href: '/profil', icon: UserCog },
    { nameKey: 'nav.settings', href: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { nameKey: 'nav.admin', href: '/admin', icon: Shield },
    { nameKey: 'nav.users', href: '/users', icon: UserCog },
    { nameKey: 'nav.roles', href: '/roles', icon: ClipboardList },
    { nameKey: 'nav.logs', href: '/logs', icon: FileText },
  ];

  const candidateLinks = [
    { nameKey: 'nav.findJobs', href: '/jobs', icon: Briefcase },
    { nameKey: 'nav.myApplications', href: '/my-applications', icon: KanbanSquare },
    { nameKey: 'nav.myProfile', href: '/profil', icon: UserCog },
  ];

  const renderLinks = (links: { nameKey: string; href: string; icon: React.ElementType }[]) =>
    links.map((link) => {
      const isActive = pathname === link.href;
      return (
        <Link key={link.nameKey} href={link.href}
          className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden ${
            isActive ? 'bg-primary/10 text-primary shadow-sm dark:bg-primary/20' : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-primary'
          }`}>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
          <link.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          {t(link.nameKey)}
        </Link>
      );
    });

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
          <div className="w-full flex justify-center py-2 mb-4">
            <img 
              src="/norsys-logo.png" 
              alt="Norsys" 
              className="h-10 object-contain drop-shadow-sm dark:brightness-0 dark:invert"
            />
          </div>
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
          {user?.role === 'CANDIDAT' ? (
            <>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-2 px-4">{t('nav.section.mySpace')}</p>
              <div className="space-y-1">{renderLinks(candidateLinks)}</div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-2 px-4">{t('nav.section.recruiting')}</p>
              <div className="space-y-1">{renderLinks(recruitingLinks)}</div>

              {user?.role === 'ADMIN' && (
                <>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-4">{t('nav.section.administration')}</p>
                  <div className="space-y-1">{renderLinks(adminLinks)}</div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar/50 backdrop-blur-sm">
          {/* Language toggle */}
          <button onClick={toggleLanguage}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-sm font-medium text-sidebar-foreground border border-transparent hover:border-sidebar-border"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>{lang === 'en' ? 'Switch to French' : 'Passer en Anglais'}</span>
            <span className="ml-auto text-[10px] font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {lang === 'en' ? 'EN' : 'FR'}
            </span>
          </button>

          {/* Dark mode toggle */}
          <button onClick={toggleDark}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-sm font-medium text-sidebar-foreground border border-transparent hover:border-sidebar-border">
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            <span>{t('sidebar.darkMode')}</span>
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
              <p className="text-sidebar-foreground text-sm font-semibold truncate">{user ? `${user.prenom} ${user.nom}` : 'User'}</p>
              <p className="text-muted-foreground text-[11px] font-medium">{user?.role || 'HR Recruiter'}</p>
            </div>
          </div>

          <button
            onClick={async () => { await auth.clearSession(); window.location.href = '/'; }}
            className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> {t('sidebar.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}