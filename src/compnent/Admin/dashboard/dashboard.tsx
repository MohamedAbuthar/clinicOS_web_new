'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Stethoscope, UserX, AlertCircle, Loader2 } from 'lucide-react';
import { 
  StatCard, 
  QueueTable, 
  AlertItem,
  Alert 
} from '../../reusable';
import QueueDetailsDialog from './QueueDetailsDialog';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { appointmentApi, doctorApi, Doctor as ApiDoctor } from '@/lib/api';

export default function DashboardPage() {
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [dashboardData, setDashboardData] = useState({
    appointmentsToday: 0,
    patientsWaiting: 0,
    doctorsActive: 0,
    noShows: 0,
  });
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { appointments, stats, fetchTodayAppointments, fetchAppointmentStats } = useAppointments();
  const { doctors: doctorsData, fetchDoctors } = useDoctors();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        await Promise.all([
          fetchTodayAppointments(),
          fetchAppointmentStats(),
          fetchDoctors(),
        ]);

        // Calculate dashboard metrics
        const appointmentsToday = appointments.length;
        const patientsWaiting = appointments.filter(apt => 
          apt.status === 'scheduled' || apt.status === 'confirmed'
        ).length;
        const doctorsActive = doctorsData.filter(doctor => 
          doctor.status === 'active'
        ).length;
        const noShows = appointments.filter(apt => 
          apt.status === 'no_show'
        ).length;

        setDashboardData({
          appointmentsToday,
          patientsWaiting,
          doctorsActive,
          noShows,
        });

        // Transform doctors data for display
        const transformedDoctors: ApiDoctor[] = doctorsData.map(doctor => ({
          id: doctor.id,
          name: doctor.user.name,
          specialty: doctor.specialty,
          currentToken: doctor.currentToken || null,
          queueLength: doctor.queueLength,
          estimatedLastPatient: doctor.estimatedLastPatient || null,
          status: doctor.status === 'active' ? 'Active' : 
                  doctor.status === 'break' ? 'Break' : 'Offline'
        }));

        setDoctors(transformedDoctors);

        // Generate sample alerts (in real app, this would come from notifications API)
        setAlerts([
          {
            id: '1',
            message: "System initialized successfully",
            timestamp: 'Just now',
            type: 'success'
          },
          {
            id: '2',
            message: `Loaded ${appointmentsToday} appointments for today`,
            timestamp: 'Just now',
            type: 'info'
          }
        ]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchTodayAppointments, fetchAppointmentStats, fetchDoctors]);

  const handleViewQueue = (doctor: ApiDoctor) => {
    setSelectedDoctor(doctor);
    setIsQueueDialogOpen(true);
  };

  const handleCloseQueueDialog = () => {
    setIsQueueDialogOpen(false);
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Quick overview of today clinic operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Appointments Today"
            value={dashboardData.appointmentsToday}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            trend={stats ? { value: `${Math.round((stats.completed / stats.total) * 100)}%`, label: "completed" } : undefined}
            iconBgColor="bg-blue-50"
          />
          <StatCard
            title="Patients Waiting"
            value={dashboardData.patientsWaiting}
            icon={<Users className="w-6 h-6 text-yellow-600" />}
            iconBgColor="bg-yellow-50"
          />
          <StatCard
            title="Doctors Active"
            value={dashboardData.doctorsActive}
            icon={<Stethoscope className="w-6 h-6 text-green-600" />}
            iconBgColor="bg-green-50"
          />
          <StatCard
            title="No-shows / Skipped"
            value={dashboardData.noShows}
            icon={<UserX className="w-6 h-6 text-red-600" />}
            iconBgColor="bg-red-50"
          />
        </div>

        <div className="mb-8">
          <QueueTable doctors={doctors} onViewQueue={handleViewQueue} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Queue Details Dialog */}
      <QueueDetailsDialog
        isOpen={isQueueDialogOpen}
        onClose={handleCloseQueueDialog}
        doctor={selectedDoctor}
      />
    </div>
  );
}