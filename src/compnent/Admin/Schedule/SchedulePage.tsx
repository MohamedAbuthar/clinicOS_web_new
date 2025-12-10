'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import ScheduleRow, { ScheduleRowProps } from './ScheduleRow';
import ScheduleOverrideCard, {
  ScheduleOverrideCardProps,
} from './ScheduleOverrideCard';
import AddOverrideDialog from './AddOverrideDialog';
import EditOverrideDialog from './EditOverrideDialog';
import EditScheduleDialog from './EditScheduleDialog';
import DeleteOverrideDialog from './DeleteOverrideDialog';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { useSchedule } from '@/lib/hooks/useSchedule';
import { useScheduleOverrides, ScheduleOverride } from '@/lib/hooks/useScheduleOverrides';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { apiUtils } from '@/lib/api';
import { toast } from 'sonner';

const SchedulePage: React.FC = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [isEditOverrideOpen, setIsEditOverrideOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRowProps | null>(null);
  const [editingOverride, setEditingOverride] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [overrideToDelete, setOverrideToDelete] = useState<string | null>(null);

  const { doctors, loading, error } = useDoctors();
  const { assistants } = useAssistants();
  const {
    schedules,
    loading: scheduleLoading,
    error: scheduleError,
    setError: setScheduleError,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  } = useSchedule();

  // Filter doctors based on user role
  const getFilteredDoctors = () => {
    if (!isAuthenticated || !currentUser) return doctors;

    if (currentUser.role === 'doctor') {
      // Doctor sees only themselves
      return doctors.filter(doctor => doctor.userId === currentUser.id);
    } else if (currentUser.role === 'assistant') {
      // Assistant sees only their assigned doctors
      const assistant = assistants.find(a => a.userId === currentUser.id);
      if (assistant && assistant.assignedDoctors) {
        return doctors.filter(doctor => assistant.assignedDoctors.includes(doctor.id));
      }
      return []; // No assigned doctors
    }

    // Admin sees all doctors
    return doctors;
  };

  const {
    overrides,
    loading: overridesLoading,
    error: overridesError,
    setError: setOverridesError,
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride
  } = useScheduleOverrides();

  // Show error messages from hooks as toast
  useEffect(() => {
    if (error) {
      toast.error(`❌ ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (scheduleError) {
      toast.error(`❌ ${scheduleError}`);
    }
  }, [scheduleError]);

  useEffect(() => {
    if (overridesError) {
      toast.error(`❌ ${overridesError}`);
    }
  }, [overridesError]);

  // Auto-select first doctor from the FILTERED list (respect role)
  useEffect(() => {
    const filtered = getFilteredDoctors();
    if (!selectedDoctor && filtered.length > 0) {
      setSelectedDoctor(filtered[0].id);
    }
  }, [doctors, assistants, currentUser, isAuthenticated, selectedDoctor]);

  // Ensure selectedDoctor always remains within the filtered list
  useEffect(() => {
    const filtered = getFilteredDoctors();
    const stillValid = filtered.some(d => d.id === selectedDoctor);
    if (selectedDoctor && !stillValid) {
      setSelectedDoctor(filtered[0]?.id || '');
    }
  }, [doctors, assistants, currentUser, isAuthenticated, selectedDoctor]);

  // Fetch schedules and overrides when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedules(selectedDoctor);
      fetchOverrides(selectedDoctor);
    }
  }, [selectedDoctor, fetchSchedules, fetchOverrides]);

  // Get doctor names for display (filtered by role)
  const doctorNames = getFilteredDoctors().map(doctor => ({
    id: doctor.id,
    name: doctor.user?.name || 'Unknown Doctor'
  }));

  // Convert backend schedule data to frontend format
  const getWeeklySchedule = (): ScheduleRowProps[] => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return days.map((day, index) => {
      const schedule = schedules.find(s => s.dayOfWeek === index);

      if (schedule && schedule.isActive) {
        return {
          day,
          timeRange: `${schedule.startTime} - ${schedule.endTime}`,
          slotDuration: (schedule as any).slotDuration || '10 min slots',
          status: 'active' as const,
          scheduleId: schedule.id,
        };
      } else {
        return {
          day,
          status: 'off' as const,
        };
      }
    });
  };

  const weeklySchedule = getWeeklySchedule();

  // Helper function to convert startTime/endTime to session display name
  const getSessionDisplayName = (startTime?: string, endTime?: string): string => {
    if (!startTime || !endTime) {
      return 'Both Sessions';
    }

    const [hours] = startTime.split(':').map(Number);

    // Morning session typically starts before 13:00 (1 PM)
    // Evening session typically starts at or after 13:00 (1 PM)
    if (hours < 13) {
      return 'Morning Session';
    } else {
      return 'Evening Session';
    }
  };

  // Convert backend override data to frontend format
  const getScheduleOverrides = (): ScheduleOverrideCardProps[] => {
    // Sort overrides by date (ascending)
    const sortedOverrides = [...overrides].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sortedOverrides.map(override => ({
      id: override.id,
      title: override.reason,
      date: new Date(override.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      timeRange: getSessionDisplayName(override.startTime, override.endTime),
      type: override.type === 'holiday' ? 'holiday' : 'special-event',
    }));
  };

  const scheduleOverrides = getScheduleOverrides();

  const handleEditSchedule = (day: string) => {
    const schedule = weeklySchedule.find(s => s.day === day);
    if (schedule) {
      setEditingSchedule(schedule);
      setIsEditScheduleOpen(true);
    }
  };

  // Helper function to convert startTime/endTime to session
  const timeRangeToSession = (startTime?: string, endTime?: string): 'morning' | 'evening' | 'both' => {
    if (!startTime || !endTime) {
      return 'both';
    }

    const [hours] = startTime.split(':').map(Number);

    // Morning session typically starts before 13:00 (1 PM)
    // Evening session typically starts at or after 13:00 (1 PM)
    if (hours < 13) {
      return 'morning';
    } else {
      return 'evening';
    }
  };

  // Helper function to convert session to startTime/endTime
  const sessionToTimeRange = (session: 'morning' | 'evening' | 'both'): { startTime?: string; endTime?: string } => {
    switch (session) {
      case 'morning':
        return { startTime: '09:00', endTime: '12:00' };
      case 'evening':
        return { startTime: '14:00', endTime: '18:00' };
      case 'both':
      default:
        return { startTime: undefined, endTime: undefined };
    }
  };

  const handleEditOverride = (id: string) => {
    const override = overrides.find(o => o.id === id);
    if (override) {
      const session = timeRangeToSession(override.startTime, override.endTime);

      // Map backend type to UI type
      // Use displayType if available (stored when creating), otherwise infer from backend type
      let uiType: 'special-event' | 'holiday' | 'extended-hours';
      if ((override as any).displayType) {
        // Use stored displayType for accurate mapping
        uiType = (override as any).displayType;
      } else {
        // Fallback: map backend type to UI type
        if (override.type === 'holiday') {
          uiType = 'holiday';
        } else if (override.type === 'extended_hours') {
          // Default to 'extended-hours' if no displayType (for backward compatibility)
          // But ideally displayType should be set
          uiType = 'extended-hours';
        } else {
          uiType = 'special-event';
        }
      }

      setEditingOverride({
        id: override.id,
        title: override.reason,
        date: override.date.split('T')[0], // Convert to YYYY-MM-DD format
        session,
        type: uiType,
        description: (override as any).description || '', // Load description from override
        doctorId: override.doctorId || selectedDoctor, // Use doctorId from override or selected doctor
      });
      setIsEditOverrideOpen(true);
    }
  };

  const handleDeleteOverride = (id: string) => {
    if (!selectedDoctor) {
      toast.error('❌ Please select a doctor first');
      return;
    }
    setOverrideToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!overrideToDelete || !selectedDoctor) return;

    setActionLoading(true);
    setOverridesError(null);

    try {
      const success = await deleteOverride(selectedDoctor, overrideToDelete);

      if (success) {
        toast.success('✅ Schedule override deleted successfully');
        setDeleteDialogOpen(false);
        setOverrideToDelete(null);
      } else {
        toast.error('❌ Failed to delete schedule override');
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddOverride = () => {
    setIsAddOverrideOpen(true);
  };

  const handleSaveEditOverride = async (data: { id: string; title: string; date: string; session: 'morning' | 'evening' | 'both'; type: 'special-event' | 'holiday' | 'extended-hours'; description?: string; doctorId?: string }) => {
    // Use doctorId from data if provided (admin), otherwise use selectedDoctor (doctor/assistant)
    const doctorIdToUse = data.doctorId || selectedDoctor;

    if (!doctorIdToUse) {
      toast.error('❌ Please select a doctor first');
      return;
    }

    setActionLoading(true);
    setOverridesError(null);

    try {
      // Map UI types to backend types
      const overrideType = data.type === 'special-event' || data.type === 'extended-hours'
        ? 'extended_hours'
        : data.type === 'holiday'
          ? 'holiday'
          : 'extended_hours'; // Default fallback

      // If switching to "both" sessions during edit
      if (data.session === 'both') {
        const overridesOnDate = overrides.filter(o => o.doctorId === doctorIdToUse && o.date.split('T')[0] === data.date);

        let existingMorning: ScheduleOverride | undefined = overridesOnDate.find(o => {
          if (!o.startTime) return false;
          const [h] = o.startTime.split(':').map(Number);
          return h < 13;
        });

        let existingEvening: ScheduleOverride | undefined = overridesOnDate.find(o => {
          if (!o.startTime) return false;
          const [h] = o.startTime.split(':').map(Number);
          return h >= 13;
        });

        // Slot Assignment Logic:
        // We want to ensure we have exactly one Morning and one Evening override with the new details.

        // 1. Handle Morning Slot
        let morningSuccess = false;
        if (existingMorning) {
          // Update existing Morning override
          morningSuccess = await updateOverride(doctorIdToUse, existingMorning.id, {
            date: data.date,
            startTime: '09:00',
            endTime: '12:00',
            reason: data.title,
            type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
            description: data.description || '',
            displayType: data.type,
          });
        } else {
          // No morning exists. Can we use data.id?
          // Only use data.id if it's NOT the evening override we found later (though evening check is independent)
          // Strict check: if data.id is NOT existingEvening's ID, we can repurpose it for Morning.
          // If data.id IS existingEvening's ID, we should let Evening keep it and create new Morning.

          if (data.id !== existingEvening?.id) {
            // Repurpose data.id for Morning
            morningSuccess = await updateOverride(doctorIdToUse, data.id, {
              date: data.date,
              startTime: '09:00',
              endTime: '12:00',
              reason: data.title,
              type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
              description: data.description || '',
              displayType: data.type,
            });
          } else {
            // data.id is busy being Evening. Create new Morning.
            morningSuccess = await createOverride(doctorIdToUse, {
              date: data.date,
              startTime: '09:00',
              endTime: '12:00',
              reason: data.title,
              type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
              description: data.description || '',
              displayType: data.type,
            });
          }
        }

        // 2. Handle Evening Slot
        let eveningSuccess = false;
        if (existingEvening) {
          // Update existing Evening override
          eveningSuccess = await updateOverride(doctorIdToUse, existingEvening.id, {
            date: data.date,
            startTime: '14:00',
            endTime: '18:00',
            reason: data.title,
            type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
            description: data.description || '',
            displayType: data.type,
          });
        } else {
          // No evening exists. Can we use data.id?
          // Use data.id if we didn't use it for Morning (check if existingMorning was found, meaning data.id wasn't consumed for M unless data.id == existingMorning.id)
          // Basically: if data.id wasn't already updated as Morning in step 1.

          // Simpler: If data.id !== existingMorning?.id AND we haven't just repurposed it above.
          // If we repurposed data.id above (because existingMorning was null and data.id != existingEvening?.id), then we can't use it here.

          let usedForMorning = false;
          if (existingMorning) {
            usedForMorning = (data.id === existingMorning.id);
          } else {
            // If no morning exists, we used data.id for morning IF we didn't save it for evening.
            // But we are deciding that NOW.
            // If data.id is NOT existingEvening's ID, we use it for Morning.
            if (existingEvening) {
              usedForMorning = data.id !== (existingEvening as any).id;
            } else {
              usedForMorning = true;
            }
          }

          if (!usedForMorning) {
            // Repurpose data.id for Evening
            eveningSuccess = await updateOverride(doctorIdToUse, data.id, {
              date: data.date,
              startTime: '14:00',
              endTime: '18:00',
              reason: data.title,
              type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
              description: data.description || '',
              displayType: data.type,
            });
          } else {
            // Create new Evening
            eveningSuccess = await createOverride(doctorIdToUse, {
              date: data.date,
              startTime: '14:00',
              endTime: '18:00',
              reason: data.title,
              type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
              description: data.description || '',
              displayType: data.type,
            });
          }
        }

        if (morningSuccess && eveningSuccess) {
          toast.success('✅ Schedule updated to cover both sessions');
          setIsEditOverrideOpen(false);
          setEditingOverride(null);
          // Explicitly refresh to ensure UI sees the correct cards
          if (doctorIdToUse === selectedDoctor) {
            await fetchOverrides(selectedDoctor);
          }
        } else {
          toast.error('❌ Failed to update schedule for both sessions');
        }
      } else {
        // Normal update for single session
        const { startTime, endTime } = sessionToTimeRange(data.session);

        // Safety check
        if (!startTime || !endTime) {
          toast.error('❌ Invalid session time range');
          setActionLoading(false);
          return;
        }

        const success = await updateOverride(doctorIdToUse, data.id, {
          date: data.date,
          startTime,
          endTime,
          reason: data.title,
          type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
          description: data.description || '',
          displayType: data.type, // Store the original UI type for correct mapping when editing
        });

        if (success) {
          toast.success('✅ Schedule override updated successfully');
          setIsEditOverrideOpen(false);
          setEditingOverride(null);
          // Refresh the selected doctor's overrides
          if (doctorIdToUse === selectedDoctor) {
            await fetchOverrides(selectedDoctor);
          }
        } else {
          toast.error('❌ Failed to update schedule override');
        }
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveOverride = async (data: { title: string; date: string; session: 'morning' | 'evening' | 'both'; type: 'special-event' | 'holiday' | 'extended-hours'; description?: string; doctorId?: string }) => {
    // Use doctorId from data if provided (admin), otherwise use selectedDoctor (doctor/assistant)
    const doctorIdToUse = data.doctorId || selectedDoctor;

    if (!doctorIdToUse) {
      toast.error('❌ Please select a doctor first');
      return;
    }

    // Check for duplicate overrides
    const normalizedTargetDate = data.date.trim();

    const overridesOnDate = overrides.filter(o => {
      // Robust date match: Handle ISO 'T' and ensure trimming
      const oDate = (o.date || '').split('T')[0].trim();

      // Doctor check: If stored override has doctorId, match it. 
      // If missing, assume it belongs to the currently loaded list (selectedDoctor).
      const oDoctorId = o.doctorId;
      const isDoctorMatch = oDoctorId ? oDoctorId === doctorIdToUse : true;

      return isDoctorMatch && oDate === normalizedTargetDate;
    });

    let conflict = false;

    if (data.session === 'both') {
      // If adding "Both", conflict if ANY override exists (Morning OR Evening)
      if (overridesOnDate.length > 0) conflict = true;
    } else if (data.session === 'morning') {
      // Conflict if any existing override is Morning (start < 13)
      const hasMorning = overridesOnDate.some(o => {
        if (!o.startTime) return false;
        // Parse "09:00" -> 9. Use base 10.
        const h = parseInt(o.startTime.split(':')[0], 10);
        return h < 13;
      });
      if (hasMorning) conflict = true;
    } else if (data.session === 'evening') {
      // Conflict if any existing override is Evening (start >= 13)
      const hasEvening = overridesOnDate.some(o => {
        if (!o.startTime) return false;
        const h = parseInt(o.startTime.split(':')[0], 10);
        return h >= 13;
      });
      if (hasEvening) conflict = true;
    }

    if (conflict) {
      toast.error('❌ already Schedule in this date');
      return;
    }

    setActionLoading(true);
    setOverridesError(null);

    try {
      // Map UI types to backend types
      const overrideType = data.type === 'special-event' || data.type === 'extended-hours'
        ? 'extended_hours'
        : data.type === 'holiday'
          ? 'holiday'
          : 'extended_hours'; // Default fallback

      // If "both" is selected, create two separate overrides (morning and evening)
      if (data.session === 'both') {
        // Create morning session override
        const morningSuccess = await createOverride(doctorIdToUse, {
          date: data.date,
          startTime: '09:00',
          endTime: '12:00',
          reason: data.title,
          type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
          description: data.description || '',
          displayType: data.type,
        });

        // Create evening session override
        const eveningSuccess = await createOverride(doctorIdToUse, {
          date: data.date,
          startTime: '14:00',
          endTime: '18:00',
          reason: data.title,
          type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
          description: data.description || '',
          displayType: data.type,
        });

        if (morningSuccess && eveningSuccess) {
          toast.success('✅ Schedule override saved successfully for both sessions');
          setIsAddOverrideOpen(false);
          // Refresh the selected doctor's overrides if it matches
          if (doctorIdToUse === selectedDoctor) {
            await fetchOverrides(selectedDoctor);
          } else {
            // If admin selected a different doctor, switch to that doctor's view
            setSelectedDoctor(doctorIdToUse);
          }
        } else {
          toast.error('❌ Failed to save schedule override for one or both sessions');
        }
      } else {
        // For single session (morning or evening)
        const { startTime, endTime } = sessionToTimeRange(data.session);

        const success = await createOverride(doctorIdToUse, {
          date: data.date,
          startTime,
          endTime,
          reason: data.title,
          type: overrideType as 'holiday' | 'extended_hours' | 'reduced_hours',
          description: data.description || '',
          displayType: data.type, // Store the original UI type for correct mapping when editing
        });

        if (success) {
          toast.success('✅ Schedule override saved successfully');
          setIsAddOverrideOpen(false);
          // Refresh the selected doctor's overrides if it matches
          if (doctorIdToUse === selectedDoctor) {
            await fetchOverrides(selectedDoctor);
          } else {
            // If admin selected a different doctor, switch to that doctor's view
            setSelectedDoctor(doctorIdToUse);
          }
        } else {
          toast.error('❌ Failed to save schedule override');
        }
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSchedule = async (data: { day: string; timeRange?: string; slotDuration?: string; status: 'active' | 'off' }) => {
    if (!selectedDoctor) {
      toast.error('❌ Please select a doctor first');
      return;
    }

    setActionLoading(true);
    setScheduleError(null);

    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = days.indexOf(data.day);

      if (dayIndex === -1) {
        throw new Error('Invalid day selection');
      }

      const existingSchedule = schedules.find(s => s.dayOfWeek === dayIndex);

      if (data.status === 'off') {
        // If setting to off, delete the schedule if it exists
        if (existingSchedule) {
          const success = await deleteSchedule(selectedDoctor, existingSchedule.id);
          if (success) {
            toast.success('✅ Schedule updated successfully');
            await fetchSchedules(selectedDoctor);
          } else {
            toast.error('❌ Failed to update schedule');
          }
        } else {
          // Already off, nothing to do but close dialog
          setIsEditScheduleOpen(false);
          setEditingSchedule(null);
          return;
        }
      } else {
        // If setting to active, create or update schedule
        if (!data.timeRange || !data.timeRange.includes('-')) {
          toast.error('❌ Please provide a valid time range for active schedule');
          setActionLoading(false);
          return;
        }

        if (!data.slotDuration) {
          toast.error('❌ Please select a slot duration');
          setActionLoading(false);
          return;
        }

        // Robust time parsing
        const timeParts = data.timeRange.split('-').map(part => part.trim());
        if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
          toast.error('❌ Invalid time format. Please set both start and end times.');
          setActionLoading(false);
          return;
        }

        const [startTime, endTime] = timeParts;

        const scheduleData = {
          dayOfWeek: dayIndex,
          startTime,
          endTime,
          slotDuration: data.slotDuration,
        };

        if (existingSchedule) {
          // Update existing schedule
          const success = await updateSchedule(selectedDoctor, existingSchedule.id, scheduleData);

          if (success) {
            toast.success('✅ Schedule updated successfully');
            await fetchSchedules(selectedDoctor);
          } else {
            toast.error('❌ Failed to update schedule');
          }
        } else {
          // Create new schedule
          const success = await createSchedule(selectedDoctor, scheduleData);

          if (success) {
            toast.success('✅ Schedule created successfully');
            await fetchSchedules(selectedDoctor);
          } else {
            toast.error('❌ Failed to create schedule');
          }
        }
      }

      setIsEditScheduleOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error('Error saving schedule:', err);
      const errorMessage = apiUtils.handleError(err);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (scheduleLoading && selectedDoctor) {
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

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentUser?.role === 'doctor'
                  ? 'Your Schedule'
                  : currentUser?.role === 'assistant'
                    ? 'Assigned Doctors Schedule'
                    : 'Schedule'
                }
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.role === 'doctor'
                  ? 'Manage your schedule and slot durations'
                  : currentUser?.role === 'assistant'
                    ? 'Manage schedules for your assigned doctors'
                    : 'Manage doctor schedules and slot durations'
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
              onClick={handleAddOverride}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Holidays
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


        {/* Schedule Overrides Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Schedule Holidays
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
                  onDelete={handleDeleteOverride}
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
        showDoctorSelection={currentUser?.role === 'admin'}
        doctors={currentUser?.role === 'admin' ? doctorNames : []}
        selectedDoctorId={selectedDoctor}
      />

      <EditOverrideDialog
        isOpen={isEditOverrideOpen}
        onClose={() => {
          setIsEditOverrideOpen(false);
          setEditingOverride(null);
        }}
        onSave={handleSaveEditOverride}
        initialData={editingOverride || undefined}
        showDoctorSelection={currentUser?.role === 'admin'}
        doctors={currentUser?.role === 'admin' ? doctorNames : []}
        selectedDoctorId={selectedDoctor}
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
      {/* Delete Confirmation Dialog */}
      <DeleteOverrideDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setOverrideToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Schedule Override"
        message="Are you sure you want to delete this schedule override? It will be removed from the doctor's calendar."
        itemName={overrides.find(o => o.id === overrideToDelete)?.reason || 'Schedule Override'}
        loading={actionLoading}
      />
    </div>
  );
};

export default SchedulePage;