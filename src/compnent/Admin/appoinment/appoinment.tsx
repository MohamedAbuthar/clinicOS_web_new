"use client"

import React, { useState } from 'react';
import { Search, Calendar, Plus, Clock, Phone, X, User, Mail } from 'lucide-react';

export default function AppointmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    email: '',
    doctor: '',
    date: '',
    time: '',
    source: 'Web',
  });

  const appointments = [
    {
      token: '#12',
      patient: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      doctor: 'Dr. Priya Sharma',
      date: 'Today',
      time: '10:30 AM',
      source: 'Web',
      status: 'Confirmed',
    },
    {
      token: '#5',
      patient: 'Anita Desai',
      phone: '+91 98765 43211',
      doctor: 'Dr. Rajesh Kumar',
      date: 'Today',
      time: '11:00 AM',
      source: 'Assistant',
      status: 'Confirmed',
    },
    {
      token: '#15',
      patient: 'Vijay Patel',
      phone: '+91 98765 43212',
      doctor: 'Dr. Priya Sharma',
      date: 'Today',
      time: '2:00 PM',
      source: 'Web',
      status: 'Rescheduled',
    },
  ];

  const doctors = [
    'Dr. Priya Sharma',
    'Dr. Rajesh Kumar',
    'Dr. Amit Verma',
    'Dr. Sunita Reddy',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('New Appointment:', formData);
    // Add your appointment creation logic here
    setIsDialogOpen(false);
    // Reset form
    setFormData({
      patientName: '',
      phone: '',
      email: '',
      doctor: '',
      date: '',
      time: '',
      source: 'Web',
    });
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage and track all patient appointments</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
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
        {appointments.map((appointment, index) => (
          <div
            key={index}
            className="grid grid-cols-11 gap-4 px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
          >
            {/* Token */}
            <div className="col-span-1">
              <span className="text-2xl font-bold text-teal-500">{appointment.token}</span>
            </div>

            {/* Patient */}
            <div className="col-span-2">
              <div className="font-semibold text-gray-900">{appointment.patient}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Phone className="w-3 h-3" />
                {appointment.phone}
              </div>
            </div>

            {/* Doctor */}
            <div className="col-span-2">
              <span className="text-gray-900 font-medium">{appointment.doctor}</span>
            </div>

            {/* Date & Time */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-semibold text-gray-900">{appointment.date}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {appointment.time}
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                  appointment.status === 'Confirmed'
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {appointment.status}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center gap-3">
              <button className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                View
              </button>
              <button className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        ))}
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
                    {doctors.map((doctor, index) => (
                      <option key={index} value={doctor}>{doctor}</option>
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
                  className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
                >
                  Create Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}