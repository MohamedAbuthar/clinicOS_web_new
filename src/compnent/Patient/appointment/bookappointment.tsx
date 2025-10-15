'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Star, Clock, Loader2, Users, Sun, Moon, Check, X, Info, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Doctor } from '@/lib/api';
import { createMultipleAppointments, getDoctorAppointmentsByDate, getFamilyMembers } from '@/lib/firebase/firestore';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { usePatientDoctors } from '@/lib/hooks/usePatientDoctors';
import { 
  SessionType, 
  getSessionSlots,
  getNextTokenForSession, 
  assignSlotByToken,
  getSessionCapacity,
  formatSessionText,
  getSessionTimeRange,
  canBookSession,
  getAvailableSessionsForDate
} from '@/lib/utils/sessionBookingHelper';

interface FamilyMember {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  relationship?: string;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, patient, logout } = usePatientAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Family member booking
  const [includeFamilyMembers, setIncludeFamilyMembers] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<string[]>([]);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);

  // Session capacity
  const [sessionCapacity, setSessionCapacity] = useState<{
    morning: { totalSlots: number; bookedSlots: number; availableSlots: number; };
    evening: { totalSlots: number; bookedSlots: number; availableSlots: number; };
  } | null>(null);

  // Use the patient doctors hook
  const { doctors, loading: doctorsLoading, error: doctorsError, refreshDoctors } = usePatientDoctors();

  // Handle doctors loading error
  useEffect(() => {
    if (doctorsError) {
      setError(doctorsError);
    }
  }, [doctorsError]);

  // Load family members when toggle is enabled
  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (includeFamilyMembers && patient?.familyId) {
        try {
          setLoadingFamilyMembers(true);
          const result = await getFamilyMembers(patient.familyId);
          if (result.success && result.data) {
            // Filter out the current patient
            const members = result.data.filter((member: any) => member.id !== patient.id);
            setFamilyMembers(members as FamilyMember[]);
          }
        } catch (error: any) {
          console.error('Error loading family members:', error);
        } finally {
          setLoadingFamilyMembers(false);
        }
      }
    };

    loadFamilyMembers();
  }, [includeFamilyMembers, patient]);

  // Load session capacity when doctor and date are selected
  useEffect(() => {
    const loadSessionCapacity = async () => {
      if (selectedDoctor && selectedDate) {
        try {
          setIsLoading(true);
          setError('');
          
          // Find the selected doctor
          const doctor = doctors.find(d => d.id === selectedDoctor);
          
          if (!doctor) {
            setError('Doctor not found');
            setIsLoading(false);
            return;
          }

          if (!doctor.availableSlots || doctor.availableSlots.length === 0) {
            setError('⚠️ This doctor does not have time slots configured. Please contact the admin to set up the doctor\'s schedule.');
            setIsLoading(false);
            return;
          }

          // Get existing appointments for this doctor and date
          const dateStr = selectedDate.toISOString().split('T')[0];
          const result = await getDoctorAppointmentsByDate(selectedDoctor, dateStr);
          const existingAppointments = result.success && result.data ? result.data : [];

          // Calculate capacity for morning and evening sessions
          const morningCap = getSessionCapacity(
            doctor.availableSlots,
            'morning',
            dateStr,
            existingAppointments
          );

          const eveningCap = getSessionCapacity(
            doctor.availableSlots,
            'evening',
            dateStr,
            existingAppointments
          );

          setSessionCapacity({
            morning: morningCap,
            evening: eveningCap
          });

        } catch (error: any) {
          console.error('Error loading session capacity:', error);
          setError(error.message || 'Failed to load session information');
        } finally {
          setIsLoading(false);
        }
      } else {
        setSessionCapacity(null);
      }
    };

    loadSessionCapacity();
  }, [selectedDoctor, selectedDate, doctors]);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  const toggleFamilyMember = (memberId: string) => {
    setSelectedFamilyMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctorData || !selectedSession || !selectedDate || !reason.trim() || !patient?.id) {
      setError('Please fill in all required fields');
      return;
    }

    // Check session capacity
    if (sessionCapacity) {
      const capacity = sessionCapacity[selectedSession];
      const totalBookings = 1 + selectedFamilyMembers.length;
      
      if (capacity.availableSlots < totalBookings) {
        setError(`Not enough slots available in this session. Available: ${capacity.availableSlots}, Requested: ${totalBookings}`);
        return;
      }
    }

    // Validate session booking rules
    const sessionCheck = canBookSession(selectedDate, selectedSession);
    if (!sessionCheck.canBook) {
      setError(sessionCheck.reason || 'Cannot book this session');
      return;
    }

      try {
        setIsBooking(true);
        setError('');
        
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Get existing appointments for token generation
      const result = await getDoctorAppointmentsByDate(selectedDoctor!, dateStr);
      const existingAppointments = result.success && result.data ? result.data : [];
      
      // Get session slots
      const sessionSlots = getSessionSlots(selectedDoctorData.availableSlots || [], selectedSession);
      const bookedSlots = existingAppointments
        .filter((apt: any) => sessionSlots.includes(apt.appointmentTime))
        .map((apt: any) => apt.appointmentTime);
      
      // Prepare appointments data (patient + family members)
      const appointmentsToCreate = [];
      
      // Patient's appointment
      const patientToken = getNextTokenForSession(existingAppointments, selectedSession, dateStr);
      const patientSlot = assignSlotByToken(patientToken, sessionSlots, bookedSlots);
      
      if (!patientSlot) {
        setError('No available slots for the selected session');
        setIsBooking(false);
        return;
      }

      appointmentsToCreate.push({
          patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorId: selectedDoctor!,
        appointmentDate: dateStr,
        appointmentTime: patientSlot,
        session: selectedSession,
        duration: selectedDoctorData.consultationDuration || 30,
        status: 'scheduled',
        source: 'web',
        notes: reason.trim(),
        tokenNumber: patientToken
      });

      bookedSlots.push(patientSlot); // Mark as booked for next iteration
      
      // Family members' appointments
      for (let i = 0; i < selectedFamilyMembers.length; i++) {
        const memberId = selectedFamilyMembers[i];
        const member = familyMembers.find(m => m.id === memberId);
        
        if (!member) continue;
        
        const memberToken = getNextTokenForSession(
          [...existingAppointments, ...appointmentsToCreate],
          selectedSession,
          dateStr
        );
        const memberSlot = assignSlotByToken(memberToken, sessionSlots, bookedSlots);
        
        if (!memberSlot) {
          setError(`Not enough slots available for all selected family members`);
          setIsBooking(false);
          return;
        }

        appointmentsToCreate.push({
          patientId: memberId,
          patientName: member.name,
          patientPhone: patient.phone, // Use patient's phone for family members
          doctorId: selectedDoctor!,
          appointmentDate: dateStr,
          appointmentTime: memberSlot,
          session: selectedSession,
          duration: selectedDoctorData.consultationDuration || 30,
          status: 'scheduled',
          source: 'web',
          notes: `Booked with ${patient.name}. ${reason.trim()}`,
          tokenNumber: memberToken,
          bookedBy: patient.id // Track who booked this appointment
        });

        bookedSlots.push(memberSlot); // Mark as booked for next iteration
      }
      
      console.log(`📝 Booking ${appointmentsToCreate.length} appointments:`, appointmentsToCreate.map(a => `${a.patientName} - ${a.tokenNumber} - ${a.appointmentTime}`));
      
      // Create all appointments
      const bookingResult = await createMultipleAppointments(appointmentsToCreate);
      
      if (bookingResult.success) {
        const summary = appointmentsToCreate.map(apt => 
          `${apt.patientName}: Token ${apt.tokenNumber} at ${apt.appointmentTime}`
        ).join('\n');
        
        alert(`✅ Appointments booked successfully!\n\nDoctor: ${selectedDoctorData.user?.name || 'Dr. Unknown'}\nDate: ${selectedDate.toLocaleDateString()}\nSession: ${formatSessionText(selectedSession)}\n\n${summary}`);
          router.push('/Patient/myappoinment');
        } else {
        setError(bookingResult.error || 'Failed to book appointment');
        }
      } catch (error: any) {
      console.error('Booking error:', error);
        setError(error.message || 'Failed to book appointment');
      } finally {
        setIsBooking(false);
    }
  };

  const SessionCard = ({ session }: { session: SessionType }) => {
    if (!sessionCapacity) return null;
    
    const capacity = sessionCapacity[session];
    const icon = session === 'morning' ? Sun : Moon;
    const Icon = icon;
    const isSelected = selectedSession === session;
    const sessionCheck = selectedDate ? canBookSession(selectedDate, session) : { canBook: false };
    const isDisabled = !sessionCheck.canBook || capacity.availableSlots === 0;
    
    return (
      <button
        onClick={() => !isDisabled && setSelectedSession(session)}
        disabled={isDisabled}
        className={`
          relative p-6 rounded-xl border-2 transition-all
          ${isDisabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
            : isSelected
            ? 'bg-teal-500 border-teal-500 text-white shadow-lg'
            : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
          }
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <Icon className={`w-10 h-10 ${isDisabled ? 'text-gray-300' : isSelected ? 'text-white' : 'text-teal-500'}`} />
        <div className="text-center">
            <h3 className={`text-lg font-bold mb-1 ${isDisabled ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-900'}`}>
              {session === 'morning' ? '🌅 Morning' : '🌆 Evening'}
            </h3>
            <p className={`text-sm mb-2 ${isDisabled ? 'text-gray-400' : isSelected ? 'text-teal-50' : 'text-gray-600'}`}>
              {getSessionTimeRange(session)}
            </p>
            <div className={`text-xs ${isDisabled ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-500'}`}>
              {capacity.availableSlots} / {capacity.totalSlots} slots available
        </div>
            {!sessionCheck.canBook && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                {sessionCheck.reason}
      </div>
            )}
          </div>
          {isSelected && (
            <div className="absolute top-2 right-2">
              <Check className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </button>
    );
  };

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

        {/* Error Message */}
        {error && !error.includes('Authentication') && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
          {filteredDoctors.length === 0 && !doctorsLoading && (
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
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedSession(null); // Reset session when date changes
                  }
                }}
                disabled={(date) => {
                  const today = new Date();
                  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  return dateStart < todayStart;
                }}
                className="rounded-md border"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              ℹ️ You can only book appointments for today or future dates
            </p>
          </div>
        )}

        {/* Step 3: Select Session - Only show if doctor and date are selected */}
        {selectedDoctor && selectedDate && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 3: Select Session
            </h2>

            {/* Session Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How Session Booking Works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Choose Morning or Evening session</li>
                    <li>System automatically assigns your time slot</li>
                    <li>You&apos;ll receive a token number (e.g., #1, #2, #3...)</li>
                    <li>Lower token numbers are assigned earlier time slots</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Session Cards */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
                <p className="text-gray-500">Loading session information...</p>
              </div>
            ) : sessionCapacity ? (
              (() => {
                const availableSessions = getAvailableSessionsForDate(selectedDate);
                if (availableSessions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg font-medium mb-2">No sessions available for this date</p>
                      <p className="text-sm">Please select a different date</p>
                    </div>
                  );
                }
                return (
                  <div className={`grid gap-6 ${availableSessions.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {availableSessions.map(session => (
                      <SessionCard key={session} session={session} />
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-gray-500">
                No session information available
              </div>
            )}
          </div>
        )}

        {/* Step 4: Family Members - Only show if session is selected */}
        {selectedDoctor && selectedDate && selectedSession && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Step 4: Book for Family (Optional)
              </h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Include Family Members</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={includeFamilyMembers}
                    onChange={(e) => {
                      setIncludeFamilyMembers(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedFamilyMembers([]);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
              </label>
            </div>

            {includeFamilyMembers && (
              <div>
                {loadingFamilyMembers ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
                    <p className="text-gray-500">Loading family members...</p>
                  </div>
                ) : familyMembers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">No family members found</p>
                    <p className="text-sm text-gray-500">Add family members in your profile to book appointments for them</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Select family members to book appointments for them in the same session:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {familyMembers.map((member) => {
                        const isSelected = selectedFamilyMembers.includes(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => toggleFamilyMember(member.id)}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all cursor-pointer
                              ${isSelected
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`
                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                ${isSelected ? 'bg-teal-500' : 'bg-gray-200'}
                              `}>
                                {isSelected ? (
                                  <Check className="w-5 h-5 text-white" />
                                ) : (
                                  <User className="w-5 h-5 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {member.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {member.relationship || 'Family Member'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selectedFamilyMembers.length > 0 && (
                      <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <p className="text-sm text-teal-800">
                          ✅ {selectedFamilyMembers.length} family member{selectedFamilyMembers.length !== 1 ? 's' : ''} selected
                          • Total appointments: {1 + selectedFamilyMembers.length}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Reason for Visit - Only show if all selections are made */}
        {selectedDoctor && selectedDate && selectedSession && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step {includeFamilyMembers ? '5' : '4'}: Reason for Visit
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
        {selectedDoctor && selectedDate && selectedSession && reason.trim() && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Summary
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Doctor</p>
                  <p className="font-medium text-gray-900 break-words">{selectedDoctorData?.user?.name || 'Dr. Unknown'}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{selectedDoctorData?.specialty}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Date & Session</p>
                  <p className="font-medium text-gray-900 break-words">
                    {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatSessionText(selectedSession)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 break-words">
                    {getSessionTimeRange(selectedSession)} • Time slot will be assigned automatically
                  </p>
                </div>
              </div>
              {includeFamilyMembers && selectedFamilyMembers.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 mb-1">Family Members ({selectedFamilyMembers.length})</p>
                    <p className="font-medium text-gray-900 break-words">
                      {familyMembers
                        .filter(m => selectedFamilyMembers.includes(m.id))
                        .map(m => m.name)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Reason</p>
                  <p className="font-medium text-gray-900 break-words">{reason}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your token number and exact time slot will be assigned automatically based on the booking order. You&apos;ll receive {1 + selectedFamilyMembers.length} sequential token{1 + selectedFamilyMembers.length !== 1 ? 's' : ''}.
              </p>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isBooking}
              className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking {1 + selectedFamilyMembers.length} Appointment{1 + selectedFamilyMembers.length !== 1 ? 's' : ''}...
                </>
              ) : (
                `Confirm Booking (${1 + selectedFamilyMembers.length} Appointment${1 + selectedFamilyMembers.length !== 1 ? 's' : ''})`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
