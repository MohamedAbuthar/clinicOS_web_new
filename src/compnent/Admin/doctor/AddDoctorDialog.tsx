"use client"

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Clock, MapPin, Users, UserPlus, Loader2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { generateTimeSlots, formatScheduleDisplay } from '@/lib/utils/timeSlotGenerator';

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
    phone: '',
    email: '',
    password: '',
    schedule: '',
    startTime: '09:00',
    endTime: '17:00',
    room: '',
    slotDuration: '20',
    assistants: [],
    status: 'In'
  });
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [showAssistantsDropdown, setShowAssistantsDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async () => {
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email || !newDoctor.password) {
      return;
    }

    if (!newDoctor.startTime || !newDoctor.endTime) {
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
        availableSlots: slots.map(slot => slot.time), // Store available slots
        assignedAssistants: newDoctor.assistants, // Include selected assistants
        status: newDoctor.status, // Include the initial status
      };

      await onSubmitAction(doctorData);
      
      // Reset form after successful submission
      setNewDoctor({
        name: '',
        specialty: '',
        phone: '',
        email: '',
        password: '',
        schedule: '',
        startTime: '09:00',
        endTime: '17:00',
        room: '',
        slotDuration: '20',
        assistants: [],
        status: 'In'
      });
      setPreviewSlots([]);
      setShowAssistantsDropdown(false);
      setShowPassword(false);
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setNewDoctor({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      password: '',
      schedule: '',
      startTime: '09:00',
      endTime: '17:00',
      room: '',
      slotDuration: '20',
      assistants: [],
      status: 'In'
    });
    setPreviewSlots([]);
    setShowAssistantsDropdown(false);
    setShowPassword(false);
    onCloseAction();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Doctor</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in the doctor information</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Add Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
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

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newDoctor.specialty}
                onChange={(e) => handleAddDoctorChange('specialty', e.target.value)}
                placeholder="General Physician, Cardiologist, etc."
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newDoctor.phone}
                  onChange={(e) => handleAddDoctorChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => handleAddDoctorChange('email', e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newDoctor.password}
                  onChange={(e) => handleAddDoctorChange('password', e.target.value)}
                  placeholder="Enter password for doctor login"
                  className="w-full px-4 py-2.5 pr-12 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This password will be used for doctor to login to the admin portal
              </p>
            </div>

            {/* Schedule Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    value={newDoctor.startTime}
                    onChange={(e) => handleAddDoctorChange('startTime', e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    value={newDoctor.endTime}
                    onChange={(e) => handleAddDoctorChange('endTime', e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  />
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
