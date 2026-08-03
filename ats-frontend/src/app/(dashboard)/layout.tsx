'use client';

import React from 'react';
import Sidebar from '../../components/layout/Sidebar'; 
import Topbar from '../../components/layout/Navbar';
import { NotificationProvider } from '../../context/NotificationContext';
import NotificationCenter from '../../components/NotificationCenter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-slate-50 relative">
            <NotificationCenter />
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}