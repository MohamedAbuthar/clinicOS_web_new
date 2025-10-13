"use client"

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Plus, Clock, Phone, X, User, Mail, AlertCircle, Loader2, CheckCircle, XCircle, RotateCcw, UserX, UserCheck } from 'lucide-react';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { usePatients } from '@/lib/hooks/usePatients';
import { apiUtils } from '@/lib/api';
import { migrateAppointmentTokens } from '@/lib/firebase/firestore';

export default function AppointmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    email: '',
    doctor: '',
    date: '',
    time: '',
    source: 'assistant',
    notes: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const { 
    appointments, 
    loading, 
    error, 
    createAppointment, 
    updateAppointment, 
    cancelAppointment, 
    rescheduleAppointment,
    completeAppointment,
    markNoShow,
    checkInAppointment,
    acceptAppointment,
    rejectAppointment,
    getAvailableSlots,
    refreshAppointments
  } = useAppointments();
  
  const { doctors } = useDoctors();
  const { patients, createPatient } = usePatients();

  // Debug: Log doctors and appointments when they change
  useEffect(() => {
    console.log('Appointments page - doctors:', doctors);
    console.log('Appointments page - appointments:', appointments);
    console.log('Appointments page - patients:', patients);
  }, [doctors, appointments, patients]);

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit: Starting...', formData);
    
    if (!formData.patientName || !formData.phone || !formData.doctor || !formData.date || !formData.time) {
      setSuccessMessage('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      // First, create or find patient
      let patientId = patients.find(p => p.phone === formData.phone)?.id;
      console.log('Existing patient ID:', patientId);
      
      if (!patientId) {
        console.log('Creating new patient...');
        // Create new patient - this returns the new patient's ID
        const newPatientData = {
          name: formData.patientName,
          phone: formData.phone,
          email: formData.email || undefined,
          dateOfBirth: '1990-01-01', // Default date
          gender: 'other' as const, // Default gender
        };
        
        const newPatientId = await createPatient(newPatientData);
        console.log('Patient created with ID:', newPatientId);
        
        if (!newPatientId) {
          setSuccessMessage('Failed to create patient');
          setActionLoading(false);
          return;
        }
        
        patientId = newPatientId;
      }

      console.log('Creating appointment with patientId:', patientId);

      // Create appointment
      const success = await createAppointment({
        patientId: patientId,
        patientName: formData.patientName, // Store patient name directly
        patientPhone: formData.phone, // Store patient phone directly
        doctorId: formData.doctor,
        appointmentDate: formData.date,
        appointmentTime: formData.time,
        notes: formData.notes,
        source: formData.source as 'web' | 'assistant' | 'walk_in' | 'phone',
      });

      console.log('Appointment creation result:', success);

      if (success) {
        setSuccessMessage('Appointment created successfully');
        setIsDialogOpen(false);
        resetForm();
        // Refresh the appointments list to show the new appointment
        await refreshAppointments();
      } else {
        setSuccessMessage('Failed to create appointment');
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setSuccessMessage(err.message || 'Failed to create appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      phone: '',
      email: '',
      doctor: '',
      date: '',
      time: '',
      source: 'assistant',
      notes: '',
    });
  };

  const handleMigrateTokens = async () => {
    setIsMigrating(true);
    try {
      console.log('🔄 Starting token migration...');
      const result = await migrateAppointmentTokens();
      
      if (result.success) {
        setSuccessMessage(`Token migration completed! Updated: ${result.updated}, Skipped: ${result.skipped}`);
        // Refresh appointments to show updated tokens
        await refreshAppointments();
      } else {
        setSuccessMessage(`Migration failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setSuccessMessage(`Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const testTokenGeneration = async () => {
    try {
      console.log('🧪 Testing token generation...');
      
      // Get current appointments to see existing tokens
      const currentAppointments = appointments.filter(apt => 
        apt.doctorId === formData.doctor && 
        apt.appointmentDate === formData.date
      );
      
      console.log('Current appointments for this doctor/date:', currentAppointments.map(apt => ({
        id: apt.id,
        token: apt.tokenNumber,
        time: apt.appointmentTime
      })));
      
      // Show next token that would be generated
      const nextToken = currentAppointments.length > 0 
        ? `#${Math.max(...currentAppointments.map(apt => {
            const match = apt.tokenNumber?.match(/#(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })) + 1}`
        : '#1';
      
      setSuccessMessage(`Next token would be: ${nextToken} (${currentAppointments.length} existing appointments)`);
    } catch (error: any) {
      console.error('Test error:', error);
      setSuccessMessage(`Test failed: ${error.message}`);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    try {
      console.log('=== APPOINTMENT ACTION ===');
      console.log('Appointment ID:', appointmentId);
      console.log('Action:', action);
      
      // Get appointment details for logging
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
        setSuccessMessage(`Appointment ${actionMessages[action] || action + 'ed'} successfully`);
        // Refresh the appointments list to show updated data
        await refreshAppointments();
        console.log('Appointments refreshed');
      } else {
        setSuccessMessage(`Failed to ${action} appointment`);
      }
    } catch (err) {
      console.error('Appointment action error:', err);
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-500 text-white';
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
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage and track all patient appointments</p>
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-400">
            Debug: {appointments.length} appointments loaded
            {appointments.length > 0 && (
              <span> | First: {appointments[0].patientName || 'No name'}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMigrateTokens}
            disabled={isMigrating || actionLoading}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Fix Tokens
              </>
            )}
          </button>
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

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or token..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <button className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white">
          <Calendar className="w-4 h-4" />
          <span className="font-medium text-gray-700">Filter by Date</span>
        </button>
        <button className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white font-medium text-gray-700">
          Filter by Doctor
        </button>
        <button className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white font-medium text-gray-700">
          Filter by Status
        </button>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-11 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="col-span-1 text-sm font-semibold text-gray-600">Token</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Patient</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Doctor</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Date & Time</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Status</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Actions</div>
        </div>

        {/* Table Body */}
        {appointments.length > 0 ? (
          appointments.map((appointment) => {
            const patient = patients.find(p => p.id === appointment.patientId);
            const doctor = doctors.find(d => d.id === appointment.doctorId);
            
            // Debug logging
            console.log('=== APPOINTMENT DEBUG ===');
            console.log('Appointment ID:', appointment.id);
            console.log('Patient ID:', appointment.patientId);
            console.log('Appointment patientName:', appointment.patientName);
            console.log('Appointment patientPhone:', appointment.patientPhone);
            console.log('Found patient from lookup:', patient);
            console.log('All patients count:', patients.length);
            console.log('========================');
            
            return (
              <div
                key={appointment.id}
                className="grid grid-cols-11 gap-4 px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Token */}
                <div className="col-span-1">
                  <span className="text-2xl font-bold text-teal-500">
                    {appointment.tokenNumber || 'N/A'}
                  </span>
                </div>

                {/* Patient */}
                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">
                    {appointment.patientName || patient?.name || 'Unknown Patient'}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-3 h-3" />
                    {appointment.patientPhone || patient?.phone || 'N/A'}
                  </div>
                </div>

                {/* Doctor */}
                <div className="col-span-2">
                  <span className="text-gray-900 font-medium">
                    {doctor?.user?.name || 'Loading...'}
                  </span>
                </div>

                {/* Date & Time */}
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

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                    </span>
                    {appointment.acceptanceStatus && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          appointment.acceptanceStatus === 'accepted' 
                            ? 'bg-teal-100 text-teal-700' 
                            : appointment.acceptanceStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {appointment.acceptanceStatus === 'accepted' ? '✓ Accepted' : 
                         appointment.acceptanceStatus === 'rejected' ? '✕ Rejected' : 
                         '⏳ Pending'}
                      </span>
                    )}
                    {appointment.checkedInAt && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Checked in: {formatTimestamp(appointment.checkedInAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center gap-2 flex-wrap">
                  {/* Check-in button - ONLY show for completed appointments */}
                  {appointment.status === 'completed' && 
                   !appointment.checkedInAt && (
                    <button 
                      onClick={() => handleAppointmentAction(appointment.id, 'check-in')}
                      disabled={actionLoading}
                      className="text-teal-600 hover:text-teal-800 font-medium transition-colors disabled:opacity-50"
                      title="Check In"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Other action buttons - show for scheduled/confirmed appointments */}
                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') ? (
                    <>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                        disabled={actionLoading}
                        className="text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-50"
                        title="Mark as Complete"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'no-show')}
                        disabled={actionLoading}
                        className="text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                        title="Mark as No Show"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </>
                  ) : appointment.status === 'completed' || appointment.status === 'cancelled' ? (
                    <span className="text-gray-400 text-sm">No actions</span>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No appointments found</p>
            <p className="text-gray-400 text-sm mt-2">
              {loading ? 'Loading appointments...' : 'Create your first appointment to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Dialog/Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-white/30 backdrop-blur-sm"
            onClick={() => setIsDialogOpen(false)}
          ></div>
          
          {/* Dialog Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
                <p className="text-gray-500 text-sm mt-1">Create a new patient appointment</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="px-6 py-6">
              <div className="space-y-5">
                {/* Patient Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      placeholder="Enter patient name"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="patient@example.com"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Appointment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}