import { useState, useEffect, useCallback } from 'react';
import { doctorApi, ApiError, Doctor, apiUtils } from '../api';

export interface UseDoctorsReturn {
  doctors: Doctor[];
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
  fetchDoctors: (page?: number) => Promise<void>;
  createDoctor: (data: {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
  }) => Promise<boolean>;
  updateDoctor: (id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
    isActive: boolean;
  }>) => Promise<boolean>;
  updateDoctorStatus: (id: string, status: 'active' | 'break' | 'offline') => Promise<boolean>;
  deleteDoctor: (id: string) => Promise<boolean>;
  refreshDoctors: () => Promise<void>;
}

export const useDoctors = (): UseDoctorsReturn => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch doctors
  const fetchDoctors = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await doctorApi.getAll(page, pagination.limit);
      
      if (response.success && response.data) {
        // The API now returns doctors with user data already included
        setDoctors(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Create doctor
  const createDoctor = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await doctorApi.create(data);
      
      if (response.success) {
        await fetchDoctors(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create doctor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, pagination.page]);

  // Update doctor
  const updateDoctor = useCallback(async (id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
    isActive: boolean;
  }>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await doctorApi.update(id, data);
      
      if (response.success) {
        await fetchDoctors(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update doctor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, pagination.page]);

  // Update doctor status
  const updateDoctorStatus = useCallback(async (id: string, status: 'active' | 'break' | 'offline'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await doctorApi.updateStatus(id, status);
      
      if (response.success) {
        await fetchDoctors(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update doctor status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, pagination.page]);

  // Delete doctor
  const deleteDoctor = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await doctorApi.delete(id);
      
      if (response.success) {
        await fetchDoctors(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to delete doctor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, pagination.page]);

  // Refresh doctors
  const refreshDoctors = useCallback(async () => {
    await fetchDoctors(pagination.page);
  }, [fetchDoctors, pagination.page]);

  // Load data on mount
  useEffect(() => {
    fetchDoctors();
  }, []); // Empty dependency array to run only once on mount

  return {
    doctors,
    loading,
    error,
    pagination,
    searchQuery,
    setSearchQuery,
    fetchDoctors,
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor,
    refreshDoctors,
  };
};
