import React from 'react';
import { Search, Calendar, Plus, Clock, Phone } from 'lucide-react';

export default function AppointmentsPage() {
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

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage and track all patient appointments</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium">
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
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="col-span-1 text-sm font-semibold text-gray-600">Token</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Patient</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Doctor</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Date & Time</div>
          <div className="col-span-1 text-sm font-semibold text-gray-600">Source</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Status</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Actions</div>
        </div>

        {/* Table Body */}
        {appointments.map((appointment, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
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

            {/* Source */}
            <div className="col-span-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  appointment.source === 'Web'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                {appointment.source}
              </span>
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
    </div>
  );
}