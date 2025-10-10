import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showViewReportDialog, setShowViewReportDialog] = useState(false);
  const [showBookAgainDialog, setShowBookAgainDialog] = useState(false);
  const [showBookAppointmentDialog, setShowBookAppointmentDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);

  const upcomingAppointments: UpcomingAppointment[] = [
    {
      id: 1,
      doctorName: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      date: '10/12/2025',
      time: '10:30 AM',
      room: 'Room 201',
      phone: '+91 98765 43210',
      token: 'T-042',
      status: 'confirmed'
    },
    {
      id: 2,
      doctorName: 'Dr. Rajesh Kumar',
      specialty: 'Cardiologist',
      date: '10/15/2025',
      time: '2:00 PM',
      room: 'Room 305',
      phone: '+91 98765 43211',
      token: 'T-018',
      status: 'confirmed'
    }
  ];

  const pastAppointments: PastAppointment[] = [
    {
      id: 1,
      doctorName: 'Dr. Siva Raman',
      specialty: 'Dermatologist',
      diagnosis: 'Routine Checkup',
      date: '9/28/2025',
      time: '11:00 AM',
      status: 'completed'
    },
    {
      id: 2,
      doctorName: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      diagnosis: 'Seasonal Flu',
      date: '9/15/2025',
      time: '3:30 PM',
      status: 'completed'
    }
  ];

  const cancelledAppointments: CancelledAppointment[] = [
    {
      id: 1,
      doctorName: 'Dr. Meena Lakshmi',
      specialty: 'Pediatrician',
      reason: 'Patient Request',
      date: '9/10/2025',
      time: '9:00 AM',
      status: 'cancelled'
    }
  ];

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
            onClick={() => setShowBookAppointmentDialog(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Book New Appointment
          </button>
        </div>

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
                      {appointment.doctorName}
                    </h3>
                    <p className="text-gray-500 text-base">{appointment.specialty}</p>
                  </div>
                </div>
                <span className="bg-green-50 text-green-600 px-4 py-1 rounded-md text-sm font-medium">
                  {appointment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.time}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.room}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.phone}</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="inline-block bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Token: {appointment.token}
                </span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowRescheduleDialog(true);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Reschedule
                </button>
                <button className="px-6 py-2 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                  Cancel
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
                      {appointment.doctorName}
                    </h3>
                    <p className="text-gray-500 text-base">{appointment.specialty}</p>
                    <p className="text-gray-500 text-base">Diagnosis: {appointment.diagnosis}</p>
                  </div>
                </div>
                <span className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {appointment.status}
                </span>
              </div>

              <div className="flex items-center gap-6 mb-6 mt-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.time}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowViewReportDialog(true);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  View Report
                </button>
                <button 
                  onClick={() => {
                    setSelectedAppointment(appointment);
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
                      {appointment.doctorName}
                    </h3>
                    <p className="text-gray-500 text-base">{appointment.specialty}</p>
                    <p className="text-gray-500 text-base">Reason: {appointment.reason}</p>
                  </div>
                </div>
                <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {appointment.status}
                </span>
              </div>

              <div className="flex items-center gap-6 mb-6 mt-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{appointment.time}</span>
                </div>
              </div>

              <div>
                <button 
                  onClick={() => {
                    setSelectedAppointment(appointment);
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRescheduleDialog(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleDialog(false);
                    alert('Appointment rescheduled successfully!');
                  }}
                  className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Confirm
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