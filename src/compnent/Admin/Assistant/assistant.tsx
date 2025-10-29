"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Search, X, User, Mail, Phone, Briefcase, Users, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAssistants, AssistantWithUser } from '@/lib/hooks/useAssistants';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiUtils } from '@/lib/api';
import { sendPasswordEmailWithRetry } from '@/lib/services/assistantPasswordService';
import { toast } from 'sonner';

interface AssistantCardProps {
  assistant: AssistantWithUser;
  onEdit?: (assistant: AssistantWithUser) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

interface AssistantForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  assignedDoctors: string; // Changed to string for form input
  status: 'active' | 'inactive';
}

const AssistantCard = ({ assistant, onEdit, onDelete, loading }: AssistantCardProps) => {
  const { id, user, assignedDoctorNames, isActive } = assistant;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(assistant)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Edit'}
            </button>
            <button
              onClick={() => onDelete?.(id)}
              disabled={loading}
              className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Email</p>
          <p className="text-gray-900 mt-1">{user.email}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="text-gray-900 mt-1">{user.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Assigned Doctors</p>
          <p className="text-gray-900 mt-1">{assignedDoctorNames.join(', ') || 'None'}</p>
        </div>
      </div>
    </div>
  );
};

const AssistantsPage = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const {
    assistants,
    doctors,
    loading,
    doctorsLoading,
    error,
    setError,
    pagination,
    searchQuery,
    setSearchQuery,
    fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  } = useAssistants();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantWithUser | null>(null);
  const [formData, setFormData] = useState<AssistantForm>({
    name: '',
    email: '',
    phone: '+91 ',
    password: '',
    role: 'assistant',
    assignedDoctors: '',
    status: 'active'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [filteredAssistants, setFilteredAssistants] = useState<AssistantWithUser[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrorShown, setEmailErrorShown] = useState(false);

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDoctorDropdown) {
        const target = event.target as Element;
        if (!target.closest('.doctor-dropdown-container')) {
          setShowDoctorDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDoctorDropdown]);

  // Filter assistants based on user role
  useEffect(() => {
    if (!assistants.length) {
      console.log('No assistants data available yet');
      setFilteredAssistants([]);
      return;
    }

    let filtered = [...assistants];

    // If no user is authenticated, show all assistants (shouldn't happen in admin portal)
    if (!isAuthenticated || !currentUser) {
      setFilteredAssistants(filtered);
      return;
    }

    // If doctor is authenticated, show only assistants assigned to them
    if (currentUser.role === 'doctor') {
      console.log('Doctor filtering assistants - currentUser:', currentUser);
      console.log('Available assistants:', assistants);
      
      // Find the doctor record for this user to get the doctor ID
      const doctorRecord = doctors.find(d => d.userId === currentUser.id);
      console.log('Doctor record found:', doctorRecord);
      
      if (doctorRecord) {
        // Find assistants that have this doctor ID in their assignedDoctors array
        filtered = assistants.filter(assistant => {
          const hasDoctor = assistant.assignedDoctors && assistant.assignedDoctors.includes(doctorRecord.id);
          console.log(`Assistant ${assistant.user.name}: assignedDoctors=${assistant.assignedDoctors}, doctorRecord.id=${doctorRecord.id}, hasDoctor=${hasDoctor}`);
          return hasDoctor;
        });
        
        console.log('Filtered assistants for doctor:', filtered.map(a => ({ name: a.user.name, assignedDoctors: a.assignedDoctors })));
      } else {
        console.log('No doctor record found for current user');
        filtered = [];
      }
    }
    
    // If assistant is authenticated, show only themselves
    else if (currentUser.role === 'assistant') {
      console.log('Assistant filtering - currentUser:', currentUser);
      console.log('Available assistants:', assistants);
      
      // Check if the current assistant exists in the assistants list
      const currentAssistant = assistants.find(a => a.userId === currentUser.id);
      console.log('Current assistant found:', currentAssistant);
      
      if (currentAssistant) {
        filtered = [currentAssistant];
        console.log('Showing assistant own profile:', currentAssistant.user.name);
      } else {
        console.log('Current assistant not found in assistants list');
        filtered = [];
      }
    }
    
    // If admin is authenticated, show all assistants
    else if (currentUser.role === 'admin') {
      filtered = assistants;
    }

    setFilteredAssistants(filtered);
  }, [assistants, currentUser, isAuthenticated, doctors]);

  const handleEdit = (assistant: AssistantWithUser) => {
    setSelectedAssistant(assistant);
    setFormData({
      name: assistant.user.name,
      email: assistant.user.email,
      phone: assistant.user.phone || '+91 ',
      password: '', // Password not shown in edit mode for security
      role: 'assistant', // Default role
      assignedDoctors: assistant.assignedDoctors.join(','), // Convert array to string with comma separator
      status: assistant.isActive ? 'active' : 'inactive'
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assistant?')) {
      setActionLoading(true);
      try {
        const success = await deleteAssistant(id);
        
        if (success) {
          toast.success('✅ Assistant deleted successfully');
        } else {
          toast.error('❌ Failed to delete assistant. Please try again.');
        }
      } catch (error: any) {
        console.error('Error deleting assistant:', error);
        
        // Handle specific error cases
        if (error.message?.includes('permission-denied') || error.message?.includes('permissions')) {
          toast.error('❌ Permission denied. You do not have access to delete this assistant.');
        } else {
          toast.error(`❌ ${error.message || 'Failed to delete assistant. Please try again.'}`);
        }
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleAddAssistant = () => {
    setShowAddDialog(true);
  };

  const handleFormChange = (field: keyof AssistantForm, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    handleFormChange('phone', formattedValue);
  };

  // Helper functions for doctor selection
  const getSelectedDoctors = () => {
    return formData.assignedDoctors.split(',').map(d => d.trim()).filter(d => d);
  };

  const isDoctorSelected = (doctorId: string) => {
    return getSelectedDoctors().includes(doctorId);
  };

  const toggleDoctorSelection = (doctorId: string) => {
    const selected = getSelectedDoctors();
    const isSelected = selected.includes(doctorId);
    
    if (isSelected) {
      // Remove doctor
      const updated = selected.filter(id => id !== doctorId);
      handleFormChange('assignedDoctors', updated.join(','));
    } else {
      // Add doctor
      const updated = [...selected, doctorId];
      handleFormChange('assignedDoctors', updated.join(','));
    }
  };

  const getSelectedDoctorNames = () => {
    const selectedIds = getSelectedDoctors();
    return selectedIds.map(id => {
      const doctor = doctors.find(d => d.id === id);
      return doctor ? `${doctor.user?.name || 'Unknown'} - ${doctor.specialty}` : 'Unknown Doctor';
    });
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
    
    // Call the original onChange handler
    handleFormChange('email', email);
  };

  const handleAddSubmit = async () => {
    setActionLoading(true);
    
    // Validate email format
    if (formData.email && formData.email.trim() !== '') {
      if (!validateEmail(formData.email)) {
        toast.error('Please enter a valid email format');
        setActionLoading(false);
        return;
      }
      if (!isValidDomain(formData.email)) {
        toast.error('Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)');
        setActionLoading(false);
        return;
      }
    }
    
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      setActionLoading(false);
      return;
    }
    
    // Validate password
    if (!formData.password.trim()) {
      toast.error('Please enter a password for the assistant');
      setActionLoading(false);
      return;
    }
    
    // Convert assigned doctors string to array
    const assignedDoctorsArray = formData.assignedDoctors
      .split(',')
      .map(doctor => doctor.trim())
      .filter(doctor => doctor.length > 0);
    
    console.log('Assigned doctors:', assignedDoctorsArray);
    console.log('Creating assistant with email:', formData.email);
    
    try {
      const result = await createAssistant({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        assignedDoctors: assignedDoctorsArray,
      });
      
      if (result.success) {
        // Send password email to the assistant
        console.log('Sending login credentials to assistant email...');
        try {
          const emailResult = await sendPasswordEmailWithRetry(
            formData.email,
            formData.password,
            formData.name
          );
          
          if (emailResult.success) {
            toast.success('✅ Assistant created successfully! Login credentials sent to their email.');
          } else {
            // Assistant created but email failed - provide manual credentials
            toast.warning(
              `✅ Assistant created successfully!\n\n⚠️ Email sending failed: ${emailResult.message}\n\nPlease share these credentials manually:\nEmail: ${formData.email}\nPassword: ${formData.password}`,
              { duration: 10000 }
            );
            console.warn('Failed to send password email:', emailResult.message);
          }
        } catch (emailError: any) {
          // Assistant created but email failed
          toast.warning(
            `✅ Assistant created successfully!\n\n⚠️ Failed to send email: ${emailError.message}\n\nPlease share these credentials manually:\nEmail: ${formData.email}\nPassword: ${formData.password}`,
            { duration: 10000 }
          );
          console.warn('Error sending password email:', emailError);
        }
        
        closeDialogs();
      } else {
        // Handle specific error cases
        if (result.errorCode === 'email-already-in-use') {
          toast.error('❌ Email already exists. Please use a different email address.');
        } else if (result.errorCode === 'weak-password') {
          toast.error('❌ Password is too weak. Please use a stronger password.');
        } else if (result.errorCode === 'invalid-email') {
          toast.error('❌ Invalid email address format.');
        } else {
          toast.error(`❌ ${result.error || 'Failed to create assistant. Please try again.'}`);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error creating assistant:', error);
      toast.error(`❌ ${error.message || 'Failed to create assistant. Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAssistant) return;
    
    setActionLoading(true);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      setActionLoading(false);
      return;
    }
    
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      setActionLoading(false);
      return;
    }
    
    try {
      // Convert assigned doctors string to array
      const assignedDoctorsArray = formData.assignedDoctors
        .split(',')
        .map(doctor => doctor.trim())
        .filter(doctor => doctor.length > 0);
      
      console.log('Updating assistant:', selectedAssistant.id, {
        assignedDoctors: assignedDoctorsArray,
        isActive: formData.status === 'active',
        user: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }
      });
      
      const success = await updateAssistant(selectedAssistant.id, {
        assignedDoctors: assignedDoctorsArray,
        isActive: formData.status === 'active',
        user: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }
      });
      
      if (success) {
        toast.success('✅ Assistant updated successfully');
        closeDialogs();
      } else {
        toast.error('❌ Failed to update assistant. Please try again.');
      }
    } catch (err: any) {
      console.error('Error updating assistant:', err);
      
      // Handle specific error cases
      if (err.message?.includes('email-already-in-use') || err.message?.includes('already exists')) {
        toast.error('❌ Email already exists. Please use a different email address.');
      } else if (err.message?.includes('permission-denied') || err.message?.includes('permissions')) {
        toast.error('❌ Permission denied. You do not have access to update this assistant.');
      } else {
        toast.error(`❌ ${err.message || 'Failed to update assistant. Please try again.'}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedAssistant(null);
    setShowDoctorDropdown(false);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      phone: '+91 ',
      password: '',
      role: 'assistant',
      assignedDoctors: '',
      status: 'active'
    });
  };

  const searchFilteredAssistants = filteredAssistants.filter((assistant) => {
    const query = searchQuery.toLowerCase();
    return (
      assistant.user.name.toLowerCase().includes(query) ||
      assistant.user.email.toLowerCase().includes(query) ||
      assistant.assignedDoctorNames.some(doctor => doctor.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentUser?.role === 'doctor' 
                  ? 'Your Assigned Assistants' 
                  : currentUser?.role === 'assistant'
                  ? 'Your Profile'
                  : 'Assistants'
                }
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.role === 'doctor' 
                  ? 'Assistants assigned to you for patient management' 
                  : currentUser?.role === 'assistant'
                  ? 'Your assistant profile and information'
                  : 'Manage assistant profiles and doctor assignments'
                }
              </p>
              {/* User context indicator */}
              {currentUser && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
                  {currentUser.role === 'doctor' && '👨‍⚕️ Doctor View'}
                  {currentUser.role === 'assistant' && '👩‍💼 Assistant View'}
                  {currentUser.role === 'admin' && '👨‍💼 Admin View'}
                </div>
              )}
            </div>
            <button
              onClick={handleAddAssistant}
              disabled={loading}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Assistant
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <span className="ml-2 text-gray-600">Loading assistants...</span>
          </div>
        )}

        {/* Assistant Cards */}
        {!loading && (
          <div className="space-y-4">
            {searchFilteredAssistants.length > 0 ? (
              searchFilteredAssistants.map((assistant) => (
                <AssistantCard
                  key={assistant.id}
                  assistant={assistant}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  loading={actionLoading}
                />
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-500">
                  {searchQuery ? 'No assistants match your search.' : 
                   currentUser?.role === 'doctor' ? 'No assistants are assigned to you.' :
                   'No assistants found.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAssistants(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchAssistants(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Assistant Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Assistant</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the assistant information</p>
              </div>
              <button
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-1" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || '+91 '}
                      onChange={handlePhoneChange}
                      placeholder="+91 9876543210"
                      maxLength={14}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      placeholder="Enter password for assistant login"
                      className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      This password will be automatically sent to the assistant&apos;s email address
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Role
                  </label>
                  <input
                    type="text"
                    value="Assistant"
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Assigned Doctors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Assigned Doctors
                  </label>
                  <div className="relative doctor-dropdown-container">
                    <div
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white cursor-pointer min-h-[42px] flex items-center"
                      onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                    >
                      <div className="flex-1">
                        {getSelectedDoctorNames().length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getSelectedDoctorNames().map((name, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-100 text-teal-800"
                              >
                                {name}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const doctorId = getSelectedDoctors()[index];
                                    toggleDoctorSelection(doctorId);
                                  }}
                                  className="ml-1 text-teal-600 hover:text-teal-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {doctorsLoading ? 'Loading doctors...' : 'Select doctors...'}
                          </span>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {showDoctorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {doctorsLoading ? (
                          <div className="px-4 py-2 text-gray-500 text-sm">Loading doctors...</div>
                        ) : doctors.length === 0 ? (
                          <div className="px-4 py-2 text-gray-500 text-sm">No doctors available</div>
                        ) : (
                          doctors.map((doctor) => (
                            <div
                              key={doctor.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                                isDoctorSelected(doctor.id) ? 'bg-teal-50' : ''
                              }`}
                              onClick={() => toggleDoctorSelection(doctor.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isDoctorSelected(doctor.id)}
                                onChange={() => {}} // Handled by parent onClick
                                className="mr-3 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm">
                                {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click to select multiple doctors</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value as 'active' | 'inactive')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={!formData.name || !formData.email || !formData.phone || !formData.password || actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {actionLoading ? 'Adding...' : 'Add Assistant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assistant Dialog */}
      {showEditDialog && selectedAssistant && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Assistant</h2>
                <p className="text-sm text-gray-500 mt-1">Update assistant information</p>
              </div>
              <button
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-1" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || '+91 '}
                      onChange={handlePhoneChange}
                      placeholder="+91 9876543210"
                      maxLength={14}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Role
                  </label>
                  <input
                    type="text"
                    value="Assistant"
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Assigned Doctors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Assigned Doctors
                  </label>
                  <div className="relative doctor-dropdown-container">
                    <div
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white cursor-pointer min-h-[42px] flex items-center"
                      onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                    >
                      <div className="flex-1">
                        {getSelectedDoctorNames().length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getSelectedDoctorNames().map((name, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-100 text-teal-800"
                              >
                                {name}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const doctorId = getSelectedDoctors()[index];
                                    toggleDoctorSelection(doctorId);
                                  }}
                                  className="ml-1 text-teal-600 hover:text-teal-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {doctorsLoading ? 'Loading doctors...' : 'Select doctors...'}
                          </span>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {showDoctorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {doctorsLoading ? (
                          <div className="px-4 py-2 text-gray-500 text-sm">Loading doctors...</div>
                        ) : doctors.length === 0 ? (
                          <div className="px-4 py-2 text-gray-500 text-sm">No doctors available</div>
                        ) : (
                          doctors.map((doctor) => (
                            <div
                              key={doctor.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                                isDoctorSelected(doctor.id) ? 'bg-teal-50' : ''
                              }`}
                              onClick={() => toggleDoctorSelection(doctor.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isDoctorSelected(doctor.id)}
                                onChange={() => {}} // Handled by parent onClick
                                className="mr-3 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm">
                                {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click to select multiple doctors</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value as 'active' | 'inactive')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantsPage;