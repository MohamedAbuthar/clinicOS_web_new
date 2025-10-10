"use client"

import React, { useState } from 'react';
import { Search, Clock, Users, Eye, Edit, UserPlus, X, Phone, Mail, Calendar, MapPin, Save, User } from 'lucide-react';

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

interface Doctor {
  id: number;
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
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showQueueDialog, setShowQueueDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const doctors: Doctor[] = [
    {
      id: 1,
      name: 'Dr. Sivakumar',
      specialty: 'General Physician',
      initials: 'SI',
      bgColor: 'bg-teal-600',
      status: 'In',
      statusColor: 'bg-emerald-500',
      stats: { total: 32, done: 18, waiting: 14 },
      slotDuration: '10 min slots',
      assistants: 'Priya, Ravi',
      online: true,
      phone: '+91 98765 43210',
      email: 'sivakumar@clinic.com',
      schedule: 'Mon-Sat, 9:00 AM - 5:00 PM',
      room: 'Room 101',
      queue: [
        { id: 1, token: 'T019', name: 'Ramesh Kumar', age: 45, type: 'Consultation', status: 'waiting', time: '10:30 AM' },
        { id: 2, token: 'T020', name: 'Priya Singh', age: 32, type: 'Follow-up', status: 'waiting', time: '10:40 AM' },
        { id: 3, token: 'T021', name: 'Amit Patel', age: 28, type: 'Consultation', status: 'waiting', time: '10:50 AM' },
        { id: 4, token: 'T022', name: 'Sunita Reddy', age: 55, type: 'Check-up', status: 'waiting', time: '11:00 AM' }
      ]
    },
    {
      id: 2,
      name: 'Dr. Meena Patel',
      specialty: 'Pediatrician',
      initials: 'MP',
      bgColor: 'bg-teal-700',
      status: 'Break',
      statusColor: 'bg-amber-500',
      stats: { total: 24, done: 20, waiting: 4 },
      slotDuration: '15 min slots',
      assistants: 'Lakshmi',
      online: true,
      phone: '+91 98765 43211',
      email: 'meena.patel@clinic.com',
      schedule: 'Mon-Fri, 10:00 AM - 6:00 PM',
      room: 'Room 102',
      queue: [
        { id: 1, token: 'T045', name: 'Baby Aisha', age: 2, type: 'Vaccination', status: 'waiting', time: '2:00 PM' },
        { id: 2, token: 'T046', name: 'Rohan Sharma', age: 5, type: 'Check-up', status: 'waiting', time: '2:15 PM' },
        { id: 3, token: 'T047', name: 'Kavya Nair', age: 8, type: 'Consultation', status: 'waiting', time: '2:30 PM' },
        { id: 4, token: 'T048', name: 'Arjun Desai', age: 3, type: 'Follow-up', status: 'waiting', time: '2:45 PM' }
      ]
    },
    {
      id: 3,
      name: 'Dr. Rajesh Kumar',
      specialty: 'Dermatologist',
      initials: 'RK',
      bgColor: 'bg-teal-600',
      status: 'Out',
      statusColor: 'bg-gray-400',
      stats: { total: 0, done: 0, waiting: 0 },
      slotDuration: '10 min slots',
      assistants: 'Priya',
      online: false,
      phone: '+91 98765 43212',
      email: 'rajesh.kumar@clinic.com',
      schedule: 'Mon-Wed-Fri, 11:00 AM - 4:00 PM',
      room: 'Room 103',
      queue: []
    }
  ];

  const openQueueDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowQueueDialog(true);
  };

  const openEditDialog = (doctor: Doctor) => {
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

  const handleAddDoctorSubmit = () => {
    console.log('New Doctor:', newDoctor);
    // Add your doctor creation logic here
    closeDialogs();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Doctors</h1>
            <p className="text-gray-500">Manage doctor profiles and schedules</p>
          </div>
          <button 
            onClick={openAddDialog}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border-0 focus:outline-none focus:ring-0 text-gray-700"
            />
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
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
                  className="p-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))}
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
                disabled={!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} />
                Add Doctor
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
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
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
                    defaultValue={selectedDoctor.status}
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
              <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}