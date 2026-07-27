'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  dateCreation: string;
  estLu: boolean;
  utilisateurId: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => void;
  // Legacy support
  addNotification?: (message: string, title: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  deleteNotification: async () => {},
  markAllAsRead: async () => {},
  refresh: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const user = auth.getUser?.();
      if (!user?.id) return;
      const token = auth.getToken();
      const res = await fetch(`${API_BASE}/api/notifications/utilisateur/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silently fail — never break the app
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    const token = auth.getToken();
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/lire`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, estLu: true } : n));
  };

  const deleteNotification = async (id: number) => {
    const token = auth.getToken();
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.estLu).map(n => markAsRead(n.id)));
  };

  // Legacy: local toast notifications (kept for backward compat)
  const addNotification = (message: string, title: string) => {
    const fake: Notification = {
      id: Date.now(), titre: title, message,
      dateCreation: new Date().toISOString(), estLu: false, utilisateurId: 0,
    };
    setNotifications(prev => [fake, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== fake.id)), 6000);
  };

  const unreadCount = notifications.filter(n => !n.estLu).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead,
      refresh: fetchNotifications, addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);