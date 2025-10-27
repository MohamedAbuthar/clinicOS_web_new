"use client"

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  patientName: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
  source: string;
  notes: string;
}

interface Doctor {
  id: string;
  user?: {
    name: string;
  };
  specialty: string;
}

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  formData: FormData;
  onInputChangeAction: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmitAction: () => void;
  actionLoading: boolean;
  doctors: Doctor[];
}

export default function NewAppointmentDialog({
  isOpen,
  onCloseAction,
  formData,
  onInputChangeAction,
  onSubmitAction,
  actionLoading,
  doctors
}: NewAppointmentDialogProps) {
  // Time picker state - MUST be called before any conditional returns
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);

  // Parse existing time when formData.time changes
  useEffect(() => {
    if (formData.time) {
      const [hours, mins] = formData.time.split(':');
      const hourNum = parseInt(hours);
      
      if (hourNum === 0) {
        setHour('12');
        setPeriod('AM');
      } else if (hourNum < 12) {
        setHour(hourNum.toString().padStart(2, '0'));
        setPeriod('AM');
      } else if (hourNum === 12) {
        setHour('12');
        setPeriod('PM');
      } else {
        setHour((hourNum - 12).toString().padStart(2, '0'));
        setPeriod('PM');
      }
      
      setMinute(mins);
    }
  }, [formData.time]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.hour-dropdown-container')) {
        setShowHourDropdown(false);
      }
      if (!target.closest('.minute-dropdown-container')) {
        setShowMinuteDropdown(false);
      }
    };

    if (showHourDropdown || showMinuteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHourDropdown, showMinuteDropdown]);

  // Early return after all hooks
  if (!isOpen) return null;

  // Convert 12-hour format to 24-hour format and update formData
  const handleTimeChange = (newHour?: string, newMinute?: string, newPeriod?: string) => {
    const h = newHour || hour;
    const m = newMinute || minute;
    const p = newPeriod || period;
    
    let hour24 = parseInt(h);
    
    if (p === 'AM') {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    
    const time24 = `${hour24.toString().padStart(2, '0')}:${m}`;
    
    // Create a synthetic event to trigger the parent's onChange
    const event = {
      target: {
        name: 'time',
        value: time24
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChangeAction(event);
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
    
    // Always ensure +91 prefix
    if (!value.startsWith('+91 ')) {
      value = '+91 ';
    }
    
    // Extract only the number part after +91 
    const numberPart = value.slice(4).replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedNumber = numberPart.slice(0, 10);
    
    // Format as +91 XXXXXXXXXX
    const formattedValue = '+91 ' + limitedNumber;
    
    // Update the input value
    e.target.value = formattedValue;
    onInputChangeAction(e);
  };

  // Handle email input with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    
    // Only validate if email is not empty
    if (email) {
      if (!validateEmail(email)) {
        toast.error("Please enter a valid email format");
      } else if (!isValidDomain(email)) {
        toast.error("Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)");
      }
    }
    
    // Call the original onChange handler
    onInputChangeAction(e);
  };

  // Validation function for required fields
  const validateRequiredFields = () => {
    const requiredFields = [
      { field: 'patientName', value: formData.patientName, label: 'Patient Name' },
      { field: 'phone', value: formData.phone, label: 'Phone Number' },
      { field: 'email', value: formData.email, label: 'Email' },
      { field: 'doctor', value: formData.doctor, label: 'Doctor' },
      { field: 'date', value: formData.date, label: 'Date' },
      { field: 'time', value: formData.time, label: 'Time' }
    ];

    for (const { field, value, label } of requiredFields) {
      if (!value || value.trim() === '') {
        console.log(`Validation failed for ${field}:`, value); // Debug log
        toast.error(`${label} is required`);
        return false;
      }

      // Validate phone number has exactly 10 digits after +91
      if (field === 'phone') {
        const phoneNumber = value.replace('+91 ', '').replace(/\D/g, '');
        if (phoneNumber.length < 10) {
          toast.error('Phone number must be exactly 10 digits');
          return false;
        }
      }

      // Validate email format
      if (field === 'email') {
        if (!validateEmail(value)) {
          toast.error('Please enter a valid email format');
          return false;
        }
        if (!isValidDomain(value)) {
          toast.error('Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)');
          return false;
        }
      }
    }

    return true;
  };

  // Handle submit with validation
  const handleSubmit = () => {
    if (validateRequiredFields()) {
      onSubmitAction();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={onCloseAction}
      ></div>
      
      {/* Dialog Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
            <p className="text-gray-500 text-sm mt-1">Create a new patient appointment</p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="px-6 py-6">
          <div className="space-y-5">
            {/* Patient Name */}
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
                  onChange={onInputChangeAction}
                  placeholder="Enter patient name"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Phone and Email */}
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
                    value={formData.phone || '+91 '}
                    onChange={handlePhoneChange}
                    placeholder="+91 9876543210"
                    maxLength={14}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="patient@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Doctor <span className="text-red-500">*</span>
              </label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={onInputChangeAction}
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

            {/* Date and Time */}
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
                    onChange={onInputChangeAction}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                  <div className="flex gap-2">
                    {/* Hour - Custom Dropdown */}
                    <div className="relative flex-1 hour-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setShowHourDropdown(!showHourDropdown)}
                        className="w-full pl-11 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer bg-white text-left"
                      >
                        {hour}
                      </button>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      
                      {/* Custom Dropdown Menu */}
                      {showHourDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => {
                            const h = (i + 1).toString().padStart(2, '0');
                            return (
                              <div
                                key={h}
                                onClick={() => {
                                  setHour(h);
                                  handleTimeChange(h, minute, period);
                                  setShowHourDropdown(false);
                                }}
                                className={`px-4 py-2 cursor-pointer hover:bg-teal-50 transition-colors ${
                                  hour === h ? 'bg-teal-100 text-teal-700 font-semibold' : 'text-gray-700'
                                }`}
                              >
                                {h}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Minute - Custom Dropdown */}
                    <div className="relative flex-1 minute-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setShowMinuteDropdown(!showMinuteDropdown)}
                        className="w-full px-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer bg-white text-left"
                      >
                        {minute}
                      </button>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      
                      {/* Custom Dropdown Menu */}
                      {showMinuteDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {Array.from({ length: 60 }, (_, i) => {
                            const m = i.toString().padStart(2, '0');
                            return (
                              <div
                                key={m}
                                onClick={() => {
                                  setMinute(m);
                                  handleTimeChange(hour, m, period);
                                  setShowMinuteDropdown(false);
                                }}
                                className={`px-4 py-2 cursor-pointer hover:bg-teal-50 transition-colors ${
                                  minute === m ? 'bg-teal-100 text-teal-700 font-semibold' : 'text-gray-700'
                                }`}
                              >
                                {m}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* AM/PM */}
                    <div className="relative w-24">
                      <select
                        value={period}
                        onChange={(e) => {
                          setPeriod(e.target.value);
                          handleTimeChange(hour, minute, e.target.value);
                        }}
                        className="w-full px-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer bg-white font-semibold"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={onInputChangeAction}
                placeholder="Enter any additional notes or comments..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCloseAction}
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