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
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { Doctor } from '@/lib/api';

export default function DashboardPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState({
    appointmentsToday: 0,
    patientsWaiting: 0,
    doctorsActive: 0,
    noShows: 0,
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { doctors: doctorsData, loading: doctorsLoading, fetchDoctors } = useDoctors();
  const { assistants } = useAssistants();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Make sure doctors are fetched
        await fetchDoctors();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchDoctors]);

  // Update dashboard data when appointments or doctors change
  useEffect(() => {
    if (appointmentsLoading || doctorsLoading) return;

    try {
      // Filter today's appointments
      const today = new Date().toISOString().split('T')[0];
      let todayAppointments = appointments.filter(apt => 
        apt.appointmentDate === today
      );

      // Apply role-based filtering to appointments
      if (isAuthenticated && currentUser) {
        if (currentUser.role === 'doctor') {
          // Doctor sees only their own appointments
          todayAppointments = todayAppointments.filter(apt => apt.doctorId === currentUser.id);
        } else if (currentUser.role === 'assistant') {
          // Assistant sees appointments for their assigned doctors
          const assistant = assistants.find(a => a.userId === currentUser.id);
          if (assistant && assistant.assignedDoctors) {
            todayAppointments = todayAppointments.filter(apt => 
              assistant.assignedDoctors.includes(apt.doctorId)
            );
          } else {
            todayAppointments = []; // No assigned doctors
          }
        }
        // Admin sees all appointments (no filtering)
      }

      // Calculate dashboard metrics
      const appointmentsToday = todayAppointments.length;
      const patientsWaiting = todayAppointments.filter(apt => 
        apt.status === 'scheduled' || apt.status === 'confirmed'
      ).length;
      
      // Apply role-based filtering to doctors
      let filteredDoctors = doctorsData;
      if (isAuthenticated && currentUser) {
        if (currentUser.role === 'doctor') {
          // Doctor sees only themselves
          filteredDoctors = doctorsData.filter(doctor => doctor.userId === currentUser.id);
        } else if (currentUser.role === 'assistant') {
          // Assistant sees only their assigned doctors
          const assistant = assistants.find(a => a.userId === currentUser.id);
          if (assistant && assistant.assignedDoctors) {
            filteredDoctors = doctorsData.filter(doctor => 
              assistant.assignedDoctors.includes(doctor.id)
            );
          } else {
            filteredDoctors = []; // No assigned doctors
          }
        }
        // Admin sees all doctors (no filtering)
      }

      const doctorsActive = filteredDoctors.filter(doctor => 
        doctor.status === 'In'
      ).length;
      const noShows = todayAppointments.filter(apt => 
        apt.status === 'no_show'
      ).length;

      setDashboardData({
        appointmentsToday,
        patientsWaiting,
        doctorsActive,
        noShows,
      });

      // Transform doctors data for display
      const transformedDoctors = filteredDoctors.map(doctor => ({
        id: doctor.id,
        name: doctor.user?.name || '',
        specialty: doctor.specialty,
        currentToken: null,
        queueLength: 0,
        estimatedLastPatient: null,
        status: doctor.status === 'In' ? 'Active' : 'Break'
      }));

      setDoctors(transformedDoctors);

      // Generate sample alerts
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
      console.error('Error processing dashboard data:', err);
    }
  }, [appointments, doctorsData, appointmentsLoading, doctorsLoading, currentUser, isAuthenticated, assistants]);

  const handleViewQueue = (doctor: any) => {
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
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser?.role === 'doctor' 
              ? 'Your Dashboard' 
              : currentUser?.role === 'assistant'
              ? 'Assigned Doctors Dashboard'
              : 'Dashboard'
            }
          </h1>
          <p className="text-gray-500 mt-1">
            {currentUser?.role === 'doctor' 
              ? 'Overview of your appointments and patients today' 
              : currentUser?.role === 'assistant'
              ? 'Overview of your assigned doctors and their patients'
              : 'Quick overview of today clinic operations'
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Appointments Today"
            value={dashboardData.appointmentsToday}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
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