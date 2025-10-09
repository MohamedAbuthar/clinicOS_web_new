'use client'
import React, { useState } from 'react';
import { Search, User, Star } from 'lucide-react';

export default function BookAppointmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

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

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="bg-white rounded-xl p-6 border border-gray-200">
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
      </div>
    </div>
  );
}