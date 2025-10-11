'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, X } from 'lucide-react';
import { patientAppointmentApi, AppointmentWithDetails } from '@/lib/api';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';

// Define types for different appointment states
type UpcomingAppointment = {
  id: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  room: string;
  phone: string;
  token: string;
  status: string;
};

type PastAppointment = {
  id: number;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  date: string;
  time: string;
  status: string;
};

type CancelledAppointment = {
  id: number;
  doctorName: string;
  specialty: string;
  reason: string;
  date: string;
  time: string;
  status: string;
};

type SelectedAppointment = UpcomingAppointment | PastAppointment | CancelledAppointment;

export default function AppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated } = usePatientAuth();
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showViewReportDialog, setShowViewReportDialog] = useState(false);
  const [showBookAgainDialog, setShowBookAgainDialog] = useState(false);
  const [showBookAppointmentDialog, setShowBookAppointmentDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, router]);

  // Load appointments on component mount
  useEffect(() => {
    const loadAppointments = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const response = await patientAppointmentApi.getPatientAppointments();
          if (response.success && response.data) {
            setAppointments(response.data);
          }
        } catch (error: any) {
          setError(error.message || 'Failed to load appointments');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();
  }, [isAuthenticated]);

  // Filter appointments by status
  const upcomingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status) && 
    new Date(apt.appointmentDate) >= new Date()
  );

  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' || 
    (['scheduled', 'confirmed'].includes(apt.status) && new Date(apt.appointmentDate) < new Date())
  );

  const cancelledAppointments = appointments.filter(apt => 
    apt.status === 'cancelled'
  );

  // Handle reschedule appointment
  const handleReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      setError('Please select new date and time');
      return;
    }

    try {
      setIsRescheduling(true);
      setError('');
      
      const rescheduleData = {
        appointmentDate: newDate,
        appointmentTime: newTime,
        reason: 'Patient requested reschedule'
      };

      const response = await patientAppointmentApi.rescheduleAppointment(
        selectedAppointment.id.toString(),
        rescheduleData.appointmentDate,
        rescheduleData.appointmentTime,
        rescheduleData.reason
      );

      if (response.success) {
        alert('Appointment rescheduled successfully!');
        setShowRescheduleDialog(false);
        setNewDate('');
        setNewTime('');
        // Reload appointments
        const appointmentsResponse = await patientAppointmentApi.getPatientAppointments();
        if (appointmentsResponse.success && appointmentsResponse.data) {
          setAppointments(appointmentsResponse.data);
        }
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reschedule appointment');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle cancel appointment
  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setIsCancelling(true);
      setError('');
      
      const response = await patientAppointmentApi.cancelAppointment(appointmentId, 'Patient requested cancellation');

      if (response.success) {
        alert('Appointment cancelled successfully!');
        // Reload appointments
        const appointmentsResponse = await patientAppointmentApi.getPatientAppointments();
        if (appointmentsResponse.success && appointmentsResponse.data) {
          setAppointments(appointmentsResponse.data);
        }
      } else {
        setError(response.message || 'Failed to cancel appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Appointments</h1>
            <p className="text-gray-500 text-lg">View and manage your appointments</p>
          </div>
          <button 
            onClick={() => router.push('/Patient/book-appointment')}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Book New Appointment
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-transparent text-gray-500'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
              activeTab === 'past'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-transparent text-gray-500'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
              activeTab === 'cancelled'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-transparent text-gray-500'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Appointments List */}
        {!isLoading && (
          <div className="space-y-4">
            {activeTab === 'upcoming' && upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {appointment.doctorName || 'Dr. Unknown'}
                      </h3>
                      <p className="text-gray-500 text-base">{appointment.doctorSpecialty || 'General Practice'}</p>
                    </div>
                  </div>
                  <span className="bg-green-50 text-green-600 px-4 py-1 rounded-md text-sm font-medium">
                    {appointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{appointment.appointmentTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{appointment.room || 'Room TBD'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{appointment.doctorPhone || 'Contact clinic'}</span>
                  </div>
                </div>

                {(appointment.token || appointment.tokenNumber) && (
                  <div className="mb-6">
                    <span className="inline-block bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Token: {appointment.token || appointment.tokenNumber}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedAppointment(appointment as any);
                      setShowRescheduleDialog(true);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Reschedule
                  </button>
                  <button 
                    onClick={() => handleCancel(appointment.id)}
                    disabled={isCancelling}
                    className="px-6 py-2 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                  </button>
                  <button className="px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors">
                    Get Directions
                  </button>
                </div>
              </div>
            ))}

            {activeTab === 'past' && pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {appointment.doctorName || 'Dr. Unknown'}
                      </h3>
                      <p className="text-gray-500 text-base">{appointment.doctorSpecialty || 'General Practice'}</p>
                    </div>
                  </div>
                  <span className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {appointment.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-6 mt-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{appointment.appointmentTime}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedAppointment(appointment as any);
                      setShowViewReportDialog(true);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    View Report
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAppointment(appointment as any);
                      setShowBookAgainDialog(true);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Book Again
                  </button>
                </div>
              </div>
            ))}

            {activeTab === 'cancelled' && cancelledAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {appointment.doctorName || 'Dr. Unknown'}
                      </h3>
                      <p className="text-gray-500 text-base">{appointment.doctorSpecialty || 'General Practice'}</p>
                      <p className="text-gray-500 text-base">Reason: {appointment.cancellationReason || appointment.reason || 'Patient request'}</p>
                    </div>
                  </div>
                  <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {appointment.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-6 mt-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-base">{appointment.appointmentTime}</span>
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => {
                      setSelectedAppointment(appointment as any);
                      setShowBookAppointmentDialog(true);
                    }}
                    className="px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                  >
                    Book New Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reschedule Dialog */}
        {showRescheduleDialog && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h2>
                <button 
                  onClick={() => setShowRescheduleDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Current appointment with:</p>
                <p className="font-semibold text-gray-900">{selectedAppointment.doctorName}</p>
                <p className="text-gray-500">{selectedAppointment.specialty}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select New Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Time Slot
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRescheduleDialog(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={isRescheduling}
                  className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Report Dialog */}
        {showViewReportDialog && selectedAppointment && 'diagnosis' in selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Medical Report</h2>
                <button 
                  onClick={() => setShowViewReportDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Patient Information</h3>
                  <p className="text-gray-700">Doctor: {selectedAppointment.doctorName}</p>
                  <p className="text-gray-700">Specialty: {selectedAppointment.specialty}</p>
                  <p className="text-gray-700">Date: {selectedAppointment.date}</p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Diagnosis</h3>
                  <p className="text-gray-900">{selectedAppointment.diagnosis}</p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Prescription</h3>
                  <ul className="list-disc list-inside text-gray-900 space-y-1">
                    <li>Medicine A - Take twice daily after meals</li>
                    <li>Medicine B - Take once before bedtime</li>
                    <li>Vitamin supplements - Once daily</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Follow-up Instructions</h3>
                  <p className="text-gray-900">Schedule a follow-up appointment after 2 weeks. Maintain proper rest and hydration.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowViewReportDialog(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Book Again Dialog */}
        {showBookAgainDialog && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Book Again</h2>
                <button 
                  onClick={() => setShowBookAgainDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Book appointment with:</p>
                <p className="font-semibold text-gray-900">{selectedAppointment.doctorName}</p>
                <p className="text-gray-500">{selectedAppointment.specialty}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Time Slot
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
                    <option value="">Select a time</option>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                    placeholder="Brief description of your concern"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookAgainDialog(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBookAgainDialog(false);
                    alert('Appointment booked successfully!');
                  }}
                  className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Book New Appointment Dialog */}
        {showBookAppointmentDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Book New Appointment</h2>
                <button 
                  onClick={() => setShowBookAppointmentDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Specialty
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
                    <option value="">Select Specialty</option>
                    <option>General Physician</option>
                    <option>Cardiologist</option>
                    <option>Dermatologist</option>
                    <option>Pediatrician</option>
                    <option>Orthopedic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Doctor
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
                    <option value="">Select Doctor</option>
                    <option>Dr. Priya Sharma</option>
                    <option>Dr. Rajesh Kumar</option>
                    <option>Dr. Siva Raman</option>
                    <option>Dr. Meena Lakshmi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Time Slot
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
                    <option value="">Select a time</option>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                    placeholder="Brief description of your concern"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookAppointmentDialog(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBookAppointmentDialog(false);
                    alert('Appointment booked successfully!');
                  }}
                  className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}