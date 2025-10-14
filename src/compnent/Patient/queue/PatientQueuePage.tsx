"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Clock, Phone, Calendar, UserCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { usePatients } from '@/lib/hooks/usePatients';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { apiUtils, Appointment as BaseAppointment } from '@/lib/api';

// Extended Appointment interface for queue management
interface Appointment extends BaseAppointment {
  checkedInAt?: string | Date | { toDate(): Date };
  acceptanceStatus?: 'accepted' | 'rejected' | 'pending';
  patientName?: string;
  patientPhone?: string;
  queueOrder?: number;
}

interface AppointmentQueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  tokenNumber: string;
  name: string;
  phone?: string;
  status: string;
  waitingTime: number;
  appointmentDate: string;
  appointmentTime: string;
  queueOrder?: number;
  acceptanceStatus?: 'accepted' | 'rejected' | 'pending';
  checkedInAt?: string | Date | { toDate(): Date };
}

// Helper Functions
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return 'Today';
  }
  
  return date.toLocaleDateString();
};

const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return '';
  
  // Handle Firebase Timestamp objects
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as { toDate(): Date }).toDate === 'function') {
    const date = (timestamp as { toDate(): Date }).toDate();
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Handle regular Date objects or date strings
  try {
    const date = new Date(timestamp as string | number | Date);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return '';
  }
};

// Queue Item Component (Read-only)
interface QueueItemProps {
  queueItem: AppointmentQueueItem;
  index: number;
  isCurrentUser: boolean;
}

