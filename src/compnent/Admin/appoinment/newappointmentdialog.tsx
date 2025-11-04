"use client"

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Doctor {
  id: string;
  user?: {
    name: string;
  };
  specialty: string;
  morningTime?: string;
  eveningTime?: string;
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

  // Update selected doctor when doctor changes
  useEffect(() => {
    if (formData.doctor) {
      const doctor = doctors.find(d => d.id === formData.doctor);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    } else {
      setSelectedDoctor(null);
      setSessionTime('');
    }
  }, [formData.doctor, doctors]);

  // Update session time display when session changes
  useEffect(() => {
    if (selectedDoctor && formData.session) {
      if (formData.session === 'morning') {
        setSessionTime(selectedDoctor.morningTime || '9:00 AM - 1:00 PM');
      } else if (formData.session === 'evening') {
        setSessionTime(selectedDoctor.eveningTime || '2:00 PM - 5:00 PM');
      }
    } else {
      setSessionTime('');
    }
  }, [formData.session, selectedDoctor]);

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
    
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // If selected date is in the future, all sessions are available
    if (selectedDate > today) {
      return true;
    }
    
    // If selected date is today, check current time
    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      if (session === 'morning') {
        // Morning session available only before 1:00 PM (13:00)
        return currentHour < 13;
      } else if (session === 'evening') {
        // Evening session available from 11:00 AM (3 hours before 2:00 PM)
        return currentHour >= 11;
      }
    }
    
    // For past dates, don't allow any bookings
    return false;
  };

  // Get helper text for disabled sessions
  const getSessionHelperText = () => {
    if (!formData.date) return null;
    
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      
      if (currentHour < 11) {
        return "Morning session available now. Evening session opens at 11:00 AM (3 hours before session)";
      } else if (currentHour >= 11 && currentHour < 13) {
        return "Both sessions available now";
      } else if (currentHour >= 13 && currentHour < 14) {
        return "Currently between sessions. Evening session starts at 2:00 PM";
      } else {
        return "Evening session available now";
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
      if (selectedDoctor.morningTime) {
        const match = selectedDoctor.morningTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = match[2];
          const period = match[3].toUpperCase();
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return `${hour.toString().padStart(2, '0')}:${minute}`;
        }
      }
      return '09:00';
    } else {
      if (selectedDoctor.eveningTime) {
        const match = selectedDoctor.eveningTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = match[2];
          const period = match[3].toUpperCase();
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return `${hour.toString().padStart(2, '0')}:${minute}`;
        }
      }
      return '14:00';
    }
  };

  // Handle submit with Firebase integration
  const handleSubmit = async () => {
    if (!validateRequiredFields()) return;

    setActionLoading(true);

    try {
      const isAvailable = await checkSlotAvailability();
      if (!isAvailable) {
        setActionLoading(false);
        return;
      }

      await savePatient();

      // Generate token number per session
      const tokenNumber = await generateTokenNumber(formData.date, formData.doctor, formData.session);
      const appointmentTime = getSessionStartTime();

      const doctor = doctors.find(d => d.id === formData.doctor);

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
        appointmentTime: appointmentTime,
        sessionDisplay: sessionTime,
        reason: formData.reason.trim() || null,
        status: 'scheduled',
        acceptanceStatus: 'pending',
        source: 'web',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null
      };

      console.log('📤 Creating appointment with data:', appointmentData);

      const appointmentsRef = collection(db, 'appointments');
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="">Select session</option>
                    <option value="morning" disabled={!isSessionAvailable('morning')}>
                      Morning (9:00 AM - 1:00 PM) {!isSessionAvailable('morning') && '- Not Available'}
                    </option>
                    <option value="evening" disabled={!isSessionAvailable('evening')}>
                      Evening (2:00 PM onwards) {!isSessionAvailable('evening') && '- Not Available'}
                    </option>
                  </select>
                </div>
                {sessionTime && (
                  <p className="text-xs text-teal-600 mt-1 ml-1 font-medium">
                    {sessionTime}
                  </p>
                )}
                {getSessionHelperText() && (
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