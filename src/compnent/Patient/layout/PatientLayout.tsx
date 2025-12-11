'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import Header from './header';
import Sidebar from './sidebar';

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { isAuthenticated, isLoading, patient, logout } = usePatientAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔒 Not authenticated, redirecting to login...');
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Return null while redirecting to prevent flash of content
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header patient={patient} onLogout={logout} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
