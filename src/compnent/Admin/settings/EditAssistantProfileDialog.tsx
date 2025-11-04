'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditAssistantProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssistantProfileData) => Promise<void>;
  initialData: AssistantProfileData | null;
  loading?: boolean;
}

export interface AssistantProfileData {
  name: string;
  email: string;
  phone: string;
}

const EditAssistantProfileDialog: React.FC<EditAssistantProfileDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AssistantProfileData>({
    name: '',
    email: '',
    phone: '',
  });
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      // Extract phone number digits (10 digits)
      let phoneDigits = '';
      if (initialData.phone) {
        const digitsOnly = initialData.phone.replace(/\D/g, '');
        // Remove +91 if present (first 2 digits)
        if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
          phoneDigits = digitsOnly.slice(2);
        } else if (digitsOnly.length === 10) {
          phoneDigits = digitsOnly;
        } else {
          phoneDigits = digitsOnly.slice(0, 10);
        }
      }

      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: '+91 ' + phoneDigits,
      });
      setPhoneNumber(phoneDigits);
    } else if (!isOpen) {
      // Reset form when dialog closes
      setFormData({
        name: '',
        email: '',
        phone: '+91 ',
      });
      setPhoneNumber('');
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof AssistantProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle phone number input - only allow 10 digits
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits
    const digitsOnly = e.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedNumber = digitsOnly.slice(0, 10);
    
    setPhoneNumber(limitedNumber);
    // Update formData with full phone number including +91 prefix
    handleChange('phone', '+91 ' + limitedNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation (if provided)
    if (phoneNumber && phoneNumber.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Background */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
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
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-1" />
              Phone Number
            </label>
            <div className="flex items-center">
              {/* Fixed +91 prefix */}
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l-lg text-gray-700 font-medium text-sm">
                +91
              </div>
              {/* Phone number input - only 10 digits */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={10}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg rounded-l-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="XXXXXXXXXX"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssistantProfileDialog;

