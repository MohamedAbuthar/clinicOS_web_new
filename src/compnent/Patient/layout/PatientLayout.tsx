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
    <div className="min-h-screen bg-gray-50">
      <Header patient={patient} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
