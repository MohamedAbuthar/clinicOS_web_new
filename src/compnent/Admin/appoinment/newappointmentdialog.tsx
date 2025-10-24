"use client"

import React from 'react';
import { X, User, Phone, Mail, Calendar, Clock, Loader2 } from 'lucide-react';
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
  if (!isOpen) return null;

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
                    value={formData.phone}
                    onChange={onInputChangeAction}
                    placeholder="+91 98765 43210"
                    maxLength={13}
                    pattern="[0-9+\\s-]*"
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={onInputChangeAction}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
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