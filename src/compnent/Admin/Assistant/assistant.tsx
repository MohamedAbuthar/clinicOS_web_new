'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AssistantCard, { AssistantCardProps } from './AssistantCard';

const AssistantsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data - replace with your actual data source
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
    console.log('Edit assistant:', id);
    // Implement edit logic
  };

  const handleDelete = (id: string) => {
    console.log('Delete assistant:', id);
    // Implement delete logic
  };

  const handleAddAssistant = () => {
    console.log('Add new assistant');
    // Implement add logic
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
    </div>
  );
};

export default AssistantsPage;