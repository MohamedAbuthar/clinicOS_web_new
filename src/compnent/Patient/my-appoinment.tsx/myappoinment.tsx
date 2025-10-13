'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle2, XCircle, Loader2, Plus, CalendarClock } from 'lucide-react';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';

export default function AppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, patient } = usePatientAuth();
  const { appointments, loading: appointmentsLoading, error: appointmentsError, cancelAppointment } = useAppointments(patient?.id);
  const { doctors } = useDoctors();
  
  // Appointment tab state
  const [appointmentTab, setAppointmentTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Get doctor name by ID
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.user?.name || 'Doctor';
  };

  // Filter appointments based on status and date
  const getFilteredAppointments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    return appointments.filter(appointment => {
      const appointmentDate = appointment.appointmentDate;
      const appointmentTime = appointment.appointmentTime;
      const isPast = appointmentDate < today || (appointmentDate === today && appointmentTime < currentTime);

      if (appointmentTab === 'upcoming') {
        return !isPast && appointment.status !== 'cancelled' && appointment.status !== 'completed';
      } else if (appointmentTab === 'past') {
        return isPast || appointment.status === 'completed';
      } else if (appointmentTab === 'cancelled') {
        return appointment.status === 'cancelled';
      }
      return false;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  // Get appointment counts for each tab
  const getAppointmentCounts = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const counts = { upcoming: 0, past: 0, cancelled: 0 };

    appointments.forEach(appointment => {
      const appointmentDate = appointment.appointmentDate;
      const appointmentTime = appointment.appointmentTime;
      const isPast = appointmentDate < today || (appointmentDate === today && appointmentTime < currentTime);

      if (appointment.status === 'cancelled') {
        counts.cancelled++;
      } else if (isPast || appointment.status === 'completed') {
        counts.past++;
      } else {
        counts.upcoming++;
      }
    });

    return counts;
  };

  const appointmentCounts = getAppointmentCounts();

  // Show loading state
  if (authLoading || appointmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                My Appointments
              </h1>
              <p className="text-gray-600">View and manage your appointments</p>
            </div>
            <button
              onClick={() => router.push('/Patient/book-appointment')}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* My Appointments Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setAppointmentTab('upcoming')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  appointmentTab === 'upcoming'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Upcoming
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  appointmentTab === 'upcoming'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {appointmentCounts.upcoming}
                </span>
              </button>
              <button
                onClick={() => setAppointmentTab('past')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  appointmentTab === 'past'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                Past
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  appointmentTab === 'past'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {appointmentCounts.past}
                </span>
              </button>
              <button
                onClick={() => setAppointmentTab('cancelled')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  appointmentTab === 'cancelled'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <XCircle className="h-4 w-4 inline mr-2" />
                Cancelled
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  appointmentTab === 'cancelled'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {appointmentCounts.cancelled}
                </span>
              </button>
            </div>

            {/* Appointments List */}
            {appointmentsError ? (
              <div className="text-center py-8">
                <p className="text-red-600">{appointmentsError}</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {appointmentTab === 'upcoming' && 'No upcoming appointments'}
                  {appointmentTab === 'past' && 'No past appointments'}
                  {appointmentTab === 'cancelled' && 'No cancelled appointments'}
                </p>
                <p className="text-gray-500 text-sm">
                  {appointmentTab === 'upcoming' && 'Book your first appointment to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            appointment.status === 'scheduled' || appointment.status === 'confirmed' 
                              ? 'bg-green-500' 
                              : appointment.status === 'cancelled' 
                              ? 'bg-red-500' 
                              : 'bg-gray-400'
                          }`} />
                          <h4 className="text-lg font-semibold text-gray-900">
                            Appointment with Dr. {getDoctorName(appointment.doctorId)}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            appointment.status === 'scheduled' || appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : appointment.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600 flex items-center">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-gray-600 flex items-center">
                            <Clock className="h-4 w-4 inline mr-2" />
                            {appointment.appointmentTime}
                          </p>
                          {appointment.tokenNumber && (
                            <p className="text-gray-600">
                              <span className="font-medium">Token:</span> {appointment.tokenNumber}
                            </p>
                          )}
                          <p className="text-gray-600">
                            <span className="font-medium">Source:</span> {appointment.source}
                          </p>
                        </div>
                        {appointment.notes && (
                          <p className="text-gray-600 text-sm mt-2">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        )}
                      </div>
                      {appointmentTab === 'upcoming' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this appointment?')) {
                                const success = await cancelAppointment(appointment.id, 'Cancelled by patient');
                                if (success) {
                                  setSuccessMessage('Appointment cancelled successfully');
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                } else {
                                  setErrorMessage('Failed to cancel appointment');
                                  setTimeout(() => setErrorMessage(''), 3000);
                                }
                              }
                            }}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}