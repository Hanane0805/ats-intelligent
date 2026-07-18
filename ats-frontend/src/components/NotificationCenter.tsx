'use client';
import { useNotifications } from '../context/NotificationContext';
import { X, Bell } from 'lucide-react';

export default function NotificationCenter() {
  const { notifications } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 space-y-3">
      {notifications.map((n: any) => (
        <div key={n.id} className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-right">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-indigo-600">
              <Bell className="w-4 h-4" />
              <span className="font-bold text-sm">{n.title}</span>
            </div>
          </div>
          <p className="text-slate-600 text-xs mt-2">{n.message}</p>
        </div>
      ))}
    </div>
  );
}