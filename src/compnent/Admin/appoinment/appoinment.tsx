"use client"

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Plus, Clock, Phone, X, User, Mail, AlertCircle, Loader2, CheckCircle, XCircle, RotateCcw, UserX, UserCheck } from 'lucide-react';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { usePatients } from '@/lib/hooks/usePatients';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { apiUtils, Appointment } from '@/lib/api';
import { migrateAppointmentTokens } from '@/lib/firebase/firestore';
import NewAppointmentDialog from './newappointmentdialog';
import { toast } from 'sonner';

export default function AppointmentsPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  // Always use today's date - no date filter needed
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  const [selectedDate] = useState<string>(getTodayDate());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [showDoctorFilter, setShowDoctorFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [morningAppointments, setMorningAppointments] = useState<Appointment[]>([]);
  const [eveningAppointments, setEveningAppointments] = useState<Appointment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    appointments,
    loading,
    error,
    createAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
    checkInAppointment,
    acceptAppointment,
    rejectAppointment,
    refreshAppointments
  } = useAppointments();

  const { doctors } = useDoctors();
  const { patients, createPatient } = usePatients();
  const { assistants } = useAssistants();

  // Auto-select doctor when doctor logs in
  useEffect(() => {
    if (isAuthenticated && currentUser && doctors.length > 0) {
      if (currentUser.role === 'doctor') {
        // Find the doctor document that matches this user's ID
        const doctorDoc = doctors.find(d => d.userId === currentUser.id);
        if (doctorDoc && !selectedDoctor) {
          console.log('Auto-selecting doctor:', doctorDoc.id, doctorDoc.user?.name);
          setSelectedDoctor(doctorDoc.id);
        }
      }
    }
  }, [isAuthenticated, currentUser, doctors, selectedDoctor]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Filter doctors based on user role
  const getFilteredDoctors = () => {
    if (!isAuthenticated || !currentUser) return doctors;

    if (currentUser.role === 'doctor') {
      return doctors.filter(doctor => doctor.userId === currentUser.id);
    } else if (currentUser.role === 'assistant') {
      const assistant = assistants.find(a => a.userId === currentUser.id);
      if (assistant && assistant.assignedDoctors) {
        return doctors.filter(doctor => assistant.assignedDoctors.includes(doctor.id));
      }
      return [];
    }

    return doctors;
  };

  // Check if current time is before 2 PM
  const isMorningSession = () => {
    return currentTime.getHours() < 14; // 2 PM is hour 14
  };

  // Apply role-based filtering to appointments
  useEffect(() => {
    // Always use today's date
    const todayDate = getTodayDate();

    // For doctors, require at least date selection (doctor is auto-selected)
    // For admins/assistants, require doctor selection (date is always today)
    const isDoctorRole = currentUser?.role === 'doctor';


    // REMOVED: The block that forced empty state when no doctor was selected.
    // Now we default to showing all appointments if no doctor is selected.

    let roleFilteredAppointments = [...appointments];

    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'doctor') {
        // Find the doctor document ID for this user
        const doctorDoc = doctors.find(d => d.userId === currentUser.id);
        if (doctorDoc) {
          // Filter appointments by the doctor's document ID
          roleFilteredAppointments = appointments.filter(apt => apt.doctorId === doctorDoc.id);
          console.log(`Doctor filtering: Found ${roleFilteredAppointments.length} appointments for doctor ${doctorDoc.id}`);
        } else {
          console.log('Doctor document not found for user:', currentUser.id);
          roleFilteredAppointments = [];
        }
      } else if (currentUser.role === 'assistant') {
        const assistant = assistants.find(a => a.userId === currentUser.id);
        if (assistant && assistant.assignedDoctors) {
          roleFilteredAppointments = appointments.filter(apt =>
            assistant.assignedDoctors.includes(apt.doctorId)
          );
        } else {
          roleFilteredAppointments = [];
        }
      }
    }

    // Apply date and doctor filters (always use today's date)
    const finalFiltered = roleFilteredAppointments.filter(appointment => {
      const matchesDate = appointment.appointmentDate === todayDate;
      // For doctors, we already filtered by their doctor ID above
      // For others, check the selectedDoctor filter (if a doctor is selected)
      // If no doctor is selected (!selectedDoctor), we show ALL doctors' appointments
      const matchesDoctor = isDoctorRole || !selectedDoctor || appointment.doctorId === selectedDoctor;

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const patient = patients.find(p => p.id === appointment.patientId);
      const patientName = (appointment.patientName || patient?.name || '').toLowerCase();
      const patientPhone = (appointment.patientPhone || patient?.phone || '');
      const tokenNumber = (appointment.tokenNumber ?? '').toString();

      const matchesSearch = !searchQuery ||
        patientName.includes(searchLower) ||
        patientPhone.includes(searchQuery) ||
        tokenNumber.toLowerCase().includes(searchLower);

      return matchesDate && matchesDoctor && matchesSearch;
    });

    // Sort appointments to show newest first (recently added at top)
    const sortedAppointments = finalFiltered.sort((a, b) => {
      // Prioritize exact token matches if searching
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const tokenA = (a.tokenNumber ?? '').toString().toLowerCase();
        const tokenB = (b.tokenNumber ?? '').toString().toLowerCase();

        const exactA = tokenA === searchLower;
        const exactB = tokenB === searchLower;

        if (exactA && !exactB) return -1;
        if (!exactA && exactB) return 1;
      }

      const timestampA = a.createdAt;
      const timestampB = b.createdAt;

      if (timestampA && timestampB) {
        const dateA = timestampA.toDate ? timestampA.toDate() : new Date(timestampA);
        const dateB = timestampB.toDate ? timestampB.toDate() : new Date(timestampB);
        return dateB.getTime() - dateA.getTime();
      }

      const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
      const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredAppointments(sortedAppointments);

    // Split appointments into morning and evening sessions
    const morning = sortedAppointments.filter(apt => {
      const appointmentTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return appointmentTime.getHours() < 14; // Before 2 PM
    });

    const evening = sortedAppointments.filter(apt => {
      const appointmentTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return appointmentTime.getHours() >= 14; // 2 PM and after
    });

    setMorningAppointments(morning);
    setEveningAppointments(evening);
    setCurrentPage(1);
  }, [appointments, currentUser, isAuthenticated, assistants, selectedDoctor, doctors, searchQuery]);

  // Get appointments to display based on current time
  const getAppointmentsToDisplay = () => {
    if (isMorningSession()) {
      return morningAppointments;
    } else {
      return eveningAppointments;
    }
  };

  const appointmentsToDisplay = getAppointmentsToDisplay();
  const totalPages = Math.ceil(appointmentsToDisplay.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = appointmentsToDisplay.slice(startIndex, endIndex);

  useEffect(() => {
    console.log('Appointments page - doctors:', doctors);
    console.log('Appointments page - appointments:', appointments);
    console.log('Appointments page - patients:', patients);
  }, [doctors, appointments, patients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDoctorFilter) {
        const target = event.target as Element;
        if (!target.closest('.doctor-filter-container')) {
          setShowDoctorFilter(false);
        }
      }
    };

    if (showDoctorFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDoctorFilter]);

  const handleMigrateTokens = async () => {
    setIsMigrating(true);
    try {
      console.log('🔄 Starting token migration...');
      const result = await migrateAppointmentTokens();

      if (result.success) {
        toast.success(`Token migration completed! Updated: ${result.updated}, Skipped: ${result.skipped}`);
        await refreshAppointments();
      } else {
        toast.error(`Migration failed: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('Migration error:', error);
      toast.error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    try {
      console.log('=== APPOINTMENT ACTION ===');
      console.log('Appointment ID:', appointmentId);
      console.log('Action:', action);

      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        console.log('Appointment Details:', {
          tokenNumber: appointment.tokenNumber,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          status: appointment.status,
          checkedInAt: appointment.checkedInAt
        });
      }

      let success = false;

      switch (action) {
        case 'cancel':
          success = await cancelAppointment(appointmentId, 'Cancelled by admin');
          break;
        case 'complete':
          success = await completeAppointment(appointmentId);
          break;
        case 'no-show':
          success = await markNoShow(appointmentId);
          break;
        case 'check-in':
          console.log('Executing check-in...');
          success = await checkInAppointment(appointmentId);
          console.log('Check-in result:', success);
          break;
        case 'accept':
          success = await acceptAppointment(appointmentId);
          break;
        case 'reject':
          success = await rejectAppointment(appointmentId);
          break;
        default:
          success = false;
      }

      if (success) {
        const actionMessages: Record<string, string> = {
          'check-in': 'checked in successfully',
          'accept': 'accepted',
          'reject': 'rejected',
          'cancel': 'cancelled',
          'complete': 'completed',
          'no-show': 'marked as no-show'
        };
        toast.success(`Appointment ${actionMessages[action] || action + 'ed'} successfully`);
        await refreshAppointments();
        console.log('Appointments refreshed');
      } else {
        toast.error(`Failed to ${action} appointment`);
      }
    } catch (err) {
      console.error('Appointment action error:', err);
      toast.error(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-500 text-white';
      case 'approved':
        return 'bg-emerald-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'no_show':
        return 'bg-gray-500 text-white';
      case 'rescheduled':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return 'Today';
    }

    return date.toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return '';

    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as any).toDate === 'function') {
      const date = (timestamp as any).toDate();
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser?.role === 'doctor'
              ? 'Your Appointments'
              : currentUser?.role === 'assistant'
                ? 'Assigned Doctors Appointments'
                : 'Appointments'
            }
          </h1>
          <p className="text-gray-500 mt-1">
            {currentUser?.role === 'doctor'
              ? 'Manage and track your patient appointments'
              : currentUser?.role === 'assistant'
                ? 'Manage appointments for your assigned doctors'
                : 'Manage and track all patient appointments'
            }
          </p>
          {currentUser && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
              {currentUser.role === 'doctor' && '👨‍⚕️ Doctor View'}
              {currentUser.role === 'assistant' && '👩‍💼 Assistant View'}
              {currentUser.role === 'admin' && '👨‍💼 Admin View'}
            </div>
          )}

          {/* Session Indicator */}
          <div className="mt-3 flex items-center gap-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${isMorningSession()
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : 'bg-orange-100 text-orange-800 border border-orange-300'
              }`}>
              <Clock className="w-4 h-4 mr-2" />
              {isMorningSession() ? ' Morning Session' : ' Evening Session'}
            </div>
            <div className="text-sm text-gray-500">
              Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {currentUser?.role === 'doctor' && (
            <div className="mt-2 text-xs text-gray-400">
              Showing {appointmentsToDisplay.length} appointments for today
              {appointmentsToDisplay.length > itemsPerPage && (
                <span> | Page {currentPage} of {totalPages}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDialogOpen(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            New Appointment
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone, or token..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Hide doctor filter for doctors since they can only see their own appointments */}
        {currentUser?.role !== 'doctor' && (
          <div className="relative doctor-filter-container">
            <button
              onClick={() => setShowDoctorFilter(!showDoctorFilter)}
              className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              <User className="w-4 h-4" />
              <span className="font-medium text-gray-700">
                {selectedDoctor ? doctors.find(d => d.id === selectedDoctor)?.user?.name || 'Filter by Doctor' : 'Filter by Doctor'}
              </span>
            </button>

            {showDoctorFilter && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 min-w-[200px]">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedDoctor('');
                      setShowDoctorFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedDoctor
                      ? 'bg-teal-100 text-teal-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    All Doctors
                  </button>
                  {getFilteredDoctors().map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor.id);
                        setShowDoctorFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedDoctor === doctor.id
                        ? 'bg-teal-100 text-teal-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Statistics - Show for doctors (always today), for others require doctor selection */}
      {(currentUser?.role === 'doctor' || selectedDoctor) && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 font-medium">Total Appointments</div>
            <div className="text-2xl font-bold text-gray-900">{filteredAppointments.length}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="text-sm text-blue-600 font-medium">Morning Session</div>
            <div className="text-2xl font-bold text-blue-800">{morningAppointments.length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 shadow-sm">
            <div className="text-sm text-orange-600 font-medium">Evening Session</div>
            <div className="text-2xl font-bold text-orange-800">{eveningAppointments.length}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-11 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="col-span-1 text-sm font-semibold text-gray-600">Token</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Patient</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Doctor</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Date & Time</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Status</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Actions</div>
        </div>

        {paginatedAppointments.length > 0 ? (
          paginatedAppointments.map((appointment) => {
            const patient = patients.find(p => p.id === appointment.patientId);
            const doctor = doctors.find(d => d.id === appointment.doctorId);

            return (
              <div
                key={appointment.id}
                className="grid grid-cols-11 gap-4 px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-1">
                  <span className="text-xl font-bold text-teal-600">
                    {appointment.tokenNumber ? String(appointment.tokenNumber) : 'N/A'}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">
                    {appointment.patientName || patient?.name || 'Unknown Patient'}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-3 h-3" />
                    {appointment.patientPhone || patient?.phone || 'N/A'}
                  </div>
                  {appointment.notes && (
                    <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={appointment.notes}>
                      📝 {appointment.notes}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-gray-900 font-medium">
                    {doctor?.user?.name || 'Loading...'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {appointment.source === 'web' && '🌐 Web'}
                    {appointment.source === 'assistant' && '👩‍💼 Assistant'}
                    {appointment.source === 'walk_in' && '🚶 Walk-in'}
                    {appointment.source === 'phone' && '📞 Phone'}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(appointment.appointmentTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                    </span>

                    {appointment.checkedInAt && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Checked in: {formatTimestamp(appointment.checkedInAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2 flex-wrap">
                  {!appointment.checkedInAt && (
                    <button
                      onClick={() => handleAppointmentAction(appointment.id, 'check-in')}
                      disabled={actionLoading}
                      className="text-teal-600 hover:text-teal-800 font-medium transition-colors disabled:opacity-50"
                      title="Check In"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}

                  {appointment.checkedInAt && (
                    <span className="text-gray-400 text-sm">Already Checked In</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No appointments found</p>
            <p className="text-gray-400 text-sm mt-2">
              {currentUser?.role === 'doctor' ? (
                `No ${isMorningSession() ? 'morning' : 'evening'} session appointments found for you today.`
              ) : (
                !selectedDoctor ?
                  'Please select a doctor to view appointments for today.' :
                  `No ${isMorningSession() ? 'morning' : 'evening'} session appointments found for ${doctors.find(d => d.id === selectedDoctor)?.user?.name || 'selected doctor'} today.`
              )}
            </p>
          </div>
        )}
      </div>

      {appointmentsToDisplay.length > 0 && (
        <div className="mt-6 flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-4">
              Showing {startIndex + 1}-{Math.min(endIndex, appointmentsToDisplay.length)} of {appointmentsToDisplay.length}
            </span>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              ←
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                    ? 'bg-teal-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              →
            </button>
          </div>
        </div>
      )}

      <NewAppointmentDialog
        isOpen={isDialogOpen}
        onCloseAction={() => setIsDialogOpen(false)}
        doctors={getFilteredDoctors()}
        onAppointmentCreated={() => {
          refreshAppointments();
          console.log('✅ Appointment created callback triggered');
        }}
      />
    </div>
  );
}