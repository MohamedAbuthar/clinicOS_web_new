'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctors } from '@/lib/hooks/useDoctors';


const MainDashboard = () => {
  const router = useRouter();
  const { doctors, loading, error } = useDoctors();
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);

  const handleLogin = () => {
    router.push('/auth-login');
  };

  const handleBookAppointment = () => {
    router.push('/Auth-patientLogin');
  };

  // Always show all doctors - no filtering applied
  useEffect(() => {
    if (loading || !doctors.length) return;
    
    // Always show all doctors regardless of login status
    setFilteredDoctors(doctors);
    console.log('Main dashboard - showing all doctors:', doctors.length);
  }, [doctors, loading]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          {/* Logo - Left Corner */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-blue-600" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">HealthCare Clinic</h1>
              <p className="text-sm text-gray-500">Your Health, Our Priority</p>
            </div>
          </div>

          {/* Login Button - Right Corner */}
          <button 
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-gradient-to-b from-blue-50 to-blue-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Heart Icon */}
          <div className="flex justify-center mb-8">
            <svg 
              className="w-16 h-16 text-blue-600" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-gray-800 mb-6 leading-tight">
            Compassionate Care for<br />Every Patient
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            We provide compassionate, personalized care for every patient. Your health is our top priority.
          </p>

          {/* Book Appointment Button */}
          <button 
            onClick={handleBookAppointment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg"
          >
            Book Appointment Now
          </button>
        </div>
      </main>

      {/* Our Doctors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-1 sm:px-2 lg:px-4">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Our Doctors
            </h2>
            <p className="text-lg text-gray-600">
              Meet our experienced healthcare professionals dedicated to your wellbeing.
            </p>
            {/* Results count indicator */}
            {!loading && (
              <div className="mt-2 text-sm text-gray-500">
                Showing all {filteredDoctors.length} doctors
              </div>
            )}
          </div>

          {/* Doctor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              // Loading state
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">
                    {loading ? 'Loading doctors...' : 'Filtering doctors...'}
                  </span>
                </div>
              </div>
            ) : error ? (
              // Error state
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-gray-600">Failed to load doctors</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              // No doctors state
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">👨‍⚕️</div>
                  <p className="text-gray-600">
                    No doctors available at the moment. Please try again later.
                  </p>
          </div>
        </div>
            ) : (
              // Display filtered doctors
              filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col">
                  <div className="h-72 bg-blue-100 flex items-center justify-center">
                    <div className="w-36 h-36 bg-blue-200 rounded-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      {doctor.user?.name ? `Dr. ${doctor.user.name}` : 'Dr. Name Not Available'}
            </h3>
                    <p className="text-blue-600 font-medium mb-4 text-lg">{doctor.specialty || 'General Medicine'}</p>
                    <p className="text-gray-600 text-base leading-relaxed mb-6 flex-grow">
                      {doctor.user?.name ? 
                        `Dr. ${doctor.user.name} specializes in ${doctor.specialty || 'general medicine'} with ${doctor.consultationDuration || 30} minute consultations.` :
                        'Experienced healthcare professional dedicated to providing quality patient care.'
                      }
                    </p>
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                        doctor.status === 'In' ? 'bg-green-100 text-green-800' :
                        doctor.status === 'Break' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doctor.status === 'In' ? 'Available' : 
                         doctor.status === 'Break' ? 'On Break' : 'Offline'}
                      </span>
                      {doctor.consultationDuration && (
                        <span className="text-sm text-gray-500">
                          {doctor.consultationDuration} min sessions
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={handleBookAppointment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors text-base"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* What We Treat Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">What We Treat</h2>
            <p className="text-lg text-gray-600">
              Comprehensive healthcare services for a wide range of conditions
            </p>
          </div>

          {/* Treatment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Fever */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 1.38-.56 2.63-1.46 3.54L12 12.54l-3.54-3.54C7.56 8.63 7 7.38 7 6c0-2.76 2.24-5 5-5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Fever</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We diagnose and treat your fever with personalized care and modern testing to identify the root cause.
                  </p>
                </div>
              </div>
            </div>

            {/* Cough & Cold */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Cough & Cold</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Our specialists provide effective treatment for respiratory symptoms with evidence-based approaches.
                  </p>
                </div>
              </div>
            </div>

            {/* Headache */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Headache</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Comprehensive headache management including diagnosis, treatment, and prevention strategies.
                  </p>
                </div>
              </div>
            </div>

            {/* Toothache */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Toothache</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Expert dental care and pain management to address your dental concerns with immediate relief.
                  </p>
                </div>
              </div>
          </div>

            {/* Allergies */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Allergies</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Specialized allergy testing and treatment plans tailored to your specific needs and triggers.
                  </p>
                </div>
              </div>
            </div>

            {/* Skin Issues */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Skin Issues</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Professional dermatological care for various skin conditions with advanced treatment options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* HealthCare Clinic */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">HealthCare Clinic</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Providing quality healthcare services with compassion and excellence since 2010.
            </p>
          </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Contact Us</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span className="text-gray-600 text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span className="text-gray-600 text-sm">info@healthcareclinic.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
                  <span className="text-gray-600 text-sm">123 Medical Plaza, Health City, HC 12345</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Hours</h3>
              <div className="space-y-1">
                <p className="text-gray-600 text-sm">Monday - Friday: 8:00 AM - 8:00 PM</p>
                <p className="text-gray-600 text-sm">Saturday: 9:00 AM - 5:00 PM</p>
                <p className="text-gray-600 text-sm">Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainDashboard;