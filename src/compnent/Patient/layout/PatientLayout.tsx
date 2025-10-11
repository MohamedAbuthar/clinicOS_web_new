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

  // Skip authentication check for development
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/Auth-patientLogin');
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return null; // Will redirect to login
  // }

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
