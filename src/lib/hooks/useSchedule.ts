import { useState, useEffect, useCallback } from 'react';
import { scheduleApi, DoctorSchedule, apiUtils } from '../api';

export interface UseScheduleReturn {
  schedules: DoctorSchedule[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchSchedules: (doctorId: string) => Promise<void>;
  createSchedule: (doctorId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => Promise<boolean>;
  updateSchedule: (doctorId: string, scheduleId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => Promise<boolean>;
  deleteSchedule: (doctorId: string, scheduleId: string) => Promise<boolean>;
  refreshSchedules: (doctorId: string) => Promise<void>;
}

export const useSchedule = (): UseScheduleReturn => {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedules for a doctor
  const fetchSchedules = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.getDoctorSchedule(doctorId);
      
      if (response.success && response.data) {
        setSchedules(response.data);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create schedule
  const createSchedule = useCallback(async (doctorId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.createSchedule(doctorId, data);
      
      if (response.success) {
        await fetchSchedules(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create schedule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  // Update schedule
  const updateSchedule = useCallback(async (doctorId: string, scheduleId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.updateSchedule(doctorId, scheduleId, data);
      
      if (response.success) {
        await fetchSchedules(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update schedule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  // Delete schedule
  const deleteSchedule = useCallback(async (doctorId: string, scheduleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.deleteSchedule(doctorId, scheduleId);
      
      if (response.success) {
        await fetchSchedules(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to delete schedule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  // Refresh schedules
  const refreshSchedules = useCallback(async (doctorId: string) => {
    await fetchSchedules(doctorId);
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    setError,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules,
  };
};
