'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ totalUsers: number, totalRoles: number, totalLogs: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdminStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform administration and security overview</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading admin stats...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center flex-shrink-0 relative z-10">
                <Users className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
              </div>
              <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 opacity-50 pointer-events-none" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 relative z-10">
                <Lock className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-500 mb-1">Active Roles</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalRoles}</p>
              </div>
              <Lock className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 opacity-50 pointer-events-none" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 relative z-10">
                <FileText className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-500 mb-1">System Logs</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalLogs}</p>
              </div>
              <FileText className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 opacity-50 pointer-events-none" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-4 text-center">
             <Shield className="w-16 h-16 text-blue-100 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-gray-900">Administration Center</h3>
             <p className="text-gray-500 mt-2 max-w-lg mx-auto">
               Use the sidebar to navigate to User Management, Role Definitions, and System Audit Logs. These features are fully integrated with the PostgreSQL database.
             </p>
          </div>
        </>
      )}
    </div>
  );
}
