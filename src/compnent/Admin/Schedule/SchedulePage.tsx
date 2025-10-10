'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import ScheduleRow, { ScheduleRowProps } from './ScheduleRow';
import ScheduleOverrideCard, {
  ScheduleOverrideCardProps,
} from './ScheduleOverrideCard';
import AddOverrideDialog from './AddOverrideDialog';
import EditScheduleDialog from './EditScheduleDialog';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { apiUtils } from '@/lib/api';

const SchedulePage: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRowProps | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { doctors, loading, error } = useDoctors();

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-select first doctor when doctors are loaded
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctor]);

  // Get doctor names for display
  const doctorNames = doctors.map(doctor => ({
    id: doctor.id,
    name: doctor.user.name
  }));

  // Weekly schedule data
  const weeklySchedule: ScheduleRowProps[] = [
    {
      day: 'Monday',
      timeRange: '09:00 - 17:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Tuesday',
      timeRange: '09:00 - 17:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Wednesday',
      timeRange: '09:00 - 17:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Thursday',
      timeRange: '09:00 - 17:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Friday',
      timeRange: '09:00 - 17:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Saturday',
      timeRange: '09:00 - 13:00',
      slotDuration: '10 min slots',
      status: 'active',
    },
    {
      day: 'Sunday',
      status: 'off',
    },
  ];

  // Schedule overrides data
  const scheduleOverrides: ScheduleOverrideCardProps[] = [
    {
      id: '1',
      title: 'Extended Hours',
      date: 'March 15, 2025',
      timeRange: '09:00 - 20:00',
      type: 'special-event',
    },
    {
      id: '2',
      title: 'Personal Leave',
      date: 'March 20, 2025',
      timeRange: 'Full Day',
      type: 'holiday',
    },
  ];

  const handleEditSchedule = (day: string) => {
    const schedule = weeklySchedule.find(s => s.day === day);
    if (schedule) {
      setEditingSchedule(schedule);
      setIsEditScheduleOpen(true);
    }
  };

  const handleEditOverride = (id: string) => {
    console.log('Edit override:', id);
    // TODO: Implement edit override dialog
  };

  const handleAddOverride = () => {
    setIsAddOverrideOpen(true);
  };

  const handleSaveOverride = async (data: { title: string; date: string; timeRange: string; type: 'special-event' | 'holiday' | 'extended-hours'; description?: string }) => {
    setActionLoading(true);
    try {
      // TODO: Implement save override API call
      console.log('Saving override:', data);
      setSuccessMessage('Schedule override saved successfully');
      setIsAddOverrideOpen(false);
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSchedule = async (data: { day: string; timeRange?: string; slotDuration?: string; status: 'active' | 'off' }) => {
    setActionLoading(true);
    try {
      // TODO: Implement save schedule API call
      console.log('Saving schedule:', data);
      setSuccessMessage('Schedule updated successfully');
      setIsEditScheduleOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage doctor schedules and slot durations
              </p>
            </div>
            <button
              onClick={handleAddOverride}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Override
            </button>
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Select Doctor:
            </label>
            <div className="relative">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer min-w-[200px]"
              >
                {doctorNames.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Weekly Schedule Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Default schedule for {doctorNames.find(d => d.id === selectedDoctor)?.name || 'Select a doctor'}
          </p>

          <div className="space-y-3">
            {weeklySchedule.map((schedule) => (
              <ScheduleRow
                key={schedule.day}
                {...schedule}
                onEdit={handleEditSchedule}
              />
            ))}
          </div>
        </div>

        {/* Schedule Overrides Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Schedule Overrides
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Holidays, extended hours, and special schedules
          </p>

          <div className="space-y-3">
            {scheduleOverrides.length > 0 ? (
              scheduleOverrides.map((override) => (
                <ScheduleOverrideCard
                  key={override.id}
                  {...override}
                  onEdit={handleEditOverride}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No schedule overrides found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddOverrideDialog
        isOpen={isAddOverrideOpen}
        onClose={() => setIsAddOverrideOpen(false)}
        onSave={handleSaveOverride}
      />

      <EditScheduleDialog
        isOpen={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        initialData={editingSchedule || undefined}
      />
    </div>
  );
};

export default SchedulePage;