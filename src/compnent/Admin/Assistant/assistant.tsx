"use client"


import React, { useState } from 'react';
import { Plus, Search, X, User, Mail, Phone, Briefcase, Users } from 'lucide-react';

interface AssistantCardProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  assignedDoctors: string[];
  initials: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface AssistantForm {
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedDoctors: string;
  status: 'active' | 'inactive';
}

const AssistantCard = ({ id, name, email, phone, role, status, assignedDoctors, initials, onEdit, onDelete }: AssistantCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {status}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(id)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(id)}
              className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Email</p>
          <p className="text-gray-900 mt-1">{email}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="text-gray-900 mt-1">{phone}</p>
        </div>
        <div>
          <p className="text-gray-500">Assigned Doctors</p>
          <p className="text-gray-900 mt-1">{assignedDoctors.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

const AssistantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantCardProps | null>(null);
  const [formData, setFormData] = useState<AssistantForm>({
    name: '',
    email: '',
    phone: '',
    role: 'Front Desk',
    assignedDoctors: '',
    status: 'active'
  });

  const assistants: AssistantCardProps[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya@clinicos.com',
      phone: '+91 98765 43210',
      role: 'Front Desk',
      status: 'active',
      assignedDoctors: ['Dr. Sivakumar', 'Dr. Rajesh Kumar'],
      initials: 'PS',
    },
    {
      id: '2',
      name: 'Ravi Menon',
      email: 'ravi@clinicos.com',
      phone: '+91 98765 43211',
      role: 'Queue Manager',
      status: 'active',
      assignedDoctors: ['Dr. Sivakumar'],
      initials: 'RM',
    },
    {
      id: '3',
      name: 'Lakshmi Iyer',
      email: 'lakshmi@clinicos.com',
      phone: '+91 98765 43212',
      role: 'Front Desk',
      status: 'active',
      assignedDoctors: ['Dr. Meena Patel'],
      initials: 'LI',
    },
  ];

  const handleEdit = (id: string) => {
    const assistant = assistants.find(a => a.id === id);
    if (assistant) {
      setSelectedAssistant(assistant);
      setFormData({
        name: assistant.name,
        email: assistant.email,
        phone: assistant.phone,
        role: assistant.role,
        assignedDoctors: assistant.assignedDoctors.join(', '),
        status: assistant.status
      });
      setShowEditDialog(true);
    }
  };

  const handleDelete = (id: string) => {
    console.log('Delete assistant:', id);
  };

  const handleAddAssistant = () => {
    setShowAddDialog(true);
  };

  const handleFormChange = (field: keyof AssistantForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = () => {
    console.log('Add Assistant:', formData);
    closeDialogs();
  };

  const handleEditSubmit = () => {
    console.log('Edit Assistant:', selectedAssistant?.id, formData);
    closeDialogs();
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedAssistant(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Front Desk',
      assignedDoctors: '',
      status: 'active'
    });
  };

  const filteredAssistants = assistants.filter((assistant) => {
    const query = searchQuery.toLowerCase();
    return (
      assistant.name.toLowerCase().includes(query) ||
      assistant.role.toLowerCase().includes(query) ||
      assistant.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
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

        {/* Assistant Cards */}
        <div className="space-y-4">
          {filteredAssistants.length > 0 ? (
            filteredAssistants.map((assistant) => (
              <AssistantCard
                key={assistant.id}
                {...assistant}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500">No assistants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Assistant Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Assistant</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the assistant's information</p>
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
                    <option value="Front Desk">Front Desk</option>
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
                  <input
                    type="text"
                    value={formData.assignedDoctors}
                    onChange={(e) => handleFormChange('assignedDoctors', e.target.value)}
                    placeholder="Dr. Sivakumar, Dr. Rajesh Kumar"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple doctors with commas</p>
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
                    <option value="Front Desk">Front Desk</option>
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
                  <input
                    type="text"
                    value={formData.assignedDoctors}
                    onChange={(e) => handleFormChange('assignedDoctors', e.target.value)}
                    placeholder="Dr. Sivakumar, Dr. Rajesh Kumar"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple doctors with commas</p>
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