import React, { useState, useEffect } from 'react';
import { Calendar, Bell, LogOut, User } from 'lucide-react';
import { Patient } from '@/lib/api';
import { patientNotificationsApi } from '@/lib/api';

interface PatientHeaderProps {
  patient: Patient | null;
  onLogout: () => void;
}

export default function PatientHeader({ patient, onLogout }: PatientHeaderProps) {
  const [currentDate, setCurrentDate] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

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

    // Load notification count
    const loadNotificationCount = async () => {
      try {
        const response = await patientNotificationsApi.getNotificationCount();
        if (response.success && response.data) {
          setNotificationCount(response.data.unread);
        }
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    loadNotificationCount();
  }, []);
  return (
    <header className="w-full h-[73.4px] bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Date */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" strokeWidth={2} />
          <span className="text-gray-600 text-base">{currentDate}</span>
        </div>

        {/* Right side - Live indicator, Notification, and User Menu */}
        <div className="flex items-center gap-6">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 text-sm font-medium">Live</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{notificationCount}</span>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 text-sm font-medium">{patient?.name || 'Patient'}</span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}