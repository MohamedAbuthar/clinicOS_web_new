"use client"

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Clock, MapPin, Users, UserPlus, Loader2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { generateTimeSlots, formatScheduleDisplay } from '@/lib/utils/timeSlotGenerator';
import { toast } from 'sonner';

// TypeScript Interfaces
interface NewDoctorForm {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  password: string;
  schedule: string;
  startTime: string;
  endTime: string;
  morningStartTime: string;
  morningEndTime: string;
  eveningStartTime: string;
  eveningEndTime: string;
  room: string;
  slotDuration: string;
  assistants: string[];
  status: string;
}

interface AddDoctorDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (doctorData: any) => Promise<void>;
  actionLoading: boolean;
}

export default function AddDoctorDialog({ isOpen, onCloseAction, onSubmitAction, actionLoading }: AddDoctorDialogProps) {
  const [newDoctor, setNewDoctor] = useState<NewDoctorForm>({
    name: '',
    specialty: '',
    phone: '+91 ',
    email: '',
    password: '',
    schedule: '',
    startTime: '09:00',
    endTime: '17:00',
    morningStartTime: '09:00',
    morningEndTime: '12:00',
    eveningStartTime: '17:00',
    eveningEndTime: '20:00',
    room: '',
    slotDuration: '20',
    assistants: [],
    status: 'In'
  });
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [showAssistantsDropdown, setShowAssistantsDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrorShown, setEmailErrorShown] = useState(false);

  const { assistants, loading: assistantsLoading } = useAssistants();

  // Auto-generate slot preview when schedule changes
  useEffect(() => {
    if (newDoctor.startTime && newDoctor.endTime && newDoctor.slotDuration) {
      const slots = generateTimeSlots({
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        slotDuration: parseInt(newDoctor.slotDuration)
      });
      setPreviewSlots(slots.map(slot => slot.time));
    } else {
      setPreviewSlots([]);
    }
  }, [newDoctor.startTime, newDoctor.endTime, newDoctor.slotDuration]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAssistantsDropdown && !target.closest('.relative')) {
        setShowAssistantsDropdown(false);
      }
    };

    if (showAssistantsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssistantsDropdown]);

  const handleAddDoctorChange = (field: keyof NewDoctorForm, value: string) => {
    setNewDoctor(prev => ({ ...prev, [field]: value }));
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

  // Handle email input with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    
    // Only validate if email is not empty
    if (email) {
      if (!validateEmail(email) || !isValidDomain(email)) {
        if (!emailErrorShown) {
          toast.error("Please enter a valid email");
          setEmailErrorShown(true);
        }
      } else {
        // Valid email entered, reset error state
        setEmailErrorShown(false);
      }
    } else {
      // Empty email, reset error state
      setEmailErrorShown(false);
    }
    
    // Update the form state
    handleAddDoctorChange('email', email);
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
    handleAddDoctorChange('phone', formattedValue);
  };

  const toggleAssistant = (assistantId: string) => {
    setNewDoctor(prev => ({
      ...prev,
      assistants: prev.assistants.includes(assistantId)
        ? prev.assistants.filter(id => id !== assistantId)
        : [...prev.assistants, assistantId]
    }));
  };

  const getSelectedAssistantNames = () => {
    return assistants
      .filter(a => newDoctor.assistants.includes(a.id))
      .map(a => a.user.name)
      .join(', ') || 'Select assistants';
  };

  // Validation function for required fields
  const validateRequiredFields = () => {
    const requiredFields = [
      { field: 'name', value: newDoctor.name, label: 'Full Name' },
      { field: 'specialty', value: newDoctor.specialty, label: 'Specialty' },
      { field: 'phone', value: newDoctor.phone, label: 'Phone Number' },
      { field: 'email', value: newDoctor.email, label: 'Email' },
      { field: 'password', value: newDoctor.password, label: 'Password' },
      { field: 'morningStartTime', value: newDoctor.morningStartTime, label: 'Morning Start Time' },
      { field: 'morningEndTime', value: newDoctor.morningEndTime, label: 'Morning End Time' },
      { field: 'eveningStartTime', value: newDoctor.eveningStartTime, label: 'Evening Start Time' },
      { field: 'eveningEndTime', value: newDoctor.eveningEndTime, label: 'Evening End Time' }
    ];

    for (const { field, value, label } of requiredFields) {
      if (!value || value.trim() === '') {
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
    }

    // Validate email format (required field)
    if (!validateEmail(newDoctor.email)) {
      toast.error('Please enter a valid email format');
      return false;
    }
    if (!isValidDomain(newDoctor.email)) {
      toast.error('Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    try {
      // Generate schedule string
      const scheduleString = formatScheduleDisplay(newDoctor.startTime, newDoctor.endTime);
      
      // Generate time slots
      const slots = generateTimeSlots({
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        slotDuration: parseInt(newDoctor.slotDuration)
      });

      const doctorData = {
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        password: newDoctor.password,
        specialty: newDoctor.specialty,
        licenseNumber: 'LIC' + Date.now(), // Generate a temporary license number
        consultationDuration: parseInt(newDoctor.slotDuration),
        schedule: scheduleString,
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        morningStartTime: newDoctor.morningStartTime,
        morningEndTime: newDoctor.morningEndTime,
        eveningStartTime: newDoctor.eveningStartTime,
        eveningEndTime: newDoctor.eveningEndTime,
        availableSlots: slots.map(slot => slot.time), // Store available slots
        assignedAssistants: newDoctor.assistants, // Include selected assistants
        status: newDoctor.status, // Include the initial status
      };

      await onSubmitAction(doctorData);
      
      // Reset form after successful submission
      setNewDoctor({
        name: '',
        specialty: '',
        phone: '+91 ',
        email: '',
        password: '',
        schedule: '',
        startTime: '09:00',
        endTime: '17:00',
        morningStartTime: '09:00',
        morningEndTime: '12:00',
        eveningStartTime: '17:00',
        eveningEndTime: '20:00',
        room: '',
        slotDuration: '20',
        assistants: [],
        status: 'In'
      });
      setPreviewSlots([]);
      setShowAssistantsDropdown(false);
      setShowPassword(false);
      setEmailErrorShown(false);
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setNewDoctor({
      name: '',
      specialty: '',
      phone: '+91 ',
      email: '',
      password: '',
      schedule: '',
      startTime: '09:00',
      endTime: '17:00',
      morningStartTime: '09:00',
      morningEndTime: '12:00',
      eveningStartTime: '17:00',
      eveningEndTime: '20:00',
      room: '',
      slotDuration: '20',
      assistants: [],
      status: 'In'
    });
    setPreviewSlots([]);
    setShowAssistantsDropdown(false);
    setShowPassword(false);
    setEmailErrorShown(false);
    onCloseAction();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Doctor</h2>
            <p className="text-sm text-gray-600 mt-1">Fill in the details to add a new doctor</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newDoctor.name}
                onChange={(e) => handleAddDoctorChange('name', e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialty <span className="text-red-500">*</span>
              </label>
              <select 
                value={newDoctor.specialty}
                onChange={(e) => handleAddDoctorChange('specialty', e.target.value)}
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select Specialty</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="ENT">ENT</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Neurology">Neurology</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newDoctor.phone}
                onChange={handlePhoneChange}
                placeholder="+91 XXXXXXXXXX"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newDoctor.email}
                onChange={handleEmailChange}
                placeholder="doctor@example.com"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newDoctor.password}
                  onChange={(e) => handleAddDoctorChange('password', e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Morning Session */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Clock size={16} className="inline mr-1" />
                Morning Session
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={newDoctor.morningStartTime}
                      onChange={(e) => handleAddDoctorChange('morningStartTime', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={newDoctor.morningEndTime}
                      onChange={(e) => handleAddDoctorChange('morningEndTime', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evening Session */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Clock size={16} className="inline mr-1" />
                Evening Session
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={newDoctor.eveningStartTime}
                      onChange={(e) => handleAddDoctorChange('eveningStartTime', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={newDoctor.eveningEndTime}
                      onChange={(e) => handleAddDoctorChange('eveningEndTime', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Room <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newDoctor.room}
                onChange={(e) => handleAddDoctorChange('room', e.target.value)}
                placeholder="Room 101"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Slot Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Slot Duration <span className="text-red-500">*</span>
              </label>
              <select 
                value={newDoctor.slotDuration}
                onChange={(e) => handleAddDoctorChange('slotDuration', e.target.value)}
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>

            {/* Auto-Generated Slots Preview */}
            {previewSlots.length > 0 && (
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-teal-600" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    Auto-Generated Time Slots ({previewSlots.length} slots)
                  </h4>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Schedule: {newDoctor.startTime} - {newDoctor.endTime} | Duration: {newDoctor.slotDuration} min
                </p>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {previewSlots.map((slot, idx) => (
                    <div 
                      key={idx}
                      className="bg-white px-2 py-1.5 rounded text-center text-xs font-medium text-gray-700 border border-gray-200 shadow-sm"
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assistants - Multi-select Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                Assistants {assistantsLoading && <span className="text-xs text-gray-500">(Loading...)</span>}
              </label>
              
              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setShowAssistantsDropdown(!showAssistantsDropdown)}
                className="w-full px-4 py-2.5 text-left text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white flex items-center justify-between"
              >
                <span className={newDoctor.assistants.length === 0 ? 'text-gray-400' : ''}>
                  {getSelectedAssistantNames()}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showAssistantsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showAssistantsDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {assistants.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {assistantsLoading ? 'Loading assistants...' : 'No assistants available'}
                    </div>
                  ) : (
                    assistants.map((assistant) => (
                      <div
                        key={assistant.id}
                        onClick={() => toggleAssistant(assistant.id)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={newDoctor.assistants.includes(assistant.id)}
                          onChange={() => {}} // Handled by parent onClick
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{assistant.user.name}</div>
                          <div className="text-xs text-gray-500">{assistant.user.email}</div>
                        </div>
                        {!assistant.isActive && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Inactive</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Count */}
              {newDoctor.assistants.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {newDoctor.assistants.length} assistant{newDoctor.assistants.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <select 
                value={newDoctor.status}
                onChange={(e) => handleAddDoctorChange('status', e.target.value)}
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="In">Available (In)</option>
                <option value="Break">On Break</option>
                <option value="Out">Not Available (Out)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={handleClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email || !newDoctor.password || actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Add Doctor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}