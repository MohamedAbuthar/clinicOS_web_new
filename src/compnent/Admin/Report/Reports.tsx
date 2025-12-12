'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, TrendingUp, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react';
import ReportStatCard, { ReportStatCardProps } from './ReportStatCard';
import AppointmentTrendsChart, { AppointmentData } from './AppointmentTrendsChart';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { useQueue } from '@/lib/hooks/useQueue';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { apiUtils } from '@/lib/api';

type TimeRange = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

const ReportsPage: React.FC = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('thisWeek');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all necessary data
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { doctors, loading: doctorsLoading } = useDoctors();
  const { assistants } = useAssistants();
  const { queueStats } = useQueue();


  // Filter data based on user role
  const getFilteredAppointments = () => {
    if (!isAuthenticated || !currentUser) return appointments;

    if (currentUser.role === 'doctor') {
      // Doctor sees only their own appointments
      // Find the doctor profile corresponding to the current user
      const currentDoctor = doctors.find(d => d.userId === currentUser.id);

      // Use doctor ID if found, otherwise fall back to currentUser.id
      const targetId = currentDoctor?.id || currentUser.id;
      return appointments.filter(apt => apt.doctorId === targetId);
    } else if (currentUser.role === 'assistant') {
      // Assistant sees appointments for their assigned doctors
      const assistant = assistants.find(a => a.userId === currentUser.id);
      if (assistant && assistant.assignedDoctors) {
        return appointments.filter(apt => assistant.assignedDoctors.includes(apt.doctorId));
      }
      return []; // No assigned doctors
    }

    // Admin sees all appointments
    return appointments;
  };


  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },

  ];

  // Update loading state based on data hooks
  useEffect(() => {
    setLoading(appointmentsLoading || doctorsLoading);
  }, [appointmentsLoading, doctorsLoading]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Date filtering functions
  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { start: startOfMonth, end: endOfMonth };
      default:
        return { start: today, end: today };
    }
  };

  const filterAppointmentsByDateRange = (appointments: any[], range: TimeRange) => {
    const { start, end } = getDateRange(range);
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= start && appointmentDate <= end;
    });
  };

  const getTimeRangeLabel = () => {
    return timeRangeOptions.find(opt => opt.value === timeRange)?.label || 'This Week';
  };

  // Filter appointments based on selected time range and user role
  const filteredAppointments = filterAppointmentsByDateRange(getFilteredAppointments(), timeRange);

  // Calculate stats from filtered data
  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length;
  const noShowAppointments = filteredAppointments.filter(apt => apt.status === 'no_show').length;
  const noShowRate = totalAppointments > 0 ? ((noShowAppointments / totalAppointments) * 100).toFixed(1) : '0.0';

  // Stats data
  const statsData: ReportStatCardProps[] = [
    {
      title: 'Total Appointments',
      value: totalAppointments.toString(),
      change: '12% vs last week', // This would need historical data
      changeType: 'positive',
      icon: Calendar,
      iconBgColor: 'bg-cyan-50',
    },
    {
      title: 'Avg Wait Time',
      value: queueStats?.avgWaitTime || 'N/A',
      change: '8% improvement',
      changeType: 'positive',
      icon: Clock,
      iconBgColor: 'bg-yellow-50',
    },
    {
      title: 'Patients Served',
      value: completedAppointments.toString(),
      change: '15% vs last week',
      changeType: 'positive',
      icon: Users,
      iconBgColor: 'bg-green-50',
    },
    {
      title: 'No-Show Rate',
      value: `${noShowRate}%`,
      change: '2% vs last week',
      changeType: 'negative',
      icon: TrendingUp,
      iconBgColor: 'bg-red-50',
    },
  ];

  // Generate appointment chart data based on time range
  const generateAppointmentChartData = (): AppointmentData[] => {
    const { start, end } = getDateRange(timeRange);
    const data: AppointmentData[] = [];

    if (timeRange === 'today') {
      // For today, show hourly data (9 AM to 5 PM)
      for (let hour = 9; hour <= 17; hour++) {
        const hourStart = new Date(start);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(start);
        hourEnd.setHours(hour + 1, 0, 0, 0);

        const hourAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          // Check if appointment date matches today
          if (aptDate.toDateString() !== start.toDateString()) {
            return false;
          }

          // If appointmentTime exists, use it; otherwise use appointment date hour
          if (apt.appointmentTime) {
            const aptHour = parseInt(apt.appointmentTime.split(':')[0]);
            return aptHour === hour;
          }

          return aptDate.getHours() === hour;
        });

        data.push({
          day: `${hour}:00`,
          total: hourAppointments.length,
          completed: hourAppointments.filter(apt => apt.status === 'completed').length,
          cancelled: hourAppointments.filter(apt => apt.status === 'cancelled').length,
        });
      }
    } else {
      // For week/month, show daily data
      const current = new Date(start);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      while (current <= end) {
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        const dayAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= dayStart && aptDate <= dayEnd;
        });

        const dayLabel = timeRange === 'thisMonth'
          ? `${current.getDate()}/${current.getMonth() + 1}` // Show day/month for month view
          : days[current.getDay()]; // Show day name for week view

        data.push({
          day: dayLabel,
          total: dayAppointments.length,
          completed: dayAppointments.filter(apt => apt.status === 'completed').length,
          cancelled: dayAppointments.filter(apt => apt.status === 'cancelled').length,
        });

        current.setDate(current.getDate() + 1);
      }
    }

    return data;
  };

  const appointmentChartData = generateAppointmentChartData();

  const handleExport = () => {
    console.log('Export report');
    // Implement export logic
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentUser?.role === 'doctor'
                  ? 'Your Reports'
                  : currentUser?.role === 'assistant'
                    ? 'Assigned Doctors Reports'
                    : 'Reports'
                }
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.role === 'doctor'
                  ? 'Analytics and insights for your practice'
                  : currentUser?.role === 'assistant'
                    ? 'Analytics and insights for your assigned doctors'
                    : 'Analytics and insights for clinic operations'
                }
              </p>
              {/* User context indicator */}
              {currentUser && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
                  {currentUser.role === 'doctor' && '👨‍⚕️ Doctor View'}
                  {currentUser.role === 'assistant' && '👩‍💼 Assistant View'}
                  {currentUser.role === 'admin' && '👨‍💼 Admin View'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors min-w-[150px] justify-between"
                >
                  <span>{getTimeRangeLabel()}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleTimeRangeChange(option.value as TimeRange)}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <span>{option.label}</span>
                        {timeRange === option.value && (
                          <Check className="w-4 h-4 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              {/* <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                Export
              </button> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsData.map((stat, index) => (
            <ReportStatCard key={index} {...stat} />
          ))}
        </div>

        {/* Appointment Trends Chart */}
        <div className="mb-6">
          <AppointmentTrendsChart data={appointmentChartData} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;