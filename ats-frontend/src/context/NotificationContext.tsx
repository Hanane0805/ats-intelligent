'use client';
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  // Function to add a new notification (call this when a backend event occurs)
  const addNotification = (message: string, title: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);