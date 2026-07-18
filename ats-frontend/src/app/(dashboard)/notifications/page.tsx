'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  // Mock notifications to test the UI immediately
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Application Received',
      message: 'John Doe has applied for the Senior Frontend Developer position.',
      time: '10 minutes ago',
      type: 'info',
      read: false,
    },
    {
      id: 2,
      title: 'Gemini AI Analysis Complete',
      message: 'CV analysis for "Backend Engineer" position is ready. Match score: 85%.',
      time: '1 hour ago',
      type: 'success',
      read: false,
    },
    {
      id: 3,
      title: 'System Alert',
      message: 'Failed to parse uploaded document "resume_draft.pdf". Invalid format.',
      time: '2 hours ago',
      type: 'error',
      read: true,
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#1e3a8a]" /> Notifications Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view your system alerts and candidate updates</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-[#1e3a8a] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-slate-400">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 flex gap-4 items-start transition-colors hover:bg-slate-50/50 ${!n.read ? 'bg-blue-50/30' : ''}`}
            >
              {/* Icon Type */}
              <div className="mt-0.5">
                {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {n.type === 'info' && <Bell className="w-5 h-5 text-blue-600" />}
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
              </div>

              {/* Actions */}
              <button 
                onClick={() => deleteNotification(n.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}