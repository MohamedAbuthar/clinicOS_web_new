'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Star, Clock, Loader2, Users, Sun, Moon, Check, X, Info, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Doctor } from '@/lib/api';
import { createMultipleAppointments, getDoctorAppointmentsByDate, getFamilyMembers } from '@/lib/firebase/firestore';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { usePatientDoctors } from '@/lib/hooks/usePatientDoctors';
import { useScheduleOverrides } from '@/lib/hooks/useScheduleOverrides';
import { 
  SessionType, 
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  getSessionSlots,
  getNextTokenForSession, 
  assignSlotByToken,
  getSessionCapacity,
  formatSessionText,
  getSessionTimeRange,
  canBookSession,
  getAvailableSessionsForDate
} from '@/lib/utils/sessionBookingHelper';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  relationship?: string;
}

// Helper function to format date as YYYY-MM-DD without timezone issues
const formatDateForAPI = (date: Date): string => {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
};

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
  
  // Booking confirmation dialog
  const [showBookingConfirmDialog, setShowBookingConfirmDialog] = useState(false);
  const [bookingFor, setBookingFor] = useState<'yourself' | 'family' | 'both' | null>(null);

  // Session capacity
  const [sessionCapacity, setSessionCapacity] = useState<{
    morning: { totalSlots: number; bookedSlots: number; availableSlots: number; };
    evening: { totalSlots: number; bookedSlots: number; availableSlots: number; };
  } | null>(null);

  // Force re-render to update session availability based on current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use the patient doctors hook
  const { doctors, loading: doctorsLoading, error: doctorsError, refreshDoctors } = usePatientDoctors();
  
  // Schedule overrides for checking doctor availability
  const { fetchOverrides, overrides } = useScheduleOverrides();
  
  // Log overrides when they change
  useEffect(() => {
    if (overrides.length > 0 && selectedDoctor) {
      console.log('📅 Schedule overrides loaded for doctor:', selectedDoctor, 'Count:', overrides.length);
      overrides.forEach(override => {
        console.log('  - Override:', {
          date: override.date,
          reason: override.reason,
          startTime: override.startTime,
          endTime: override.endTime,
          type: override.type,
          displayType: (override as any).displayType
        });
      });
    }
  }, [overrides, selectedDoctor]);

  // Handle doctors loading error
  useEffect(() => {
    if (doctorsError) {
      toast.error(`❌ ${doctorsError}`);
    }
  }, [doctorsError]);

  // Update current time every minute to refresh session availability
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  // Load session capacity and schedule overrides when doctor and date are selected
  useEffect(() => {
    const loadSessionCapacity = async () => {
      if (selectedDoctor && selectedDate) {
        try {
          setIsLoading(true);
          
          // Find the selected doctor
          const doctor = doctors.find(d => d.id === selectedDoctor);
          
          if (!doctor) {
            toast.error('❌ Doctor not found');
            setIsLoading(false);
            return;
          }

          // Fetch schedule overrides for this doctor
          await fetchOverrides(selectedDoctor);

          // Get existing appointments for this doctor and date
          const dateStr = formatDateForAPI(selectedDate);
          const result = await getDoctorAppointmentsByDate(selectedDoctor, dateStr);
          const existingAppointments = result.success && result.data ? result.data : [];

          // Get doctor's session config
          const doctorConfig: SessionConfig = {
            morning: {
              startTime: doctor.morningStartTime || '09:00',
              endTime: doctor.morningEndTime || '13:00'
            },
            evening: {
              startTime: doctor.eveningStartTime || '14:00',
              endTime: doctor.eveningEndTime || '18:00'
            }
          };

          // Normalize times to HH:MM format
          const normalizeTime = (time: string | undefined, defaultTime: string): string => {
            if (!time) return defaultTime;
            if (/^\d{2}:\d{2}$/.test(time)) return time;
            if (/^\d{2}:\d{2}:\d{2}/.test(time)) return time.substring(0, 5);
            try {
              const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
              if (match) {
                let hours = parseInt(match[1]);
                const minutes = match[2];
                const meridiem = match[3]?.toUpperCase();
                if (meridiem === 'PM' && hours !== 12) hours += 12;
                if (meridiem === 'AM' && hours === 12) hours = 0;
                return `${hours.toString().padStart(2, '0')}:${minutes}`;
              }
            } catch (e) {
              console.warn('Error parsing time:', time, e);
            }
            return defaultTime;
          };

          const normalizedConfig: SessionConfig = {
            morning: {
              startTime: normalizeTime(doctorConfig.morning.startTime, '09:00'),
              endTime: normalizeTime(doctorConfig.morning.endTime, '13:00')
            },
            evening: {
              startTime: normalizeTime(doctorConfig.evening.startTime, '14:00'),
              endTime: normalizeTime(doctorConfig.evening.endTime, '18:00')
            }
          };

          // Generate slots dynamically based on session times and consultation duration
          // This ensures we get slots even for custom session times (e.g., 23:00-23:59)
          const consultationDuration = doctor.consultationDuration || 20;
          
          // Validate session times are valid (start < end)
          const validateSessionTime = (start: string, end: string): boolean => {
            const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1] || '0');
            const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1] || '0');
            return startMinutes < endMinutes;
          };
          
          // Generate morning session slots
          const { generateTimeSlots } = await import('@/lib/utils/timeSlotGenerator');
          const morningSlots = validateSessionTime(normalizedConfig.morning.startTime, normalizedConfig.morning.endTime)
            ? generateTimeSlots({
                startTime: normalizedConfig.morning.startTime,
                endTime: normalizedConfig.morning.endTime,
                slotDuration: consultationDuration
              }, []) // Empty booked slots array for capacity calculation
            : [];
          
          // Generate evening session slots
          const eveningSlots = validateSessionTime(normalizedConfig.evening.startTime, normalizedConfig.evening.endTime)
            ? generateTimeSlots({
                startTime: normalizedConfig.evening.startTime,
                endTime: normalizedConfig.evening.endTime,
                slotDuration: consultationDuration
              }, []) // Empty booked slots array for capacity calculation
            : [];
          
          // Convert generated slots to 24-hour format for comparison
          const convertTo24Hour = (timeStr: string): string => {
            if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              let hours = parseInt(match[1]);
              const minutes = match[2];
              const period = match[3].toUpperCase();
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
              return `${hours.toString().padStart(2, '0')}:${minutes}`;
            }
            return timeStr;
          };
          
          const morningSlots24 = morningSlots.map(slot => convertTo24Hour(slot.time));
          const eveningSlots24 = eveningSlots.map(slot => convertTo24Hour(slot.time));
          
          // Count booked appointments for each session
          const getSessionFromTime = (timeStr: string): SessionType => {
            const hour = parseInt(timeStr.split(':')[0]);
            const timeMinutes = hour * 60 + parseInt(timeStr.split(':')[1] || '0');
            const morningStart = parseInt(normalizedConfig.morning.startTime.split(':')[0]) * 60 + parseInt(normalizedConfig.morning.startTime.split(':')[1] || '0');
            const morningEnd = parseInt(normalizedConfig.morning.endTime.split(':')[0]) * 60 + parseInt(normalizedConfig.morning.endTime.split(':')[1] || '0');
            const eveningStart = parseInt(normalizedConfig.evening.startTime.split(':')[0]) * 60 + parseInt(normalizedConfig.evening.startTime.split(':')[1] || '0');
            const eveningEnd = parseInt(normalizedConfig.evening.endTime.split(':')[0]) * 60 + parseInt(normalizedConfig.evening.endTime.split(':')[1] || '0');
            
            if (timeMinutes >= morningStart && timeMinutes < morningEnd) return 'morning';
            if (timeMinutes >= eveningStart && timeMinutes < eveningEnd) return 'evening';
            return hour < 14 ? 'morning' : 'evening';
          };
          
          const morningBooked = existingAppointments.filter((apt: any) => {
            if (apt.appointmentDate !== dateStr) return false;
            const aptTime = apt.appointmentTime || '';
            const aptTime24 = convertTo24Hour(aptTime);
            return getSessionFromTime(aptTime24) === 'morning';
          }).length;
          
          const eveningBooked = existingAppointments.filter((apt: any) => {
            if (apt.appointmentDate !== dateStr) return false;
            const aptTime = apt.appointmentTime || '';
            const aptTime24 = convertTo24Hour(aptTime);
            return getSessionFromTime(aptTime24) === 'evening';
          }).length;

          // Calculate capacity based on generated slots
          const morningCap = {
            totalSlots: morningSlots24.length,
            bookedSlots: morningBooked,
            availableSlots: Math.max(0, morningSlots24.length - morningBooked)
          };

          const eveningCap = {
            totalSlots: eveningSlots24.length,
            bookedSlots: eveningBooked,
            availableSlots: Math.max(0, eveningSlots24.length - eveningBooked)
          };

          setSessionCapacity({
            morning: morningCap,
            evening: eveningCap
          });

        } catch (error: any) {
          console.error('Error loading session capacity:', error);
          toast.error(`❌ ${error.message || 'Failed to load session information'}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSessionCapacity(null);
      }
    };

    loadSessionCapacity();
  }, [selectedDoctor, selectedDate, doctors, fetchOverrides]);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  // Helper function to create SessionConfig from doctor data
  const getDoctorSessionConfig = (doctor: typeof selectedDoctorData): SessionConfig => {
    if (!doctor) return DEFAULT_SESSION_CONFIG;
    
    // Helper to convert time to 24-hour format (HH:MM)
    const normalizeTime = (time: string | undefined, defaultTime: string): string => {
      if (!time) return defaultTime;
      // If time is already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(time)) return time;
      // If time is in HH:MM:SS format, extract HH:MM
      if (/^\d{2}:\d{2}:\d{2}/.test(time)) return time.substring(0, 5);
      // Try to parse and convert other formats
      try {
        const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = match[2];
          const meridiem = match[3]?.toUpperCase();
          if (meridiem === 'PM' && hours !== 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      } catch (e) {
        console.warn('Error parsing time:', time, e);
      }
      return defaultTime;
    };

    return {
      morning: {
        startTime: normalizeTime(doctor.morningStartTime, '09:00'),
        endTime: normalizeTime(doctor.morningEndTime, '13:00')
      },
      evening: {
        startTime: normalizeTime(doctor.eveningStartTime, '14:00'),
        endTime: normalizeTime(doctor.eveningEndTime, '18:00')
      }
    };
  };

  // Get session config for selected doctor
  const doctorSessionConfig = getDoctorSessionConfig(selectedDoctorData);

  const toggleFamilyMember = (memberId: string) => {
    setSelectedFamilyMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedDoctorData || !selectedSession || !selectedDate || !reason.trim() || !patient?.id) {
      toast.error('❌ Please fill in all required fields');
      return;
    }

    // Check if doctor is on leave for this date and session
    const leaveCheck = isDoctorOnLeave(selectedDate, selectedSession);
    if (leaveCheck.onLeave) {
      toast.error(`❌ ${leaveCheck.reason || 'Doctor is on leave for this session'}`);
      return;
    }

    // Check if session can be booked (must be at least 3 hours before session starts)
    const sessionTimeCheck = canBookSessionByTime(selectedDate, selectedSession);
    if (!sessionTimeCheck.canBook) {
      toast.error(`❌ ${sessionTimeCheck.reason || 'Session can only be booked at least 3 hours before it starts'}`);
      return;
    }

    // Validate session booking rules
    const sessionCheck = canBookSession(selectedDate, selectedSession);
    if (!sessionCheck.canBook) {
      toast.error(`❌ ${sessionCheck.reason || 'Cannot book this session'}`);
      return;
    }

    // If family members are selected, show confirmation dialog
    if (selectedFamilyMembers.length > 0) {
      setShowBookingConfirmDialog(true);
      return;
    }

    // If no family members, proceed with booking for yourself
    processBooking('yourself');
  };

  const processBooking = async (bookingType: 'yourself' | 'family' | 'both') => {
    if (!selectedDoctorData || !selectedSession || !selectedDate || !reason.trim() || !patient?.id) {
      return;
    }

    // Check session capacity based on booking type
    if (sessionCapacity) {
      const capacity = sessionCapacity[selectedSession];
      const totalBookings = bookingType === 'both' ? 2 : 1;
      
      if (capacity.availableSlots < totalBookings) {
        toast.error(`❌ Not enough slots available in this session. Available: ${capacity.availableSlots}, Requested: ${totalBookings}`);
        return;
      }
    }

    try {
      setIsBooking(true);
      setShowBookingConfirmDialog(false);
      
      const dateStr = formatDateForAPI(selectedDate);
      
      // Get existing appointments for token generation
      const result = await getDoctorAppointmentsByDate(selectedDoctor!, dateStr);
      const existingAppointments = result.success && result.data ? result.data : [];
      
      // Get booked slots for this session (convert to 24-hour format for comparison)
      const bookedSlots = existingAppointments
        .filter((apt: any) => {
          // Filter appointments for the same date and session
          if (apt.appointmentDate !== dateStr) return false;
          
          // Determine session from appointment time
          const aptTime = apt.appointmentTime || '';
          const aptTime24 = aptTime.includes(':') ? aptTime : '';
          if (!aptTime24) return false;
          
          const hour = parseInt(aptTime24.split(':')[0]);
          const aptSession = hour < 13 ? 'morning' : 'evening';
          
          return aptSession === selectedSession;
        })
        .map((apt: any) => apt.appointmentTime);
      
      // Prepare appointments data based on booking type
      const appointmentsToCreate = [];
      
      // Determine which appointments to create
      const shouldBookYourself = bookingType === 'yourself' || bookingType === 'both';
      const shouldBookFamily = bookingType === 'family' || bookingType === 'both';
      
      // Book for yourself - use dynamic slot assignment based on slot duration
      if (shouldBookYourself) {
        const { getNextAvailableSlot } = await import('@/lib/utils/slotAssignmentHelper');
        
        const patientToken = getNextTokenForSession(existingAppointments, selectedSession, dateStr);
        const patientSlot = getNextAvailableSlot(
          selectedDoctorData,
          dateStr,
          selectedSession,
          bookedSlots
        );
        
        if (!patientSlot) {
          toast.error('❌ No available slots for the selected session');
          setIsBooking(false);
          return;
        }

        appointmentsToCreate.push({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          doctorId: selectedDoctor!,
          appointmentDate: dateStr,
          appointmentTime: patientSlot, // This will be in 24-hour format (HH:MM)
          session: selectedSession,
          duration: selectedDoctorData.consultationDuration || 20,
          status: 'scheduled',
          source: 'web',
          notes: reason.trim(),
          tokenNumber: patientToken
        });

        bookedSlots.push(patientSlot);
      }
      
      // Book for family member - use dynamic slot assignment
      if (shouldBookFamily && selectedFamilyMembers.length > 0) {
        const memberId = selectedFamilyMembers[0]; // Book for first selected family member
        const member = familyMembers.find(m => m.id === memberId);
        
        if (member) {
          const { getNextAvailableSlot } = await import('@/lib/utils/slotAssignmentHelper');
          
          const memberToken = getNextTokenForSession(
            [...existingAppointments, ...appointmentsToCreate],
            selectedSession,
            dateStr
          );
          const memberSlot = getNextAvailableSlot(
            selectedDoctorData,
            dateStr,
            selectedSession,
            bookedSlots
          );
          
          if (!memberSlot) {
            toast.error('❌ Not enough slots available for the family member');
            setIsBooking(false);
            return;
          }

          appointmentsToCreate.push({
            patientId: memberId,
            patientName: member.name,
            patientPhone: patient.phone,
            doctorId: selectedDoctor!,
            appointmentDate: dateStr,
            appointmentTime: memberSlot, // This will be in 24-hour format (HH:MM)
            session: selectedSession,
            duration: selectedDoctorData.consultationDuration || 20,
            status: 'scheduled',
            source: 'web',
            notes: `Booked by ${patient.name}. ${reason.trim()}`,
            tokenNumber: memberToken,
            bookedBy: patient.id
          });

          bookedSlots.push(memberSlot);
        }
      }
      
      console.log(`📝 Booking ${appointmentsToCreate.length} appointment(s):`, appointmentsToCreate.map(a => `${a.patientName} - Token ${a.tokenNumber} - ${a.appointmentTime}`));
      console.log('📋 Appointment details for queue:', {
        doctorId: selectedDoctor!,
        appointmentDate: dateStr,
        appointments: appointmentsToCreate.map(apt => ({
          patientName: apt.patientName,
          tokenNumber: apt.tokenNumber,
          appointmentTime: apt.appointmentTime,
          status: apt.status
        }))
      });
      
      // Create all appointments
      const bookingResult = await createMultipleAppointments(appointmentsToCreate);
      
      if (bookingResult.success) {
        const summary = appointmentsToCreate.map(apt => 
          `${apt.patientName}: Token ${apt.tokenNumber} at ${apt.appointmentTime}`
        ).join(', ');
        
        console.log('✅ Booking successful! Appointments created:', bookingResult.data);
        console.log('📌 These appointments should now appear in the queue for:', {
          doctorId: selectedDoctor!,
          appointmentDate: dateStr,
          today: new Date().toISOString().split('T')[0]
        });
        
        toast.success(`✅ Appointment${appointmentsToCreate.length > 1 ? 's' : ''} booked successfully! ${summary}`, {
          duration: 5000
        });
        
        // Small delay to ensure Firestore has processed the write
        await new Promise(resolve => setTimeout(resolve, 500));
        
        router.push('/Patient/myappoinment');
      } else {
        toast.error(`❌ ${bookingResult.error || 'Failed to book appointment'}`);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(`❌ ${error.message || 'Failed to book appointment'}`);
    } finally {
      setIsBooking(false);
    }
  };

  // Helper function to check if session can be booked (must be at least 3 hours before session starts, until session ends)
  const canBookSessionByTime = (date: Date, session: SessionType): { canBook: boolean; reason?: string; showMessage?: boolean } => {
    if (!selectedDoctorData) {
      return { canBook: true }; // If no doctor selected, allow (will be caught by other validation)
    }

    // Use currentTime state to ensure real-time updates
    const now = currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Get session start and end time from doctor's config
    const sessionStartTime = doctorSessionConfig[session].startTime;
    const sessionEndTime = doctorSessionConfig[session].endTime;
    const [startHours, startMinutes] = sessionStartTime.split(':').map(Number);
    const [endHours, endMinutes] = sessionEndTime.split(':').map(Number);
    const sessionStartMinutes = startHours * 60 + startMinutes;
    const sessionEndMinutes = endHours * 60 + endMinutes;
    
    // Calculate days difference between selected date and today
    const daysDiff = Math.floor((selectedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // For past dates, don't allow booking
    if (daysDiff < 0) {
      return {
        canBook: false,
        reason: 'Cannot book appointments for past dates',
        showMessage: false
      };
    }
    
    const hoursBeforeBooking = 3; // Must book at least 3 hours before session starts
    const hoursBeforeBookingMinutes = hoursBeforeBooking * 60; // 3 hours = 180 minutes
    const bookingCutoffMinutes = sessionStartMinutes - hoursBeforeBookingMinutes;
    
    // Format time for display (12-hour format)
    const formatTime12Hour = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const cutoffHour = hours % 24;
      const cutoffMinute = mins;
      
      if (cutoffHour > 12) return `${cutoffHour - 12}:${String(cutoffMinute).padStart(2, '0')} PM`;
      if (cutoffHour === 12) return `12:${String(cutoffMinute).padStart(2, '0')} PM`;
      if (cutoffHour === 0) return `12:${String(cutoffMinute).padStart(2, '0')} AM`;
      return `${cutoffHour}:${String(cutoffMinute).padStart(2, '0')} AM`;
    };
    
    const sessionName = session === 'morning' ? 'Morning' : 'Evening';
    const selectedDateStr = selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const cutoffTime12Hour = formatTime12Hour(bookingCutoffMinutes);
    
    if (daysDiff === 0) {
      // Selected date is TODAY - check current time against today's session
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      // Check if current time is before the cutoff time (booking window hasn't opened yet)
      if (currentTimeInMinutes < bookingCutoffMinutes) {
        return {
          canBook: false,
          reason: `⏰ Booking opens at ${cutoffTime12Hour} (3 hours before ${sessionName.toLowerCase()} session starts)`,
          showMessage: true
        };
      }
      
      // Check if session has already ended (after session end time)
      if (currentTimeInMinutes >= sessionEndMinutes) {
        return {
          canBook: false,
          reason: `❌ ${sessionName} session has already ended`,
          showMessage: true
        };
      }
      
      // Booking is allowed (between cutoff time and session end time)
      return { canBook: true, showMessage: false };
    } else {
      // Selected date is in the FUTURE (tomorrow or later)
      // Calculate the cutoff time on the selected date
      const cutoffDateTime = new Date(selectedDay);
      cutoffDateTime.setHours(Math.floor(bookingCutoffMinutes / 60), bookingCutoffMinutes % 60, 0, 0);
      
      // Check if current date/time is before the cutoff time on the selected date
      if (now < cutoffDateTime) {
        // Booking hasn't opened yet - show message about when it opens
        return {
          canBook: false,
          reason: `⏰ Booking opens at ${cutoffTime12Hour} on ${selectedDateStr} (3 hours before ${sessionName.toLowerCase()} session starts)`,
          showMessage: true
        };
      }
      
      // For future dates, booking is allowed once the booking window opens
      // (3 hours before session starts) until the session ends on that day
      // We don't need to check if session has ended for future dates since we're not past that day yet
      return { canBook: true, showMessage: false };
    }
  };

  // Helper function to check if doctor is on leave for a specific date and session
  const isDoctorOnLeave = (date: Date, session: SessionType): { onLeave: boolean; reason?: string } => {
    if (!selectedDoctor || !overrides.length) {
      return { onLeave: false };
    }

    const dateStr = formatDateForAPI(date);
    
    // Check for schedule overrides on this date
    // Check both type === 'holiday' and displayType for holiday/special-event
    const dateOverrides = overrides.filter(override => {
      const overrideDate = override.date.includes('T') 
        ? override.date.split('T')[0] 
        : override.date; // Handle both ISO format and YYYY-MM-DD format
      
      // Normalize dates for comparison
      const normalizedOverrideDate = overrideDate.substring(0, 10); // Ensure YYYY-MM-DD format
      const normalizedSelectedDate = dateStr.substring(0, 10);
      
      // Check if it's a holiday (either by type or displayType)
      // Include special-event as it's used for holidays/leaves
      const isHoliday = override.type === 'holiday' || 
                       (override as any).displayType === 'holiday' ||
                       (override as any).displayType === 'special-event';
      
      const matches = normalizedOverrideDate === normalizedSelectedDate && isHoliday;
      
      if (matches) {
        console.log(`🔍 Found override for date ${normalizedSelectedDate}:`, {
          reason: override.reason,
          startTime: override.startTime,
          endTime: override.endTime,
          type: override.type,
          displayType: (override as any).displayType
        });
      }
      
      return matches;
    });

    if (dateOverrides.length === 0) {
      return { onLeave: false };
    }

    // Check if any override affects this session
    for (const override of dateOverrides) {
      // If no startTime/endTime, it's a full day leave (affects both sessions)
      if (!override.startTime || !override.endTime) {
        console.log(`🚫 Full day leave detected for ${session} session`);
        return { 
          onLeave: true, 
          reason: `Doctor is on leave: ${override.reason}` 
        };
      }

      // Check if this session is affected by the override time range
      // Morning session: 09:00-12:00, Evening session: 14:00-18:00
      const overrideStartHour = parseInt(override.startTime.split(':')[0]);
      const overrideEndHour = parseInt(override.endTime.split(':')[0]);
      
      console.log(`🔍 Checking ${session} session against override:`, {
        session,
        overrideStartHour,
        overrideEndHour,
        reason: override.reason
      });
      
      if (session === 'morning') {
        // Morning session is 09:00-12:00
        // Override affects morning if it starts at 09:00 and ends at 12:00
        if (overrideStartHour === 9 && overrideEndHour === 12) {
          console.log(`🚫 Morning session leave detected`);
          return { 
            onLeave: true, 
            reason: `Doctor is on leave: ${override.reason}` 
          };
        }
      } else if (session === 'evening') {
        // Evening session is 14:00-18:00
        // Override affects evening if it starts at 14:00 and ends at 18:00
        if (overrideStartHour === 14 && overrideEndHour === 18) {
          console.log(`🚫 Evening session leave detected`);
          return { 
            onLeave: true, 
            reason: `Doctor is on leave: ${override.reason}` 
          };
        }
      }
    }

    return { onLeave: false };
  };

  const SessionCard = ({ session }: { session: SessionType }) => {
    if (!sessionCapacity || !selectedDate) return null;
    
    const capacity = sessionCapacity[session];
    const icon = session === 'morning' ? Sun : Moon;
    const Icon = icon;
    const isSelected = selectedSession === session;
    const sessionCheck = selectedDate ? canBookSession(selectedDate, session, doctorSessionConfig) : { canBook: false };
    const leaveCheck = isDoctorOnLeave(selectedDate, session);
    
    // Check if session can be booked (must be at least 3 hours before session starts)
    const sessionTimeCheck = canBookSessionByTime(selectedDate, session);
    
    const isDisabled = !sessionCheck.canBook || 
                       capacity.availableSlots === 0 || 
                       leaveCheck.onLeave || 
                       !sessionTimeCheck.canBook;
    
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
              {getSessionTimeRange(session, doctorSessionConfig)}
            </p>
            <div className={`text-xs ${isDisabled ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-500'}`}>
              {capacity.availableSlots} / {capacity.totalSlots} slots available
            </div>
            {leaveCheck.onLeave && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-semibold text-center">
                  ⚠️ {leaveCheck.reason}
                </p>
              </div>
            )}
            {sessionTimeCheck.showMessage && !leaveCheck.onLeave && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700 font-semibold text-center">
                  {sessionTimeCheck.reason}
                </p>
              </div>
            )}
            {!sessionCheck.canBook && !leaveCheck.onLeave && sessionTimeCheck.canBook && (
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
            {/* <div className="flex items-center gap-4">
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
            </div> */}
          </div>
        </div>

        {/* Error Message */}

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
            {/* <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
            </div> */}

            {/* Session Cards */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
                <p className="text-gray-500">Loading session information...</p>
              </div>
            ) : selectedDoctorData ? (
              (() => {
                // Helper to normalize time to minutes for comparison
                const timeToMinutes = (timeStr: string | undefined): number => {
                  if (!timeStr) return 0;
                  
                  // Handle 24-hour format (HH:MM)
                  if (/^\d{2}:\d{2}$/.test(timeStr)) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                  }
                  
                  // Handle 12-hour format with AM/PM
                  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                  if (match) {
                    let hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const period = match[3].toUpperCase();
                    
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    
                    return hours * 60 + minutes;
                  }
                  
                  // Try to parse as HH:MM:SS format
                  const parts = timeStr.split(':');
                  if (parts.length >= 2) {
                    const hours = parseInt(parts[0]) || 0;
                    const minutes = parseInt(parts[1]) || 0;
                    return hours * 60 + minutes;
                  }
                  
                  return 0;
                };
                
                // Check which sessions the doctor has configured
                // A session is valid if it has startTime and endTime configured and start < end
                const hasMorningSession = () => {
                  const morningStart = selectedDoctorData.morningStartTime;
                  const morningEnd = selectedDoctorData.morningEndTime;
                  if (!morningStart || !morningEnd) return false;
                  
                  const startMinutes = timeToMinutes(morningStart);
                  const endMinutes = timeToMinutes(morningEnd);
                  return startMinutes > 0 && endMinutes > 0 && startMinutes < endMinutes;
                };
                
                const hasEveningSession = () => {
                  const eveningStart = selectedDoctorData.eveningStartTime;
                  const eveningEnd = selectedDoctorData.eveningEndTime;
                  if (!eveningStart || !eveningEnd) return false;
                  
                  const startMinutes = timeToMinutes(eveningStart);
                  const endMinutes = timeToMinutes(eveningEnd);
                  return startMinutes > 0 && endMinutes > 0 && startMinutes < endMinutes;
                };
                
                // Build list of sessions to show based on doctor's configuration
                const sessionsToShow: SessionType[] = [];
                
                // Debug logging
                console.log('🔍 Session Detection Debug:', {
                  doctor: selectedDoctorData.user?.name,
                  morningStart: selectedDoctorData.morningStartTime,
                  morningEnd: selectedDoctorData.morningEndTime,
                  eveningStart: selectedDoctorData.eveningStartTime,
                  eveningEnd: selectedDoctorData.eveningEndTime,
                  hasMorning: hasMorningSession(),
                  hasEvening: hasEveningSession(),
                  doctorSessionConfig,
                  selectedDate: selectedDate?.toISOString()
                });
                
                // Always show sessions for future dates (even if booking isn't open yet)
                // The SessionCard component will handle showing the appropriate message and disabled state
                if (hasMorningSession()) {
                  // Check basic session availability (not time-based restrictions)
                  const morningCheck = canBookSession(selectedDate, 'morning', doctorSessionConfig);
                  console.log('🌅 Morning session check:', morningCheck);
                  // Always add session if it exists and date is valid - let SessionCard handle the 3-hour restriction
                  if (morningCheck.canBook) {
                    sessionsToShow.push('morning');
                  }
                }
                
                if (hasEveningSession()) {
                  // Check basic session availability (not time-based restrictions)
                  const eveningCheck = canBookSession(selectedDate, 'evening', doctorSessionConfig);
                  console.log('🌆 Evening session check:', eveningCheck);
                  // Always add session if it exists and date is valid - let SessionCard handle the 3-hour restriction
                  if (eveningCheck.canBook) {
                    sessionsToShow.push('evening');
                  }
                }
                
                console.log('✅ Sessions to show:', sessionsToShow);
                
                if (sessionsToShow.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg font-medium mb-2">No sessions available for this date</p>
                      <p className="text-sm">Please select a different date</p>
                    </div>
                  );
                }
                
                return (
                  <div className={`grid gap-6 ${sessionsToShow.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {sessionsToShow.map(session => (
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
                    {getSessionTimeRange(selectedSession, doctorSessionConfig)} • Time slot will be assigned automatically
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
                <strong>Note:</strong> Your token number and exact time slot will be assigned automatically based on the booking order.
                {selectedFamilyMembers.length > 0 && (
                  <span> If booking for both, you&apos;ll receive separate tokens.</span>
                )}
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
                  Booking Appointment...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        )}

        {/* Booking Confirmation Dialog */}
        {showBookingConfirmDialog && selectedFamilyMembers.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowBookingConfirmDialog(false)}
            />
            
            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Confirm Booking</h2>
                <button
                  onClick={() => setShowBookingConfirmDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">You have selected a family member.</p>
                      <p>Please choose who this appointment is for:</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Option 1: Yourself */}
                  <button
                    onClick={() => {
                      setBookingFor('yourself');
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      bookingFor === 'yourself'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        bookingFor === 'yourself'
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-gray-300'
                      }`}>
                        {bookingFor === 'yourself' && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Book for Yourself</h3>
                        <p className="text-sm text-gray-600">Book appointment for {patient?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">1 appointment • 1 token</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Family Member */}
                  <button
                    onClick={() => {
                      setBookingFor('family');
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      bookingFor === 'family'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        bookingFor === 'family'
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-gray-300'
                      }`}>
                        {bookingFor === 'family' && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Book for {familyMembers.find(m => selectedFamilyMembers.includes(m.id))?.name || 'Family Member'}
                        </h3>
                        <p className="text-sm text-gray-600">Book appointment for the selected family member</p>
                        <p className="text-xs text-gray-500 mt-1">1 appointment • 1 token</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Both */}
                  <button
                    onClick={() => {
                      setBookingFor('both');
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      bookingFor === 'both'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        bookingFor === 'both'
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-gray-300'
                      }`}>
                        {bookingFor === 'both' && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Book for Both</h3>
                        <p className="text-sm text-gray-600">
                          Book appointments for {patient?.name} and {familyMembers.find(m => selectedFamilyMembers.includes(m.id))?.name || 'family member'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">2 appointments • 2 separate tokens</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingConfirmDialog(false);
                      setBookingFor(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (bookingFor) {
                        processBooking(bookingFor);
                      } else {
                        toast.error('❌ Please select who this appointment is for');
                      }
                    }}
                    disabled={!bookingFor || isBooking}
                    className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm & Book'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
