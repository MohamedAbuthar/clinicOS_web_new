"use client"

import React, { ReactNode } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header />
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
