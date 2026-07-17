'use client';

import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      
      {/* Sidebar Navigation Drawer */}
      <Sidebar />

      {/* Primary Workflow Layout Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Navigation Headspace header layout */}
        <Navbar />

        {/* Dynamic Inner Component Workspace */}
        <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
          {children}
        </main>
        
      </div>
    </div>
  );
}