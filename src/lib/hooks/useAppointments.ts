import { useState, useEffect, useCallback } from 'react';
import { appointmentApi, ApiError, Appointment, AppointmentStats, apiUtils } from '../api';

export interface UseAppointmentsReturn {
  appointments: Appointment[];
  stats: AppointmentStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchAppointments: (page?: number, startDate?: string, endDate?: string) => Promise<void>;
  fetchTodayAppointments: () => Promise<void>;
  fetchAppointmentStats: () => Promise<void>;
  createAppointment: (data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    notes?: string;
    source?: 'web' | 'assistant' | 'walk_in' | 'phone';
  }) => Promise<boolean>;
  updateAppointment: (id: string, data: Partial<{
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    notes: string;
    source: 'web' | 'assistant' | 'walk_in' | 'phone';
  }>) => Promise<boolean>;
  cancelAppointment: (id: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<boolean>;
  completeAppointment: (id: string) => Promise<boolean>;
  markNoShow: (id: string) => Promise<boolean>;
  getAvailableSlots: (doctorId: string, date: string) => Promise<string[]>;
  refreshAppointments: () => Promise<void>;
}

export const useAppointments = (): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch appointments by date range
  const fetchAppointments = useCallback(async (page = 1, startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (startDate && endDate) {
        response = await appointmentApi.getByDateRange(startDate, endDate, page, pagination.limit);
      } else {
        // Default to today's appointments if no date range provided
        response = await appointmentApi.getToday();
        if (response.success && response.data) {
          setAppointments(response.data);
          setPagination({
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
          });
        }
        return;
      }
      
      if (response.success && response.data) {
        setAppointments(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Fetch today's appointments
  const fetchTodayAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.getToday();
      
      if (response.success && response.data) {
        setAppointments(response.data);
        setPagination({
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
        });
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch today\'s appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch appointment stats
  const fetchAppointmentStats = useCallback(async () => {
    try {
      const response = await appointmentApi.getStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointment stats:', err);
    }
  }, []);

  // Create appointment
  const createAppointment = useCallback(async (data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    notes?: string;
    source?: 'web' | 'assistant' | 'walk_in' | 'phone';
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.create(data);
      
      if (response.success) {
        await fetchTodayAppointments();
        await fetchAppointmentStats();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create appointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments, fetchAppointmentStats]);

  // Update appointment
  const updateAppointment = useCallback(async (id: string, data: Partial<{
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    notes: string;
    source: 'web' | 'assistant' | 'walk_in' | 'phone';
  }>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.update(id, data);
      
      if (response.success) {
        await fetchTodayAppointments();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update appointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments]);

  // Cancel appointment
  const cancelAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.cancel(id);
      
      if (response.success) {
        await fetchTodayAppointments();
        await fetchAppointmentStats();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to cancel appointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments, fetchAppointmentStats]);

  // Reschedule appointment
  const rescheduleAppointment = useCallback(async (id: string, newDate: string, newTime: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.reschedule(id, newDate, newTime);
      
      if (response.success) {
        await fetchTodayAppointments();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to reschedule appointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments]);

  // Complete appointment
  const completeAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.complete(id);
      
      if (response.success) {
        await fetchTodayAppointments();
        await fetchAppointmentStats();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to complete appointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments, fetchAppointmentStats]);

  // Mark as no-show
  const markNoShow = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentApi.noShow(id);
      
      if (response.success) {
        await fetchTodayAppointments();
        await fetchAppointmentStats();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to mark as no-show:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAppointments, fetchAppointmentStats]);

  // Get available slots
  const getAvailableSlots = useCallback(async (doctorId: string, date: string): Promise<string[]> => {
    try {
      const response = await appointmentApi.getAvailableSlots(doctorId, date);
      
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      return [];
    }
  }, []);

  // Refresh appointments
  const refreshAppointments = useCallback(async () => {
    // Load appointments for the current week instead of just today
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of week (Saturday)
    
    await fetchAppointments(1, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]);
    await fetchAppointmentStats();
  }, [fetchAppointments, fetchAppointmentStats]);

  // Load data on mount
  useEffect(() => {
    // Load appointments for the current week instead of just today
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of week (Saturday)
    
    fetchAppointments(1, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]);
    fetchAppointmentStats();
  }, []); // Empty dependency array to run only once on mount

  return {
    appointments,
    stats,
    loading,
    error,
    pagination,
    searchQuery,
    setSearchQuery,
    fetchAppointments,
    fetchTodayAppointments,
    fetchAppointmentStats,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    rescheduleAppointment,
    completeAppointment,
    markNoShow,
    getAvailableSlots,
    refreshAppointments,
  };
};
