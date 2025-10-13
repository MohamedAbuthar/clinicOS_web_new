// src/app/Patient/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, User, ChevronRight, Plus } from 'lucide-react';
import { Appointment, RecentVisit, PatientStatsCard, DashboardSection, AppointmentCard, RecentVisitCard } from '../reusable';
import { PatientDashboardStats, PatientRecentVisit } from '@/lib/api';
import { getAppointments, getAllDoctors } from '@/lib/firebase/firestore';
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
      if (!patient?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        // Get all appointments for the patient
        const allAppointments = await getAppointments(patient.id);
        
        if (!allAppointments) {
          throw new Error('Failed to load appointments');
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Separate upcoming and completed appointments
        const upcoming = allAppointments
          .filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= now && (apt.status === 'scheduled' || apt.status === 'confirmed');
          })
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
          .slice(0, 5);
        
        const completed = allAppointments
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
          .slice(0, 10);

        // Get doctors to enrich appointment data
        const doctorsResult = await getAllDoctors();
        const doctors = doctorsResult.success ? doctorsResult.data : [];
        const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);

        // Set upcoming appointments
        setUpcomingAppointments(upcoming);

        // Convert completed appointments to recent visits format
        const visits: PatientRecentVisit[] = completed.map(apt => {
          const doctor = doctorMap.get(apt.doctorId);
          return {
            id: apt.id,
            doctorName: doctor?.user?.name || 'Unknown Doctor',
            doctorSpecialty: doctor?.specialty || 'General',
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            diagnosis: apt.notes || 'Checkup completed',
            status: 'completed' as const
          };
        });
        setRecentVisitsData(visits);

        // Calculate dashboard stats
        const stats: PatientDashboardStats = {
          totalAppointments: allAppointments.length,
          upcomingAppointments: upcoming.length,
          completedAppointments: completed.length,
          cancelledAppointments: allAppointments.filter(a => a.status === 'cancelled').length,
          recentVisits: visits
        };

        // Add next appointment info if exists
        if (upcoming.length > 0) {
          const nextApt = upcoming[0];
          const nextDoctor = doctorMap.get(nextApt.doctorId);
          stats.nextAppointment = {
            id: nextApt.id,
            doctorName: nextDoctor?.user?.name || 'Unknown Doctor',
            doctorSpecialty: nextDoctor?.specialty || 'General',
            appointmentDate: nextApt.appointmentDate,
            appointmentTime: nextApt.appointmentTime,
            room: '',
            token: nextApt.tokenNumber
          };
        }

        setDashboardStats(stats);
      } catch (error: any) {
        console.error('Dashboard data error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [patient?.id]); // Depend on patient ID

  const defaultStats: Required<PatientStats> = {
    nextAppointment: dashboardStats?.nextAppointment ? {
      date: dashboardStats.nextAppointment.appointmentDate,
      time: dashboardStats.nextAppointment.appointmentTime
    } : {
      date: 'No upcoming',
      time: 'appointments'
    },
    totalVisits: {
      count: dashboardStats?.completedAppointments || 0,
      period: 'Total visits'
    },
    pendingReports: {
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