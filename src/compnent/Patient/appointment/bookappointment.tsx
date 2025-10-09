'use client'
import React, { useState } from 'react';
import { Search, User, Star, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

export default function BookAppointmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 9, 9));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const doctors = [
    {
      id: 1,
      name: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      experience: '15 years experience',
      rating: 4.8,
      available: true
    },
    {
      id: 2,
      name: 'Dr. Siva Raman',
      specialty: 'Dermatologist',
      experience: '12 years experience',
      rating: 4.9,
      available: true
    },
    {
      id: 3,
      name: 'Dr. Rajesh Kumar',
      specialty: 'Cardiologist',
      experience: '20 years experience',
      rating: 4.7,
      available: false
    },
    {
      id: 4,
      name: 'Dr. Meena Lakshmi',
      specialty: 'Pediatrician',
      experience: '10 years experience',
      rating: 4.9,
      available: true
    }
  ];

  const timeSlots = [
    { time: '09:00 AM', booked: false },
    { time: '09:30 AM', booked: true },
    { time: '10:00 AM', booked: false },
    { time: '10:30 AM', booked: true },
    { time: '11:00 AM', booked: false },
    { time: '11:30 AM', booked: false },
    { time: '02:00 PM', booked: true },
    { time: '02:30 PM', booked: false },
    { time: '03:00 PM', booked: false },
    { time: '03:30 PM', booked: true },
    { time: '04:00 PM', booked: true },
    { time: '04:30 PM', booked: false }
  ];

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  const handleConfirmBooking = () => {
    if (selectedDoctorData && selectedTime && selectedDate) {
      alert(`Booking confirmed!\nDoctor: ${selectedDoctorData.name}\nDate: ${selectedDate.toLocaleDateString()}\nTime: ${selectedTime}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Book Appointment
          </h1>
          <p className="text-gray-600">
            Schedule your visit with our doctors
          </p>
        </div>

        {/* Step 1: Select Doctor */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Step 1: Select Doctor
          </h2>

          {/* Search Input */}
          <div className="relative mb-6">
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

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => doctor.available && setSelectedDoctor(doctor.id)}
                className={`
                  relative border rounded-xl p-6 transition-all cursor-pointer
                  ${!doctor.available 
                    ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                    : selectedDoctor === doctor.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* Unavailable Badge */}
                {!doctor.available && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Unavailable
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`
                    flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                    ${doctor.available ? 'bg-teal-100' : 'bg-gray-200'}
                  `}>
                    <User className={`w-8 h-8 ${doctor.available ? 'text-teal-600' : 'text-gray-400'}`} />
                  </div>

                  {/* Doctor Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold mb-1 ${!doctor.available ? 'text-gray-400' : 'text-gray-900'}`}>
                      {doctor.name}
                    </h3>
                    <p className={`mb-2 ${!doctor.available ? 'text-gray-400' : 'text-gray-600'}`}>
                      {doctor.specialty}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={!doctor.available ? 'text-gray-400' : 'text-gray-600'}>
                        {doctor.experience}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${!doctor.available ? 'fill-gray-300 text-gray-300' : 'fill-yellow-400 text-yellow-400'}`} />
                        <span className={`font-medium ${!doctor.available ? 'text-gray-400' : 'text-gray-700'}`}>
                          {doctor.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => !slot.booked && setSelectedTime(slot.time)}
                  disabled={slot.booked}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${slot.booked
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : selectedTime === slot.time
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Clock className={`w-5 h-5 ${slot.booked ? 'text-gray-300' : selectedTime === slot.time ? 'text-white' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${slot.booked ? 'text-gray-400' : selectedTime === slot.time ? 'text-white' : 'text-gray-700'}`}>
                      {slot.time}
                    </span>
                    {slot.booked && (
                      <span className="text-xs text-gray-400">Booked</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Booking Summary - Only show if all selections are made */}
        {selectedDoctor && selectedTime && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Summary
            </h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-700">
                <span className="font-medium">Doctor:</span> {selectedDoctorData?.name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Time:</span> {selectedTime}
              </p>
            </div>
            <button
              onClick={handleConfirmBooking}
              className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}