const QueueItem = ({ queueItem, index, isCurrentUser }: QueueItemProps) => {
  const statusColors: Record<string, string> = {
    'checked_in': 'bg-green-100 text-green-700',
    'waiting': 'bg-purple-100 text-purple-700',
    'scheduled': 'bg-blue-100 text-blue-700'
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        isCurrentUser 
          ? 'border-teal-500 bg-teal-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Position Badge */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
          isCurrentUser ? 'bg-teal-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          {index + 1}
        </div>
      </div>
      
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-gray-900">{queueItem.tokenNumber}</p>
            <p className="text-xs text-gray-500">Token</p>
          </div>
          
          <div className="flex-1">
            <p className={`font-semibold ${isCurrentUser ? 'text-teal-900' : 'text-gray-900'}`}>
              {queueItem.name}
              {isCurrentUser && <span className="ml-2 text-sm text-teal-600">(You)</span>}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {queueItem.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  {queueItem.phone}
                </div>
              )}
              {queueItem.appointmentDate && queueItem.appointmentTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDate(queueItem.appointmentDate)} • {formatTime(queueItem.appointmentTime)}
                </div>
              )}
              <span className="text-xs text-gray-500">• Waiting: {queueItem.waitingTime} min</span>
              {queueItem.checkedInAt && (
                <span className="text-xs text-teal-600">
                  ✓ Checked in: {formatTimestamp(queueItem.checkedInAt)}
                </span>
              )}
            </div>
            {queueItem.acceptanceStatus && (
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    queueItem.acceptanceStatus === 'accepted' 
                      ? 'bg-teal-100 text-teal-700' 
                      : queueItem.acceptanceStatus === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {queueItem.acceptanceStatus === 'accepted' ? '✓ Accepted' : 
                   queueItem.acceptanceStatus === 'rejected' ? '✕ Rejected' : 
                   '⏳ Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[queueItem.status]}`}>
            {queueItem.status === 'checked_in' ? 'Checked In' : 
             queueItem.status === 'waiting' ? 'Waiting' : 
             'Scheduled'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function PatientQueuePage() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const { patient, firebaseUser, isLoading: authLoading } = usePatientAuth();

  const { appointments, loading, error, refreshAppointments } = useAppointments();
  const { doctors } = useDoctors();
  const { patients } = usePatients();

  // Load data if we have either a patient profile or a firebase user
  const shouldLoadData = !!(patient?.id || firebaseUser?.uid);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshAppointments) {
        await refreshAppointments();
      }
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error refreshing queue:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('=== PATIENT QUEUE DEBUG ===');
    console.log('Firebase User:', firebaseUser);
    console.log('Firebase User UID:', firebaseUser?.uid);
    console.log('Patient Profile:', patient);
    console.log('Patient ID:', patient?.id);
    console.log('Auth Loading:', authLoading);
    console.log('Appointments Count:', appointments.length);
    console.log('Appointments:', appointments);
    console.log('Error:', error);
    console.log('Selected Doctor ID:', selectedDoctorId);
    console.log('Doctors:', doctors);
    console.log('Should Load Data:', shouldLoadData);
    console.log('========================');
  }, [firebaseUser, patient, authLoading, appointments, error, selectedDoctorId, doctors, shouldLoadData]);

  // Update current time every 30 seconds for real-time waiting time calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh queue every 30 seconds to sync with admin changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (refreshAppointments && !isRefreshing && !loading) {
        try {
          setIsAutoRefreshing(true);
          await refreshAppointments();
          setLastRefreshTime(new Date());
        } catch (error) {
          console.error('Auto-refresh error:', error);
        } finally {
          setIsAutoRefreshing(false);
        }
      }
    }, 30000); // Auto-refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshAppointments, isRefreshing, loading]);

  // Auto-select first doctor if available
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Filter appointments for selected doctor
  const doctorAppointments = selectedDoctorId 
    ? appointments.filter(apt => apt.doctorId === selectedDoctorId)
    : appointments;

  // Get today's appointments for the selected doctor (EXACT same logic as admin queue)
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = doctorAppointments.filter(apt => 
    apt.appointmentDate === today && 
    (apt.status === 'scheduled' || apt.status === 'confirmed')
  );

  // Create queue items from today's appointments (same logic as admin queue)
  const appointmentQueueItems: AppointmentQueueItem[] = useMemo(() => {
    return todayAppointments.map((appointment, index) => {
      const patient = patients.find(p => p.id === appointment.patientId);
      let waitingTime = 0;
      
      if (appointment.checkedInAt) {
        try {
          // Handle Firebase Timestamp objects
          if (typeof appointment.checkedInAt === 'object' && appointment.checkedInAt !== null && 'toDate' in appointment.checkedInAt && typeof (appointment.checkedInAt as { toDate(): Date }).toDate === 'function') {
            const checkedInDate = (appointment.checkedInAt as { toDate(): Date }).toDate();
            waitingTime = Math.floor((currentTime - checkedInDate.getTime()) / (1000 * 60));
          } else {
            // Handle regular Date objects or date strings
            const checkedInDate = new Date(appointment.checkedInAt as string | number | Date);
            if (!isNaN(checkedInDate.getTime())) {
              waitingTime = Math.floor((currentTime - checkedInDate.getTime()) / (1000 * 60));
            }
          }
        } catch {
          waitingTime = 0;
        }
      }
      
      return {
        id: `apt-${appointment.id}`,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        tokenNumber: appointment.tokenNumber || `#${index + 1}`,
        name: (appointment as Appointment).patientName || patient?.name || 'Unknown Patient',
        phone: (appointment as Appointment).patientPhone || patient?.phone,
        status: appointment.checkedInAt ? 'checked_in' : 'waiting',
        waitingTime,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        acceptanceStatus: (appointment as Appointment).acceptanceStatus,
        checkedInAt: appointment.checkedInAt,
        queueOrder: (appointment as Appointment).queueOrder,
      };
    });
  }, [todayAppointments, patients, currentTime]);

  // Sort by queue order (if available) or appointment time
  appointmentQueueItems.sort((a, b) => {
    // First try to sort by queueOrder if both have it
    if (a.queueOrder !== undefined && b.queueOrder !== undefined) {
      return a.queueOrder - b.queueOrder;
    }
    // If only one has queueOrder, prioritize it
    if (a.queueOrder !== undefined && b.queueOrder === undefined) {
      return -1;
    }
    if (a.queueOrder === undefined && b.queueOrder !== undefined) {
      return 1;
    }
    // Fall back to appointment time
    if (a.appointmentTime && b.appointmentTime) {
      return a.appointmentTime.localeCompare(b.appointmentTime);
    }
    return 0;
  });

  // Check if current user is in the queue
  const currentUserInQueue = patient ? appointmentQueueItems.find(item => item.patientId === patient.id) : null;
  const currentUserPosition = currentUserInQueue ? appointmentQueueItems.indexOf(currentUserInQueue) + 1 : null;

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading queue data...</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your queue status.</p>
        </div>
      </div>
    );
  }

  // Show patient profile error (but allow queue viewing if authenticated)
  if (!patient && firebaseUser) {
    return (
      <div className="max-w-4xl mx-auto">
          <div className="mb-4 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Profile Incomplete</p>
              <p className="text-sm mt-1">Please complete your patient profile for full functionality.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Queue Status</h1>
              <p className="text-sm text-gray-500 mt-1">View queue for selected doctor</p>
              {lastRefreshTime && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Queue'}
              </button>
              <select
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Today's Queue ({appointmentQueueItems.length})
                </h2>
                {isAutoRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-teal-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {appointmentQueueItems.length > 0 ? (
                appointmentQueueItems.map((queueItem, index) => (
                  <QueueItem
                    key={queueItem.id}
                    queueItem={queueItem}
                    index={index}
                    isCurrentUser={false}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No appointments in queue today</p>
                  <p className="text-sm mt-2">No appointments found for the selected doctor today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-blue-800 mb-3">To see your personal queue status and position, please complete your patient profile.</p>
                <button 
                  onClick={() => window.location.href = '/Patient/register'}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Unable to load queue data</p>
              <p className="text-sm mt-1">
                {error.includes('permission') || error.includes('Permission') 
                  ? 'Please ensure you are logged in and have a complete patient profile.'
                  : error
                }
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue Status</h1>
            <p className="text-sm text-gray-500 mt-1">
              View your position in the queue for {doctors.find(d => d.id === selectedDoctorId)?.user?.name || 'Selected Doctor'}
            </p>
            {lastRefreshTime && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Queue'}
            </button>
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current User Status */}
        {currentUserInQueue && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-teal-600" />
              <h2 className="text-lg font-semibold text-teal-900">Your Queue Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">{currentUserPosition}</div>
                <div className="text-sm text-teal-700">Position in Queue</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">{currentUserInQueue.tokenNumber}</div>
                <div className="text-sm text-teal-700">Your Token</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  {currentUserInQueue.waitingTime} min
                </div>
                <div className="text-sm text-teal-700">Waiting Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Today's Queue ({appointmentQueueItems.length})
              </h2>
              {isAutoRefreshing && (
                <div className="flex items-center gap-1 text-xs text-teal-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Queue Order:</span>
              {appointmentQueueItems.length > 0 && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                  {appointmentQueueItems.map((item, idx) => (
                    <span key={item.id}>
                      {item.tokenNumber || idx + 1}
                      {idx < appointmentQueueItems.length - 1 && ' → '}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {appointmentQueueItems.length > 0 ? (
              appointmentQueueItems.map((queueItem, index) => {
                const isCurrentUser = !!(patient && queueItem.patientId === patient.id);
                return (
                  <QueueItem
                    key={queueItem.id}
                    queueItem={queueItem}
                    index={index}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No appointments in queue today</p>
                <p className="text-sm mt-2">
                  {appointments.length === 0 
                    ? "No appointments found for the selected doctor today."
                    : "Check back later or contact the clinic"
                  }
                </p>
                {appointments.length === 0 && (
                  <button 
                    onClick={() => window.location.href = '/Patient/book-appointment'}
                    className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Book an Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Queue Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Queue positions are updated in real-time</li>
                <li>• Your position may change if other patients check in or are called</li>
                <li>• Please wait for your turn and listen for announcements</li>
                <li>• If you need to leave temporarily, inform the reception</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}
