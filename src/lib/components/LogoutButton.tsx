'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <span className="truncate max-w-[100px]">{user?.name || 'User'}</span>
        <span className="text-gray-400">•</span>
        <span className="capitalize">{user?.role || 'User'}</span>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
};

export default LogoutButton;
