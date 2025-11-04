"use client"

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useScheduleOverrides } from '@/lib/hooks/useScheduleOverrides';

interface Doctor {
  id: string;
  user?: {
    name: string;
  };
  specialty: string;
  morningTime?: string;
  eveningTime?: string;
  morningStartTime?: string;
  morningEndTime?: string;
  eveningStartTime?: string;
  eveningEndTime?: string;
  availableSlots?: string[];
  startTime?: string;
  endTime?: string;
  consultationDuration?: number;
}

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  doctors: Doctor[];
  onAppointmentCreated?: () => void;
}

export default function NewAppointmentDialog({
  isOpen,
  onCloseAction,
  doctors,
  onAppointmentCreated
}: NewAppointmentDialogProps) {
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '+91 ',
    email: '',
    doctor: '',
    date: '',
    session: '',
    reason: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [emailErrorShown, setEmailErrorShown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [sessionTime, setSessionTime] = useState('');
  
  // Force re-render to update session availability based on current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Schedule overrides for checking doctor availability
  const { fetchOverrides, overrides } = useScheduleOverrides();

  // Update current time every minute to refresh session availability
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update selected doctor when doctor changes
  useEffect(() => {
    if (formData.doctor) {
      const doctor = doctors.find(d => d.id === formData.doctor);
      if (doctor) {
        setSelectedDoctor(doctor);
        // Fetch schedule overrides for this doctor
        fetchOverrides(formData.doctor);
      }
    } else {
      setSelectedDoctor(null);
      setSessionTime('');
    }
  }, [formData.doctor, doctors, fetchOverrides]);

  // Helper function to format time for display (converts 24h to 12h format)
  const formatTimeForDisplay = (time24: string | undefined, defaultTime: string): string => {
    if (!time24) return defaultTime;
    // If time is already in HH:MM format, convert to 12h
    if (/^\d{2}:\d{2}$/.test(time24)) {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    // If it's already in display format, return as is
    return time24;
  };

  // Helper function to normalize time to 24-hour format (HH:MM)
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

  // Update session time display when session changes
  useEffect(() => {
    if (selectedDoctor && formData.session) {
      const session = formData.session as 'morning' | 'evening';
      if (session === 'morning') {
        const startTime = selectedDoctor.morningStartTime 
          ? formatTimeForDisplay(selectedDoctor.morningStartTime, '9:00 AM')
          : (selectedDoctor.morningTime ? selectedDoctor.morningTime.split(' - ')[0] : '9:00 AM');
        const endTime = selectedDoctor.morningEndTime
          ? formatTimeForDisplay(selectedDoctor.morningEndTime, '1:00 PM')
          : (selectedDoctor.morningTime ? selectedDoctor.morningTime.split(' - ')[1] : '1:00 PM');
        setSessionTime(`${startTime} - ${endTime}`);
      } else {
        const startTime = selectedDoctor.eveningStartTime
          ? formatTimeForDisplay(selectedDoctor.eveningStartTime, '2:00 PM')
          : (selectedDoctor.eveningTime ? selectedDoctor.eveningTime.split(' - ')[0] : '2:00 PM');
        const endTime = selectedDoctor.eveningEndTime
          ? formatTimeForDisplay(selectedDoctor.eveningEndTime, '6:00 PM')
          : (selectedDoctor.eveningTime ? selectedDoctor.eveningTime.split(' - ')[1] : '6:00 PM');
        setSessionTime(`${startTime} - ${endTime}`);
      }
    } else {
      setSessionTime('');
    }
  }, [formData.session, selectedDoctor]);

  // Helper function to format date as YYYY-MM-DD
  const formatDateForAPI = (dateString: string): string => {
    const date = new Date(dateString);
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  };

  // Helper function to check if doctor is on leave for a specific date and session
  const isDoctorOnLeave = (date: string, session: 'morning' | 'evening'): { onLeave: boolean; reason?: string } => {
    if (!formData.doctor || !overrides.length || !date) {
      return { onLeave: false };
    }

    const dateStr = formatDateForAPI(date);
    
    // Check for schedule overrides on this date
    const dateOverrides = overrides.filter(override => {
      const overrideDate = override.date.includes('T') 
        ? override.date.split('T')[0] 
        : override.date;
      
      const normalizedOverrideDate = overrideDate.substring(0, 10);
      const normalizedSelectedDate = dateStr.substring(0, 10);
      
      // Check if it's a holiday (either by type or displayType)
      const isHoliday = override.type === 'holiday' || 
                       (override as any).displayType === 'holiday' ||
                       (override as any).displayType === 'special-event';
      
      return normalizedOverrideDate === normalizedSelectedDate && isHoliday;
    });

    if (dateOverrides.length === 0) {
      return { onLeave: false };
    }

    // Check if any override affects this session
    for (const override of dateOverrides) {
      // If no startTime/endTime, it's a full day leave (affects both sessions)
      if (!override.startTime || !override.endTime) {
        return { 
          onLeave: true, 
          reason: `Doctor is on leave: ${override.reason}` 
        };
      }

      // Check if this session is affected by the override time range
      // Morning session: 09:00-12:00, Evening session: 14:00-18:00
      const overrideStartHour = parseInt(override.startTime.split(':')[0]);
      const overrideEndHour = parseInt(override.endTime.split(':')[0]);
      
      if (session === 'morning') {
        // Morning session is 09:00-12:00
        if (overrideStartHour === 9 && overrideEndHour === 12) {
          return { 
            onLeave: true, 
            reason: `Doctor is on leave: ${override.reason}` 
          };
        }
      } else if (session === 'evening') {
        // Evening session is 14:00-18:00
        if (overrideStartHour === 14 && overrideEndHour === 18) {
          return { 
            onLeave: true, 
            reason: `Doctor is on leave: ${override.reason}` 
          };
        }
      }
    }

    return { onLeave: false };
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      patientName: '',
      phone: '+91 ',
      email: '',
      doctor: '',
      date: '',
      session: '',
      reason: ''
    });
    setEmailErrorShown(false);
    setSelectedDoctor(null);
    setSessionTime('');
  };

  // Early return after all hooks
  if (!isOpen) return null;

  // Check if session should be available based on selected date and current time
  const isSessionAvailable = (session: 'morning' | 'evening') => {
    if (!formData.date) return true; // If no date selected, show all options
    
    // Check if doctor is on leave first
    const leaveCheck = isDoctorOnLeave(formData.date, session);
    if (leaveCheck.onLeave) {
      return false;
    }
    
    if (!selectedDoctor) return true; // If no doctor selected, allow (will be caught by validation)
    
    // Use currentTime state to ensure real-time updates
    const now = currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(formData.date);
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Get session start time from doctor's config
    const sessionStartTime = session === 'morning' 
      ? normalizeTime(selectedDoctor.morningStartTime, '09:00')
      : normalizeTime(selectedDoctor.eveningStartTime, '14:00');
    
    // Parse session start time
    const [startHours, startMinutes] = sessionStartTime.split(':').map(Number);
    const sessionStartMinutes = startHours * 60 + startMinutes;
    
    // Calculate days difference between selected date and today
    const daysDiff = Math.floor((selectedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // For past dates, don't allow any bookings
    if (daysDiff < 0) {
      return false;
    }
    
    const hoursBeforeBooking = 3; // Must book at least 3 hours before session starts
    const hoursBeforeBookingMinutes = hoursBeforeBooking * 60; // 3 hours = 180 minutes
    const bookingCutoffMinutes = sessionStartMinutes - hoursBeforeBookingMinutes;
    
    if (daysDiff === 0) {
      // Selected date is TODAY - check current time against today's session
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      // Check if current time is before the cutoff time (booking window hasn't opened yet)
      if (currentTimeInMinutes < bookingCutoffMinutes) {
        return false; // Session is disabled
      }
      
      // Check if session has already started (after session start time)
      if (currentTimeInMinutes >= sessionStartMinutes) {
        return false; // Session has started
      }
      
      // Booking is allowed (between cutoff time and session start time)
      return true;
    } else {
      // Selected date is in the FUTURE (tomorrow or later)
      // Calculate the cutoff time on the selected date
      const cutoffDateTime = new Date(selectedDay);
      cutoffDateTime.setHours(Math.floor(bookingCutoffMinutes / 60), bookingCutoffMinutes % 60, 0, 0);
      
      // Check if current date/time is before the cutoff time on the selected date
      if (now < cutoffDateTime) {
        // Booking hasn't opened yet - session is disabled
        return false;
      }
      
      // Check if session has already started on the selected date
      const sessionDateTime = new Date(selectedDay);
      sessionDateTime.setHours(startHours, startMinutes, 0, 0);
      
      if (now >= sessionDateTime) {
        // Session has started or passed - don't allow booking
        return false;
      }
      
      // Current time is after the cutoff time on the selected date, booking is allowed
      return true;
    }
  };

  // Get helper text for disabled sessions
  const getSessionHelperText = () => {
    if (!formData.date || !selectedDoctor) return null;
    
    const now = currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(formData.date);
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Calculate days difference
    const daysDiff = Math.floor((selectedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only show helper text for today and future dates
    if (daysDiff < 0) {
      return null;
    }
    
    // Get morning session start time
    const morningStartTime = normalizeTime(selectedDoctor.morningStartTime, '09:00');
    const [morningStartHours, morningStartMinutes] = morningStartTime.split(':').map(Number);
    const morningStartMinutesTotal = morningStartHours * 60 + morningStartMinutes;
    const morningCutoffMinutes = morningStartMinutesTotal - (3 * 60);
    
    // Get evening session start time
    const eveningStartTime = normalizeTime(selectedDoctor.eveningStartTime, '14:00');
    const [eveningStartHours, eveningStartMinutes] = eveningStartTime.split(':').map(Number);
    const eveningStartMinutesTotal = eveningStartHours * 60 + eveningStartMinutes;
    const eveningCutoffMinutes = eveningStartMinutesTotal - (3 * 60);
    
    // Format cutoff time for display (12-hour format)
    const formatCutoffTime = (minutes: number): string => {
      const hour = minutes % (24 * 60); // Handle hours > 24
      const cutoffHour = Math.floor(hour / 60);
      const cutoffMinute = hour % 60;
      
      const period = cutoffHour >= 12 ? 'PM' : 'AM';
      const displayHour = cutoffHour > 12 ? cutoffHour - 12 : cutoffHour === 0 ? 12 : cutoffHour;
      return `${displayHour}:${String(cutoffMinute).padStart(2, '0')} ${period}`;
    };
    
    const selectedDateStr = selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const morningCutoffDisplay = formatCutoffTime(morningCutoffMinutes);
    const eveningCutoffDisplay = formatCutoffTime(eveningCutoffMinutes);
    
    // Check availability for both sessions
    let morningAvailable = false;
    let eveningAvailable = false;
    
    if (daysDiff === 0) {
      // Today's date
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      morningAvailable = currentTimeInMinutes >= morningCutoffMinutes && currentTimeInMinutes < morningStartMinutesTotal;
      eveningAvailable = currentTimeInMinutes >= eveningCutoffMinutes && currentTimeInMinutes < eveningStartMinutesTotal;
    } else {
      // Future date (tomorrow or later)
      const morningCutoffDateTime = new Date(selectedDay);
      morningCutoffDateTime.setHours(Math.floor(morningCutoffMinutes / 60), morningCutoffMinutes % 60, 0, 0);
      
      const eveningCutoffDateTime = new Date(selectedDay);
      eveningCutoffDateTime.setHours(Math.floor(eveningCutoffMinutes / 60), eveningCutoffMinutes % 60, 0, 0);
      
      morningAvailable = now >= morningCutoffDateTime;
      eveningAvailable = now >= eveningCutoffDateTime;
    }
    
    // Generate helper text based on availability
    if (!morningAvailable && !eveningAvailable) {
      if (daysDiff === 0) {
        return `Both sessions are closed. Booking opens at ${morningCutoffDisplay} for morning and ${eveningCutoffDisplay} for evening (3 hours before session starts)`;
      } else {
        return `Both sessions are closed. Booking opens at ${morningCutoffDisplay} on ${selectedDateStr} for morning and ${eveningCutoffDisplay} for evening (3 hours before session starts)`;
      }
    } else if (!morningAvailable && eveningAvailable) {
      if (daysDiff === 0) {
        return `Morning session closed. Booking opens at ${morningCutoffDisplay} (3 hours before session starts). Evening session available.`;
      } else {
        return `Morning session closed. Booking opens at ${morningCutoffDisplay} on ${selectedDateStr} (3 hours before session starts). Evening session available.`;
      }
    } else if (morningAvailable && !eveningAvailable) {
      if (daysDiff === 0) {
        return `Evening session closed. Booking opens at ${eveningCutoffDisplay} (3 hours before session starts). Morning session available.`;
      } else {
        return `Evening session closed. Booking opens at ${eveningCutoffDisplay} on ${selectedDateStr} (3 hours before session starts). Morning session available.`;
      }
    }
    
    return null;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If date changes, reset session if it's no longer available
    if (name === 'date' && formData.session) {
      const sessionStillAvailable = isSessionAvailable(formData.session as 'morning' | 'evening');
      if (!sessionStillAvailable) {
        setFormData(prev => ({ ...prev, [name]: value, session: '' }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Valid email domains
  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'live.com', 'msn.com', 'yandex.com',
    'zoho.com', 'mail.com', 'gmx.com', 'web.de', 'tutanota.com'
  ];

  // Check if email domain is valid
  const isValidDomain = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return validDomains.includes(domain);
  };

  // Handle phone number input with +91 validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (!value.startsWith('+91 ')) {
      value = '+91 ';
    }
    
    const numberPart = value.slice(4).replace(/\D/g, '');
    const limitedNumber = numberPart.slice(0, 10);
    const formattedValue = '+91 ' + limitedNumber;
    
    setFormData(prev => ({ ...prev, phone: formattedValue }));
  };

 // Handle email input with validation
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const email = e.target.value.trim();

  // If empty, clear error and skip validation
  if (email === '') {
    setEmailErrorShown(false);
    setFormData(prev => ({ ...prev, email }));
    return;
  }

  // Only validate when user types something
  if (!validateEmail(email) || !isValidDomain(email)) {
    if (!emailErrorShown) {
      toast.error("Please enter a valid email");
      setEmailErrorShown(true);
    }
  } else {
    setEmailErrorShown(false);
  }

  setFormData(prev => ({ ...prev, email }));
};

  // Validation function for required fields
  const validateRequiredFields = () => {
    const requiredFields = [
      { field: 'patientName', value: formData.patientName, label: 'Patient Name' },
      { field: 'phone', value: formData.phone, label: 'Phone Number' },
      { field: 'doctor', value: formData.doctor, label: 'Doctor' },
      { field: 'date', value: formData.date, label: 'Date' },
      { field: 'session', value: formData.session, label: 'Session' }
    ];

    for (const { field, value, label } of requiredFields) {
      if (!value || value.trim() === '' || value === '+91 ') {
        toast.error(`${label} is required`);
        return false;
      }

      if (field === 'phone') {
        const phoneNumber = value.replace('+91 ', '').replace(/\D/g, '');
        if (phoneNumber.length < 10) {
          toast.error('Phone number must be exactly 10 digits');
          return false;
        }
      }
    }

    if (formData.email && formData.email.trim() !== '') {
      if (!validateEmail(formData.email)) {
        toast.error('Please enter a valid email format');
        return false;
      }
      if (!isValidDomain(formData.email)) {
        toast.error('Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)');
        return false;
      }
    }
    return true;
  };
  
  // Generate token number for the appointment (per session)
  const generateTokenNumber = async (date: string, doctorId: string, session: string) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('appointmentDate', '==', date),
        where('doctorId', '==', doctorId),
        where('session', '==', session),
        where('status', 'in', ['scheduled', 'confirmed', 'approved'])
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size + 1;
    } catch (error) {
      console.error('Error generating token number:', error);
      return 1;
    }
  };

  // Save or update patient in patients collection
  const savePatient = async () => {
    try {
      const phoneId = formData.phone.replace(/\s/g, '').replace('+', '');
      
      const patientData = {
        name: formData.patientName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        updatedAt: serverTimestamp()
      };

      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('phone', '==', formData.phone.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingPatientDoc = querySnapshot.docs[0];
        await setDoc(doc(db, 'patients', existingPatientDoc.id), patientData, { merge: true });
      } else {
        const patientRef = doc(db, 'patients', phoneId);
        await setDoc(patientRef, {
          ...patientData,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  // Check if slot is available
  const checkSlotAvailability = async () => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', formData.doctor),
        where('appointmentDate', '==', formData.date),
        where('session', '==', formData.session),
        where('status', 'in', ['scheduled', 'confirmed'])
      );

      const querySnapshot = await getDocs(q);
      const maxAppointmentsPerSession = 20;
      
      if (querySnapshot.size >= maxAppointmentsPerSession) {
        toast.error(`This ${formData.session} session is fully booked. Please choose another session or date.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return true;
    }
  };

  // Get session start time based on doctor and session
  const getSessionStartTime = () => {
    if (!selectedDoctor) return '09:00';
    
    if (formData.session === 'morning') {
      return normalizeTime(selectedDoctor.morningStartTime, '09:00');
    } else {
      return normalizeTime(selectedDoctor.eveningStartTime, '14:00');
    }
  };

  // Helper function to check if session can be booked (must be at least 3 hours before session starts)
  const canBookSessionByTime = (date: string, session: 'morning' | 'evening'): { canBook: boolean; reason?: string } => {
    if (!selectedDoctor || !date) {
      return { canBook: true }; // If no doctor or date selected, allow (will be caught by other validation)
    }

    // Use currentTime state to ensure real-time updates
    const now = currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date);
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Get session start time from doctor's config
    const sessionStartTime = session === 'morning' 
      ? normalizeTime(selectedDoctor.morningStartTime, '09:00')
      : normalizeTime(selectedDoctor.eveningStartTime, '14:00');
    
    // Parse session start time
    const [startHours, startMinutes] = sessionStartTime.split(':').map(Number);
    const sessionStartMinutes = startHours * 60 + startMinutes;
    
    // Calculate days difference between selected date and today
    const daysDiff = Math.floor((selectedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // For past dates, don't allow booking
    if (daysDiff < 0) {
      return {
        canBook: false,
        reason: 'Cannot book appointments for past dates'
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
          reason: `⏰ Booking opens at ${cutoffTime12Hour} (3 hours before ${sessionName.toLowerCase()} session starts)`
        };
      }
      
      // Check if session has already started (after session start time)
      if (currentTimeInMinutes >= sessionStartMinutes) {
        return {
          canBook: false,
          reason: `❌ ${sessionName} session has already started`
        };
      }
      
      // Booking is allowed (between cutoff time and session start time)
      return { canBook: true };
    } else {
      // Selected date is in the FUTURE (tomorrow or later)
      // Calculate the cutoff time on the selected date
      const cutoffDateTime = new Date(selectedDay);
      cutoffDateTime.setHours(Math.floor(bookingCutoffMinutes / 60), bookingCutoffMinutes % 60, 0, 0);
      
      // Check if current date/time is before the cutoff time on the selected date
      if (now < cutoffDateTime) {
        // Booking hasn't opened yet
        return {
          canBook: false,
          reason: `⏰ Booking opens at ${cutoffTime12Hour} on ${selectedDateStr} (3 hours before ${sessionName.toLowerCase()} session starts)`
        };
      }
      
      // Check if session has already started on the selected date
      const sessionDateTime = new Date(selectedDay);
      sessionDateTime.setHours(startHours, startMinutes, 0, 0);
      
      if (now >= sessionDateTime) {
        // Session has started or passed
        if (daysDiff === 0) {
          return {
            canBook: false,
            reason: `❌ ${sessionName} session has already started`
          };
        }
        return {
          canBook: false,
          reason: `❌ ${sessionName} session has already passed`
        };
      }
      
      // Current time is after the cutoff time on the selected date, booking is allowed
      return { canBook: true };
    }
  };

  // Handle submit with Firebase integration
  const handleSubmit = async () => {
    if (!validateRequiredFields()) return;

    // Check if doctor is on leave for this date and session
    if (formData.date && formData.session) {
      const leaveCheck = isDoctorOnLeave(formData.date, formData.session as 'morning' | 'evening');
      if (leaveCheck.onLeave) {
        toast.error(`❌ ${leaveCheck.reason || 'Doctor is on leave for this session'}`);
        return;
      }
    }

    // Check if session can be booked (must be at least 3 hours before session starts)
    if (formData.date && formData.session) {
      const sessionTimeCheck = canBookSessionByTime(formData.date, formData.session as 'morning' | 'evening');
      if (!sessionTimeCheck.canBook) {
        toast.error(`❌ ${sessionTimeCheck.reason || 'Session can only be booked at least 3 hours before it starts'}`);
        return;
      }
    }

    setActionLoading(true);

    try {
      const isAvailable = await checkSlotAvailability();
      if (!isAvailable) {
        setActionLoading(false);
        return;
      }

      await savePatient();

      // Get doctor data for slot assignment
      const doctor = doctors.find(d => d.id === formData.doctor);
      if (!doctor) {
        toast.error('❌ Doctor not found');
        setActionLoading(false);
        return;
      }

      // Get existing appointments to find booked slots
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', formData.doctor),
        where('appointmentDate', '==', formData.date)
      );
      const snapshot = await getDocs(q);
      const existingAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Get booked slots for this session
      const bookedSlots = existingAppointments
        .filter((apt: any) => {
          if (apt.appointmentDate !== formData.date) return false;
          const aptTime = apt.appointmentTime || '';
          const aptTime24 = aptTime.includes(':') ? aptTime : '';
          if (!aptTime24) return false;
          const hour = parseInt(aptTime24.split(':')[0]);
          const aptSession = hour < 13 ? 'morning' : 'evening';
          return aptSession === formData.session;
        })
        .map((apt: any) => apt.appointmentTime);

      // Generate token number per session
      const tokenNumber = await generateTokenNumber(formData.date, formData.doctor, formData.session);
      
      // Get next available slot based on doctor's slot duration
      const { getNextAvailableSlot } = await import('@/lib/utils/slotAssignmentHelper');
      const doctorData = {
        availableSlots: doctor.availableSlots || [],
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        consultationDuration: doctor.consultationDuration,
        morningStartTime: doctor.morningStartTime,
        morningEndTime: doctor.morningEndTime,
        eveningStartTime: doctor.eveningStartTime,
        eveningEndTime: doctor.eveningEndTime
      };
      
      const appointmentTime = getNextAvailableSlot(
        doctorData,
        formData.date,
        formData.session as 'morning' | 'evening',
        bookedSlots
      ) || getSessionStartTime(); // Fallback to session start time if no slot available

      const appointmentData = {
        tokenNumber: tokenNumber,
        patientId: '',
        patientName: formData.patientName.trim(),
        patientPhone: formData.phone.trim(),
        patientEmail: formData.email.trim() || null,
        doctorId: formData.doctor,
        doctorName: doctor?.user?.name || 'Unknown',
        doctorSpecialty: doctor?.specialty || '',
        appointmentDate: formData.date,
        session: formData.session,
        appointmentTime: appointmentTime, // Dynamically assigned slot (24-hour format HH:MM)
        sessionDisplay: sessionTime,
        reason: formData.reason.trim() || null,
        status: 'scheduled',
        acceptanceStatus: 'pending',
        source: 'web',
        duration: doctor.consultationDuration || 20,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null
      };

      console.log('📤 Creating appointment with data:', appointmentData);

      const docRef = await addDoc(appointmentsRef, appointmentData);

      console.log('✅ Appointment created with ID:', docRef.id);

      toast.success(
        `Appointment created successfully! Token #${tokenNumber} for ${formData.session === 'morning' ? 'Morning' : 'Evening'} session`,
        { duration: 5000 }
      );
      
      resetForm();
      onCloseAction();
      
      setTimeout(() => {
        if (onAppointmentCreated) {
          onAppointmentCreated();
        }
      }, 500);

    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      toast.error('Failed to create appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={onCloseAction}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
            <p className="text-gray-500 text-sm mt-1">Create a new patient appointment</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onCloseAction();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-5">
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
                    onChange={handlePhoneChange}
                    placeholder="+91 9876543210"
                    maxLength={14}
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
                    onChange={handleEmailChange}
                    placeholder="patient@example.com (optional)"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

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
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                  </option>
                ))}
              </select>
              
              {/* Show upcoming leave dates for selected doctor */}
              {formData.doctor && overrides.length > 0 && (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const upcomingLeaves = overrides
                  .filter(override => {
                    const overrideDate = override.date.includes('T') 
                      ? override.date.split('T')[0] 
                      : override.date;
                    const leaveDate = new Date(overrideDate);
                    leaveDate.setHours(0, 0, 0, 0);
                    
                    const isHoliday = override.type === 'holiday' || 
                                     (override as any).displayType === 'holiday' ||
                                     (override as any).displayType === 'special-event';
                    
                    return isHoliday && leaveDate >= today;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.date.includes('T') ? a.date.split('T')[0] : a.date);
                    const dateB = new Date(b.date.includes('T') ? b.date.split('T')[0] : b.date);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, 5); // Show up to 5 upcoming leaves
                
                if (upcomingLeaves.length > 0) {
                  return (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-amber-900 mb-1">
                            Upcoming Leave Dates:
                          </p>
                          <div className="space-y-1">
                            {upcomingLeaves.map((leave, index) => {
                              const leaveDate = leave.date.includes('T') 
                                ? leave.date.split('T')[0] 
                                : leave.date;
                              const dateObj = new Date(leaveDate);
                              const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              });
                              
                              const sessionInfo = leave.startTime && leave.endTime
                                ? ` (${leave.startTime} - ${leave.endTime})`
                                : ' (Full Day)';
                              
                              return (
                                <p key={index} className="text-xs text-amber-800">
                                  📅 {formattedDate}{sessionInfo} - {leave.reason}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Session <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    name="session"
                    value={formData.session}
                    onChange={handleInputChange}
                    disabled={!formData.doctor || !formData.date}
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer ${
                      !formData.doctor || !formData.date
                        ? 'border-gray-300 opacity-50 cursor-not-allowed'
                        : formData.session && !isSessionAvailable(formData.session as 'morning' | 'evening')
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select session</option>
                    <option 
                      value="morning" 
                      disabled={!isSessionAvailable('morning')}
                      style={!isSessionAvailable('morning') ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : {}}
                    >
                      Morning {!isSessionAvailable('morning') ? '(Closed)' : ''}
                    </option>
                    <option 
                      value="evening" 
                      disabled={!isSessionAvailable('evening')}
                      style={!isSessionAvailable('evening') ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : {}}
                    >
                      Evening {!isSessionAvailable('evening') ? '(Closed)' : ''}
                    </option>
                  </select>
                </div>
                {sessionTime && (
                  <p className="text-xs text-teal-600 mt-1 ml-1 font-medium">
                    {sessionTime}
                  </p>
                )}
                {formData.date && formData.session && (() => {
                  const leaveCheck = isDoctorOnLeave(formData.date, formData.session as 'morning' | 'evening');
                  if (leaveCheck.onLeave) {
                    return (
                      <p className="text-xs text-red-600 mt-1 ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        ⚠️ {leaveCheck.reason}
                      </p>
                    );
                  }
                  return null;
                })()}
                {getSessionHelperText() && formData.date && formData.session && !isDoctorOnLeave(formData.date, formData.session as 'morning' | 'evening').onLeave && (
                  <p className="text-xs text-orange-600 mt-1 ml-1">
                    ⏰ {getSessionHelperText()}
                  </p>
                )}
                {!formData.doctor && (
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    Please select a doctor first
                  </p>
                )}
                {!formData.date && formData.doctor && (
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    Please select a date first
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Enter any additional reason or comments..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onCloseAction();
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading}
              className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Appointment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}