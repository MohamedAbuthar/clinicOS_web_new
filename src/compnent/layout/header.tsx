'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Bell, AlertCircle } from 'lucide-react';
import LogoutButton from '@/lib/components/LogoutButton';
import { useAuth } from '@/lib/contexts/AuthContext';
import EmergencyAppointmentDialog from '../Admin/appoinment/EmergencyAppointmentDialog';
import { useDoctors } from '@/lib/hooks/useDoctors';

export default function Header() {
  const [currentDate, setCurrentDate] = useState('');
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const { user } = useAuth();
  const { doctors, loading: doctorsLoading } = useDoctors();

  useEffect(() => {
    // Set current date
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  // Show emergency button only for doctor, admin, and assistant roles
  const showEmergencyButton = user && (user.role === 'doctor' || user.role === 'admin' || user.role === 'assistant');

  return (
    <>
      <header className="w-full h-[73.4px] bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" strokeWidth={2} />
            <span className="text-gray-600 text-base">{currentDate}</span>
          </div>

          {/* Right side - Live indicator, Emergency Button, Notification, and User */}
          <div className="flex items-center gap-6">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 text-sm font-medium">Live</span>
            </div>

            {/* Emergency Button - Only for doctor, admin, assistant */}
            {showEmergencyButton && (
              <button
                onClick={() => setShowEmergencyDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                Emergency Booking
              </button>
            )}

            {/* Notification Bell */}
            

            {/* User Info and Logout */}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Emergency Appointment Dialog */}
      {showEmergencyDialog && (
        <EmergencyAppointmentDialog
          isOpen={showEmergencyDialog}
          onCloseAction={() => setShowEmergencyDialog(false)}
          doctors={doctors}
          onAppointmentCreated={() => {
            setShowEmergencyDialog(false);
          }}
        />
      )}
    </>
  );
}