'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar'; 
import Topbar from '../../components/layout/Navbar';
import { NotificationProvider } from '../../context/NotificationContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}