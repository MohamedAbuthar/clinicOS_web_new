// src/app/Patient/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, User, ChevronRight, Plus } from 'lucide-react';
import { Appointment, RecentVisit, PatientStatsCard, DashboardSection, AppointmentCard, RecentVisitCard } from '../reusable';
import { patientDashboardApi, PatientDashboardStats, PatientRecentVisit } from '@/lib/api';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { useRouter } from 'next/navigation';


interface PatientStats {
  nextAppointment?: {
    date: string;
    time: string;
  };
  totalVisits?: {
    count: number;
    period: string;
  };
  pendingReports?: {
    count: number;
    status: string;
  };
}

interface PatientDashboardProps {
  patientName?: string;
  stats?: PatientStats;
  appointments?: Appointment[];
  recentVisits?: RecentVisit[];
  onBookNew?: () => void;
  onViewAppointmentDetails?: (appointment: Appointment) => void;
  onViewReport?: (visit: RecentVisit) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientName = 'Ramesh',
  stats = {},
  appointments = [],
  recentVisits = [],
  onBookNew = () => {},
  onViewAppointmentDetails = () => {},
  onViewReport = () => {}
}) => {
  const [dashboardStats, setDashboardStats] = useState<PatientDashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentVisitsData, setRecentVisitsData] = useState<PatientRecentVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { patient, isAuthenticated } = usePatientAuth();
  const router = useRouter();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      // Skip authentication check for development
      // if (!isAuthenticated) {
      //   router.push('/Auth-patientLogin');
      //   return;
      // }

      try {
        setIsLoading(true);
        setError('');

        // Load dashboard stats, upcoming appointments, and recent visits in parallel
        const [statsResponse, appointmentsResponse, visitsResponse] = await Promise.all([
          patientDashboardApi.getDashboardStats(),
          patientDashboardApi.getUpcomingAppointments(5),
          patientDashboardApi.getRecentVisits(10)
        ]);

        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        }

        if (appointmentsResponse.success && appointmentsResponse.data) {
          setUpcomingAppointments(appointmentsResponse.data);
        }

        if (visitsResponse.success && visitsResponse.data) {
          setRecentVisitsData(visitsResponse.data);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]); // Removed isAuthenticated dependency for development

  const defaultStats: Required<PatientStats> = {
    nextAppointment: dashboardStats?.nextAppointment ? {
      date: dashboardStats.nextAppointment.date,
      time: dashboardStats.nextAppointment.time
    } : {
      date: 'No upcoming',
      time: 'appointments'
    },
    totalVisits: dashboardStats?.totalVisits || {
      count: 0,
      period: 'This year'
    },
    pendingReports: dashboardStats?.pendingReports || {
      count: 0,
      status: 'No pending reports'
    },
    ...stats
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {patient?.name || patientName}!
          </h1>
          <p className="text-gray-600">
            Manage your appointments and health records
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <PatientStatsCard
            title="Next Appointment"
            value={defaultStats.nextAppointment.date}
            subtitle={defaultStats.nextAppointment.time}
            icon={Calendar}
            variant="primary"
          />
          <PatientStatsCard
            title="Total Visits"
            value={defaultStats.totalVisits.count}
            subtitle={defaultStats.totalVisits.period}
            icon={User}
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <PatientStatsCard
              title="Pending Reports"
              value={defaultStats.pendingReports.count}
              subtitle={defaultStats.pendingReports.status}
              icon={ChevronRight}
            />
          </div>
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mb-8">
          <DashboardSection
            title="Upcoming Appointments"
            action={
              <button
                onClick={onBookNew}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Book New</span>
              </button>
            }
          >
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onViewDetails={onViewAppointmentDetails}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No upcoming appointments
                </p>
              )}
            </div>
          </DashboardSection>
        </div>

        {/* Recent Visits Section */}
        <DashboardSection title="Recent Visits">
          <div className="space-y-4">
            {recentVisitsData.length > 0 ? (
              recentVisitsData.map((visit) => (
                <RecentVisitCard
                  key={visit.id}
                  visit={visit}
                  onViewReport={onViewReport}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No recent visits
              </p>
            )}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
};

// Main Page Component with Integrated Backend
export default function PatientPage() {
  const router = useRouter();

  const handleBookNew = () => {
    router.push('/Patient/book-appointment');
  };

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    router.push(`/Patient/myappoinment?id=${appointment.id}`);
  };

  const handleViewReport = (visit: RecentVisit) => {
    router.push(`/Patient/medicalrecords?id=${visit.id}`);
  };

  return (
    <PatientDashboard
      onBookNew={handleBookNew}
      onViewAppointmentDetails={handleViewAppointmentDetails}
      onViewReport={handleViewReport}
    />
  );
}