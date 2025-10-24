import React, { useState, useEffect } from 'react';
import { Calendar, Bell } from 'lucide-react';
import LogoutButton from '@/lib/components/LogoutButton';

export default function Header() {
  const [currentDate, setCurrentDate] = useState('');

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

  return (
    <header className="w-full h-[73.4px] bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Date */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" strokeWidth={2} />
          <span className="text-gray-600 text-base">{currentDate}</span>
        </div>

        {/* Right side - Live indicator, Notification, and User */}
        <div className="flex items-center gap-6">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 text-sm font-medium">Live</span>
          </div>

          {/* Notification Bell */}
          

          {/* User Info and Logout */}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}