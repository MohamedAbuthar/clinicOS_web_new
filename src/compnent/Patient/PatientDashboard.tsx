// src/app/Patient/page.tsx
'use client';

import React from 'react';
import { Calendar, User, ChevronRight, Plus } from 'lucide-react';
import { Appointment, RecentVisit, PatientStatsCard, DashboardSection, AppointmentCard, RecentVisitCard } from '../reusable';


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
  const defaultStats: Required<PatientStats> = {
    nextAppointment: {
      date: 'Oct 12',
      time: '10:30 AM'
    },
    totalVisits: {
      count: 14,
      period: 'This year'
    },
    pendingReports: {
      count: 2,
      status: 'Ready to view'
    },
    ...stats
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {patientName}!
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
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
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
            {recentVisits.length > 0 ? (
              recentVisits.map((visit) => (
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

// Main Page Component with Sample Data
export default function PatientPage() {
  // const router = useRouter();

  const sampleAppointments: Appointment[] = [
    {
      id: 1,
      doctor: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      date: '12/10/2025',
      time: '10:30 AM',
      token: 'T-042'
    },
    {
      id: 2,
      doctor: 'Dr. Rajesh Kumar',
      specialty: 'Cardiologist',
      date: '15/10/2025',
      time: '2:00 PM',
      token: 'T-018'
    }
  ];

  const sampleRecentVisits: RecentVisit[] = [
    {
      id: 1,
      doctor: 'Dr. Siva Raman',
      reason: 'Routine Checkup',
      date: '28/09/2025'
    },
    {
      id: 2,
      doctor: 'Dr. Priya Sharma',
      reason: 'Seasonal Flu',
      date: '15/09/2025'
    }
  ];

  const handleBookNew = () => {
    console.log('Book new appointment clicked');
    // router.push('/Patient/book-appointment');
  };

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    console.log('View appointment details:', appointment);
    // router.push(`/Patient/appointment/${appointment.id}`);
  };

  const handleViewReport = (visit: RecentVisit) => {
    console.log('View report:', visit);
    // router.push(`/Patient/report/${visit.id}`);
  };

  return (
    <PatientDashboard
      patientName="Ramesh"
      appointments={sampleAppointments}
      recentVisits={sampleRecentVisits}
      onBookNew={handleBookNew}
      onViewAppointmentDetails={handleViewAppointmentDetails}
      onViewReport={handleViewReport}
    />
  );
}