'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Star, Clock, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { patientAppointmentApi, Doctor, TimeSlot } from '@/lib/api';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { usePatientDoctors } from '@/lib/hooks/usePatientDoctors';

export default function BookAppointmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, patient, logout } = usePatientAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Use the patient doctors hook (now uses public endpoint)
  const { doctors, loading: doctorsLoading, error: doctorsError, refreshDoctors } = usePatientDoctors();

  // Check authentication - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, router]);

  // Handle doctors loading error
  useEffect(() => {
    if (doctorsError) {
      setError(doctorsError);
    }
  }, [doctorsError]);

  // Load available time slots when doctor and date are selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (selectedDoctor && selectedDate) {
        try {
          setIsLoading(true);
          const response = await patientAppointmentApi.getAvailableSlots(selectedDoctor, selectedDate.toISOString().split('T')[0]);
          if (response.success && response.data) {
            setTimeSlots(response.data);
          }
        } catch (error: any) {
          setError(error.message || 'Failed to load time slots');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTimeSlots();
  }, [selectedDoctor, selectedDate]);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  const handleConfirmBooking = async () => {
    if (selectedDoctorData && selectedTime && selectedDate && reason.trim()) {
      try {
        setIsBooking(true);
        setError('');
        
        const bookingData = {
          doctorId: selectedDoctor!,
          appointmentDate: selectedDate.toISOString().split('T')[0],
          appointmentTime: selectedTime,
          reason: reason.trim()
        };

        console.log('Booking data:', bookingData);
        console.log('Patient token in localStorage:', localStorage.getItem('patientToken'));
        const response = await patientAppointmentApi.bookAppointment(bookingData);
        console.log('Booking response:', response);
        
        if (response.success) {
          alert(`Appointment booked successfully!\nPatient: ${patient?.name || 'Unknown'}\nDoctor: ${selectedDoctorData.user?.name || 'Dr. Unknown'}\nDate: ${selectedDate.toLocaleDateString()}\nTime: ${selectedTime}`);
          router.push('/Patient/myappoinment');
        } else {
          setError(response.message || 'Failed to book appointment');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to book appointment');
      } finally {
        setIsBooking(false);
      }
    } else {
      setError('Please fill in all required fields');
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">Please log in to book an appointment.</p>
            <button
              onClick={() => router.push('/Auth-patientLogin')}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Book Appointment
              </h1>
              <p className="text-gray-600">
                Schedule your visit with our doctors
              </p>
            </div>
            <div className="flex items-center gap-4">
              {patient && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Logged in as</p>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.email}</p>
                </div>
              )}
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error Message - Only show non-authentication errors */}
        {error && !error.includes('Authentication') && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Select Doctor */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Step 1: Select Doctor
          </h2>

          {/* Search Input and Refresh Button */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={refreshDoctors}
              disabled={doctorsLoading}
              className="px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {doctorsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {/* Doctor Cards Grid */}
          {doctorsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
              <p className="text-gray-500">Loading doctors...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor.id)}
                  className={`
                    relative border rounded-xl p-6 transition-all cursor-pointer
                    ${selectedDoctor === doctor.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-teal-100">
                      <User className="w-8 h-8 text-teal-600" />
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1 text-gray-900">
                        {doctor.user?.name || 'Dr. Unknown'}
                      </h3>
                      <p className="mb-2 text-gray-600">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          {doctor.consultationDuration} min consultation
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-gray-700">
                            4.5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No doctors found matching your search.</p>
            </div>
          )}
        </div>

        {/* Step 2: Select Date - Only show if doctor is selected */}
        {selectedDoctor && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 2: Select Date
            </h2>

            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
          </div>
        )}

        {/* Step 3: Select Time Slot - Only show if doctor and date are selected */}
        {selectedDoctor && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 3: Select Time Slot
            </h2>

            {/* Time Slots Grid */}
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading available time slots...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => !slot.isBooked && setSelectedTime(slot.time)}
                    disabled={slot.isBooked}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${slot.isBooked
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        : selectedTime === slot.time
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Clock className={`w-5 h-5 ${slot.isBooked ? 'text-gray-300' : selectedTime === slot.time ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${slot.isBooked ? 'text-gray-400' : selectedTime === slot.time ? 'text-white' : 'text-gray-700'}`}>
                        {slot.time}
                      </span>
                      {slot.isBooked && (
                        <span className="text-xs text-gray-400">Booked</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Reason for Visit - Only show if all selections are made */}
        {selectedDoctor && selectedTime && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 4: Reason for Visit
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Please describe your reason for the visit *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                placeholder="Brief description of your symptoms or concern..."
              />
            </div>
          </div>
        )}

        {/* Booking Summary - Only show if all selections are made */}
        {selectedDoctor && selectedTime && reason.trim() && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Summary
            </h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-700">
                <span className="font-medium">Doctor:</span> {selectedDoctorData?.user?.name || 'Dr. Unknown'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Specialty:</span> {selectedDoctorData?.specialty}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Time:</span> {selectedTime}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Reason:</span> {reason}
              </p>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={isBooking}
              className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}