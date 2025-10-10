"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Search, X, User, Mail, Phone, Briefcase, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useAssistants, AssistantWithUser } from '@/lib/hooks/useAssistants';
import { apiUtils } from '@/lib/api';

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
  const {
    assistants,
    doctors,
    loading,
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
    phone: '',
    role: 'assistant',
    assignedDoctors: '',
    status: 'active'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleEdit = (assistant: AssistantWithUser) => {
    setSelectedAssistant(assistant);
    setFormData({
      name: assistant.user.name,
      email: assistant.user.email,
      phone: assistant.user.phone || '',
      role: 'assistant', // Default role
      assignedDoctors: assistant.assignedDoctors.join(','), // Convert array to string with comma separator
      status: assistant.isActive ? 'active' : 'inactive'
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assistant?')) {
      setActionLoading(true);
      const success = await deleteAssistant(id);
      setActionLoading(false);
      
      if (success) {
        setSuccessMessage('Assistant deleted successfully');
      }
    }
  };

  const handleAddAssistant = () => {
    setShowAddDialog(true);
  };

  const handleFormChange = (field: keyof AssistantForm, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async () => {
    setActionLoading(true);
    
    // Convert assigned doctors string to array
    const assignedDoctorsArray = formData.assignedDoctors
      .split(',')
      .map(doctor => doctor.trim())
      .filter(doctor => doctor.length > 0);
    
    // Validate that all assigned doctors are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidDoctors = assignedDoctorsArray.filter(doctor => !uuidRegex.test(doctor));
    
    if (invalidDoctors.length > 0) {
      setError('Please select valid doctors from the dropdown. Invalid doctor IDs detected.');
      setActionLoading(false);
      return;
    }
    
    const success = await createAssistant({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      assignedDoctors: assignedDoctorsArray,
    });
    setActionLoading(false);
    
    if (success) {
      setSuccessMessage('Assistant created successfully');
      closeDialogs();
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAssistant) return;
    
    setActionLoading(true);
    
    // Convert assigned doctors string to array
    const assignedDoctorsArray = formData.assignedDoctors
      .split(',')
      .map(doctor => doctor.trim())
      .filter(doctor => doctor.length > 0);
    
    // Validate that all assigned doctors are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidDoctors = assignedDoctorsArray.filter(doctor => !uuidRegex.test(doctor));
    
    if (invalidDoctors.length > 0) {
      setError('Please select valid doctors from the dropdown. Invalid doctor IDs detected.');
      setActionLoading(false);
      return;
    }
    
    const success = await updateAssistant(selectedAssistant.id, {
      assignedDoctors: assignedDoctorsArray,
      isActive: formData.status === 'active',
      user: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }
    });
    setActionLoading(false);
    
    if (success) {
      setSuccessMessage('Assistant updated successfully');
      closeDialogs();
    }
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedAssistant(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'assistant',
      assignedDoctors: '',
      status: 'active'
    });
  };

  const filteredAssistants = assistants.filter((assistant) => {
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
              <h1 className="text-2xl font-bold text-gray-900">Assistants</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage assistant profiles and doctor assignments
              </p>
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
            {filteredAssistants.length > 0 ? (
              filteredAssistants.map((assistant) => (
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
                <p className="text-gray-500">No assistants found</p>
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
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="assistant">Assistant</option>
                    <option value="Queue Manager">Queue Manager</option>
                    <option value="Medical Assistant">Medical Assistant</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>

                {/* Assigned Doctors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Assigned Doctors
                  </label>
                  <select
                    multiple
                    value={formData.assignedDoctors.split(',').map(d => d.trim()).filter(d => d)}
                    onChange={(e) => {
                      const selectedDoctors = Array.from(e.target.selectedOptions, option => option.value);
                      handleFormChange('assignedDoctors', selectedDoctors.join(','));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    size={3}
                  >
                    <option value="">Select doctors...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple doctors</p>
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
                disabled={!formData.name || !formData.email || !formData.phone}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Assistant
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
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="assistant">Assistant</option>
                    <option value="Queue Manager">Queue Manager</option>
                    <option value="Medical Assistant">Medical Assistant</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>

                {/* Assigned Doctors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Assigned Doctors
                  </label>
                  <select
                    multiple
                    value={formData.assignedDoctors.split(',').map(d => d.trim()).filter(d => d)}
                    onChange={(e) => {
                      const selectedDoctors = Array.from(e.target.selectedOptions, option => option.value);
                      handleFormChange('assignedDoctors', selectedDoctors.join(','));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    size={3}
                  >
                    <option value="">Select doctors...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple doctors</p>
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