"use client"

import React, { useState, useEffect } from 'react';
import { Search, Clock, Users, Eye, Edit, UserPlus, X, Phone, Mail, Calendar, MapPin, Save, User, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { apiUtils, Doctor as ApiDoctor } from '@/lib/api';

// TypeScript Interfaces
interface Patient {
  id: number;
  token: string;
  name: string;
  age: number;
  type: string;
  status: string;
  time: string;
}

interface Stats {
  total: number;
  done: number;
  waiting: number;
}

interface DoctorDisplay {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  bgColor: string;
  status: string;
  statusColor: string;
  stats: Stats;
  slotDuration: string;
  assistants: string;
  online: boolean;
  phone: string;
  email: string;
  schedule: string;
  room: string;
  queue: Patient[];
}

interface NewDoctorForm {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  schedule: string;
  room: string;
  slotDuration: string;
  assistants: string;
  status: string;
}

export default function DoctorDashboard() {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDisplay | null>(null);
  const [showQueueDialog, setShowQueueDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newDoctor, setNewDoctor] = useState<NewDoctorForm>({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    schedule: '',
    room: '',
    slotDuration: '10',
    assistants: '',
    status: 'In'
  });

  const {
    doctors,
    loading,
    error,
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor,
  } = useDoctors();

  const { appointments } = useAppointments();

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Transform API doctors to display format
  const transformedDoctors: DoctorDisplay[] = doctors.map((doctor, index) => {
    const doctorAppointments = appointments.filter(apt => apt.doctorId === doctor.id);
    const todayAppointments = doctorAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    });

    const completed = todayAppointments.filter(apt => apt.status === 'completed').length;
    const waiting = todayAppointments.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'confirmed'
    ).length;

    return {
      id: doctor.id, // Keep as string (UUID)
      name: doctor.user?.name || 'Loading...',
      specialty: doctor.specialty,
      initials: doctor.user?.name ? doctor.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '...',
      bgColor: index % 2 === 0 ? 'bg-teal-600' : 'bg-teal-700',
      status: doctor.status === 'active' ? 'In' : 
              doctor.status === 'break' ? 'Break' : 'Out',
      statusColor: doctor.status === 'active' ? 'bg-emerald-500' : 
                   doctor.status === 'break' ? 'bg-amber-500' : 'bg-gray-400',
      stats: { 
        total: todayAppointments.length, 
        done: completed, 
        waiting: waiting 
      },
      slotDuration: `${doctor.consultationDuration} min slots`,
      assistants: 'Loading...', // This would need to be fetched from assistant assignments
      online: doctor.isActive,
      phone: doctor.user?.phone || 'N/A',
      email: doctor.user?.email || 'N/A',
      schedule: 'Mon-Fri, 9:00 AM - 5:00 PM', // This would come from schedule API
      room: 'Room 101', // This would come from doctor profile
      queue: [] // This would come from queue API
    };
  });

  // Filter doctors based on search query
  const filteredDoctors = transformedDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openQueueDialog = (doctor: DoctorDisplay) => {
    setSelectedDoctor(doctor);
    setShowQueueDialog(true);
  };

  const openEditDialog = (doctor: DoctorDisplay) => {
    setSelectedDoctor(doctor);
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const closeDialogs = () => {
    setShowQueueDialog(false);
    setShowEditDialog(false);
    setShowAddDialog(false);
    setSelectedDoctor(null);
    setNewDoctor({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      schedule: '',
      room: '',
      slotDuration: '10',
      assistants: '',
      status: 'In'
    });
  };

  const handleAddDoctorChange = (field: keyof NewDoctorForm, value: string) => {
    setNewDoctor(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDoctorSubmit = async () => {
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email) {
      setSuccessMessage('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const success = await createDoctor({
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        specialty: newDoctor.specialty,
        licenseNumber: 'LIC' + Date.now(), // Generate a temporary license number
        consultationDuration: parseInt(newDoctor.slotDuration),
      });

      if (success) {
        setSuccessMessage('Doctor created successfully');
        closeDialogs();
      } else {
        setSuccessMessage('Failed to create doctor');
      }
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDoctorSubmit = async () => {
    if (!selectedDoctor) return;

    setActionLoading(true);
    try {
      // Get form values from the edit dialog
      const form = document.querySelector('#edit-doctor-form') as HTMLFormElement;
      if (!form) {
        setSuccessMessage('Form not found');
        setActionLoading(false);
        return;
      }

      const formData = new FormData(form);
      const updates = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        specialty: formData.get('specialty') as string,
        consultationDuration: parseInt(formData.get('consultationDuration') as string),
      };

      // Handle status change separately
      const newStatus = formData.get('status') as string;
      if (newStatus && newStatus !== selectedDoctor.status) {
        const statusMap: { [key: string]: 'active' | 'break' | 'offline' } = {
          'In': 'active',
          'Break': 'break',
          'Out': 'offline'
        };
        
        const statusSuccess = await updateDoctorStatus(selectedDoctor.id, statusMap[newStatus]);
        if (!statusSuccess) {
          setSuccessMessage('Failed to update doctor status');
          setActionLoading(false);
          return;
        }
      }

      const success = await updateDoctor(selectedDoctor.id, updates);

      if (success) {
        setSuccessMessage('Doctor updated successfully');
        closeDialogs();
      } else {
        setSuccessMessage('Failed to update doctor');
      }
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      setActionLoading(true);
      try {
        const success = await deleteDoctor(doctorId);
        
        if (success) {
          setSuccessMessage('Doctor deleted successfully');
        } else {
          setSuccessMessage('Failed to delete doctor');
        }
      } catch (err) {
        setSuccessMessage(apiUtils.handleError(err));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleStatusChange = async (doctorId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const statusMap: { [key: string]: 'active' | 'break' | 'offline' } = {
        'In': 'active',
        'Break': 'break',
        'Out': 'offline'
      };

      const success = await updateDoctorStatus(doctorId, statusMap[newStatus]);
      
      if (success) {
        setSuccessMessage('Doctor status updated successfully');
      } else {
        setSuccessMessage('Failed to update doctor status');
      }
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
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

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Doctors</h1>
            <p className="text-gray-500">Manage doctor profiles and schedules</p>
          </div>
          <button 
            onClick={openAddDialog}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            Add Doctor
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-0 focus:outline-none focus:ring-0 text-gray-700"
            />
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              {/* Doctor Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`${doctor.bgColor} w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg`}>
                      {doctor.initials}
                    </div>
                    {doctor.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{doctor.name}</h3>
                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
                <span className={`${doctor.statusColor} text-white text-xs font-medium px-3 py-1 rounded-full`}>
                  {doctor.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{doctor.stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{doctor.stats.done}</div>
                  <div className="text-xs text-gray-500 mt-1">Done</div>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-600">{doctor.stats.waiting}</div>
                  <div className="text-xs text-gray-500 mt-1">Waiting</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span>{doctor.slotDuration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>{doctor.assistants}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => openQueueDialog(doctor)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={16} />
                  View Queue
                </button>
                <button 
                  onClick={() => openEditDialog(doctor)}
                  disabled={actionLoading}
                  className="p-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  disabled={actionLoading}
                  className="p-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">No doctors found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Doctor Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Doctor</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the doctor information</p>
              </div>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Add Form */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDoctor.name}
                    onChange={(e) => handleAddDoctorChange('name', e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDoctor.specialty}
                    onChange={(e) => handleAddDoctorChange('specialty', e.target.value)}
                    placeholder="General Physician, Cardiologist, etc."
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newDoctor.phone}
                      onChange={(e) => handleAddDoctorChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) => handleAddDoctorChange('email', e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Schedule and Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Schedule <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDoctor.schedule}
                      onChange={(e) => handleAddDoctorChange('schedule', e.target.value)}
                      placeholder="Mon-Fri, 9:00 AM - 5:00 PM"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Room <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDoctor.room}
                      onChange={(e) => handleAddDoctorChange('room', e.target.value)}
                      placeholder="Room 101"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Slot Duration <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={newDoctor.slotDuration}
                    onChange={(e) => handleAddDoctorChange('slotDuration', e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                {/* Assistants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Assistants
                  </label>
                  <input
                    type="text"
                    value={newDoctor.assistants}
                    onChange={(e) => handleAddDoctorChange('assistants', e.target.value)}
                    placeholder="Comma separated names (e.g., Priya, Ravi)"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select 
                    value={newDoctor.status}
                    onChange={(e) => handleAddDoctorChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="In">Available (In)</option>
                    <option value="Break">On Break</option>
                    <option value="Out">Not Available (Out)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddDoctorSubmit}
                disabled={!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email || actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Doctor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Queue Dialog */}
      {showQueueDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.name} - Queue</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDoctor.specialty}</p>
              </div>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedDoctor.stats.total}</div>
                <div className="text-sm text-gray-500 mt-1">Total Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{selectedDoctor.stats.done}</div>
                <div className="text-sm text-gray-500 mt-1">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{selectedDoctor.stats.waiting}</div>
                <div className="text-sm text-gray-500 mt-1">In Queue</div>
              </div>
            </div>

            {/* Queue List */}
            <div className="overflow-y-auto max-h-96">
              {selectedDoctor.queue.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {selectedDoctor.queue.map((patient: Patient) => (
                    <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-teal-100 text-teal-700 font-bold px-3 py-2 rounded-lg text-sm">
                            {patient.token}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                              <span className="text-sm text-gray-500">({patient.age} yrs)</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{patient.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{patient.time}</div>
                            <div className="text-xs text-amber-600 capitalize mt-0.5">{patient.status}</div>
                          </div>
                          <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                            Call
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No patients in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Dialog */}
      {showEditDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Doctor Profile</h2>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Edit Form */}
            <form id="edit-doctor-form" className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedDoctor.name}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    defaultValue={selectedDoctor.specialty}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={selectedDoctor.phone}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={selectedDoctor.email}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Schedule and Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Schedule
                    </label>
                    <input
                      type="text"
                      name="schedule"
                      defaultValue={selectedDoctor.schedule}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Room
                    </label>
                    <input
                      type="text"
                      name="room"
                      defaultValue={selectedDoctor.room}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Slot Duration
                  </label>
                  <select 
                    name="consultationDuration"
                    defaultValue={selectedDoctor.slotDuration.includes('15') ? '15' : '10'}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                {/* Assistants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Assistants
                  </label>
                  <input
                    type="text"
                    name="assistants"
                    defaultValue={selectedDoctor.assistants}
                    placeholder="Comma separated names"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <select 
                    name="status"
                    defaultValue={selectedDoctor.status}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="In">Available (In)</option>
                    <option value="Break">On Break</option>
                    <option value="Out">Not Available (Out)</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditDoctorSubmit}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}