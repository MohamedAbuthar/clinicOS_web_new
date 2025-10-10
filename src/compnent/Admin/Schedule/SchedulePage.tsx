'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Calendar } from 'lucide-react';
import ScheduleRow, { ScheduleRowProps } from './ScheduleRow';
import ScheduleOverrideCard, {
  ScheduleOverrideCardProps,
} from './ScheduleOverrideCard';
import AddOverrideDialog from './AddOverrideDialog';
import EditScheduleDialog from './EditScheduleDialog';

const SchedulePage: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Sivakumar');
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRowProps | null>(null);

  // Sample doctors list
  const doctors = ['Dr. Sivakumar', 'Dr. Rajesh Kumar', 'Dr. Meena Patel'];

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

  const handleSaveOverride = (data: { title: string; date: string; timeRange: string; type: 'special-event' | 'holiday' | 'extended-hours'; description?: string }) => {
    console.log('Saving override:', data);
    // TODO: Implement save override logic
  };

  const handleSaveSchedule = (data: { day: string; timeRange?: string; slotDuration?: string; status: 'active' | 'off' }) => {
    console.log('Saving schedule:', data);
    // TODO: Implement save schedule logic
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
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
                {doctors.map((doctor) => (
                  <option key={doctor} value={doctor}>
                    {doctor}
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
            Default schedule for {selectedDoctor}
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