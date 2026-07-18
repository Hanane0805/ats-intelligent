'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { auth, User } from '../../services/api';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  return (
    <div className="h-20 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0 transition-colors duration-200">
      
      {/* System Unified Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Rechercher candidats..." 
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
      </div>

      {/* User Session Interface Controls */}
      <div className="flex items-center gap-5">
        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="h-9 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : '??'}
          </div>
        </div>
      </div>
      
    </div>
  );
}