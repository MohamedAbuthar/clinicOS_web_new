import { useState, useEffect, useCallback } from 'react';
import { scheduleOverrideApi, ScheduleOverride, apiUtils } from '../api';

export interface UseScheduleOverridesReturn {
  overrides: ScheduleOverride[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchOverrides: (doctorId: string) => Promise<void>;
  createOverride: (doctorId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }) => Promise<boolean>;
  updateOverride: (doctorId: string, overrideId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }) => Promise<boolean>;
  deleteOverride: (doctorId: string, overrideId: string) => Promise<boolean>;
  refreshOverrides: (doctorId: string) => Promise<void>;
}

export const useScheduleOverrides = (): UseScheduleOverridesReturn => {
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch overrides for a doctor
  const fetchOverrides = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleOverrideApi.getDoctorOverrides(doctorId);
      
      if (response.success && response.data) {
        setOverrides(response.data);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch schedule overrides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create override
  const createOverride = useCallback(async (doctorId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleOverrideApi.createOverride(doctorId, data);
      
      if (response.success) {
        await fetchOverrides(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create schedule override:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  // Update override
  const updateOverride = useCallback(async (doctorId: string, overrideId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleOverrideApi.updateOverride(doctorId, overrideId, data);
      
      if (response.success) {
        await fetchOverrides(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update schedule override:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  // Delete override
  const deleteOverride = useCallback(async (doctorId: string, overrideId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleOverrideApi.deleteOverride(doctorId, overrideId);
      
      if (response.success) {
        await fetchOverrides(doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to delete schedule override:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  // Refresh overrides
  const refreshOverrides = useCallback(async (doctorId: string) => {
    await fetchOverrides(doctorId);
  }, [fetchOverrides]);

  return {
    overrides,
    loading,
    error,
    setError,
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride,
    refreshOverrides,
  };
};
