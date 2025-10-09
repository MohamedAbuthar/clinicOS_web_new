'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../reusable/Button';

const MainDashboard = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth-login');
  };

  const handleSignIn = () => {
    router.push('/auth-login');
  };

  const handlePatientPortal = () => {
    router.push('/Auth-patientLogin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-1 " >
            <svg 
              className="w-8 h-8" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M3 12C3 12 5.5 6 12 6C18.5 6 21 12 21 12M12 12V20M12 12L8 8M12 12L16 8" 
                stroke="#14B8A6" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-2xl font-semibold text-gray-900">
              ClinicFlow
            </span>
          </div>

          {/* Sign In Button */}
          <Button 
            onClick={handleSignIn}
            variant="primary"
            size="md"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-teal-500 mb-6">
            Modern Healthcare Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Streamline your clinic operations with our comprehensive management
            system. Handle appointments, queues, patient records, and more in
            one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              onClick={handleGetStarted}
              variant="primary"
              size="md"
            >
              Get Started
            </Button>
            <Button 
              onClick={handlePatientPortal}
              variant="secondary"
              size="md"
            >
              Patient Portal
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {/* Appointments Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-12 h-12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect 
                  x="3" 
                  y="4" 
                  width="18" 
                  height="18" 
                  rx="2" 
                  stroke="#14B8A6" 
                  strokeWidth="2"
                />
                <path 
                  d="M8 2V6M16 2V6M3 10H21" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              Appointments
            </h3>
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              Manage appointments efficiently with automated scheduling
            </p>
          </div>

          {/* Queue Management Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-12 h-12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="9" cy="7" r="4" stroke="#14B8A6" strokeWidth="2"/>
                <path 
                  d="M3 21C3 17.134 6.13401 14 10 14C11.0535 14 12.0543 14.2115 12.9621 14.5939" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                <circle cx="17" cy="10" r="3" stroke="#14B8A6" strokeWidth="2"/>
                <path 
                  d="M13 19C13 16.7909 14.7909 15 17 15C19.2091 15 21 16.7909 21 19" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              Queue Management
            </h3>
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              Smart queue system to reduce wait times and improve flow
            </p>
          </div>

          {/* Medical Records Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-12 h-12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M9 2H15L19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6L9 2Z" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M9 2V6H5M9 13H15M9 17H15M9 9H15" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              Medical Records
            </h3>
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              Secure digital records accessible anytime, anywhere
            </p>
          </div>

          {/* Real-time Analytics Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-12 h-12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3 12C3 12 5.5 6 12 6C18.5 6 21 12 21 12M12 12V20M12 12L8 8M12 12L16 8" 
                  stroke="#14B8A6" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              Real-time Analytics
            </h3>
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              Track performance metrics and optimize operations
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainDashboard;