import { useState, useEffect, useCallback } from 'react';
import { patientDoctorApi, ApiError, Doctor, apiUtils } from '../api';

export interface UsePatientDoctorsReturn {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  fetchDoctors: () => Promise<void>;
  refreshDoctors: () => Promise<void>;
}

export const usePatientDoctors = (): UsePatientDoctorsReturn => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available doctors for patient booking - using patient API (no auth)
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use patient doctor API that works without authentication
      const response = await patientDoctorApi.getAvailableDoctors();
      
      if (response.success && response.data) {
        setDoctors(response.data);
      } else {
        setError(response.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh doctors
  const refreshDoctors = useCallback(async () => {
    await fetchDoctors();
  }, [fetchDoctors]);

  // Load data on mount
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    refreshDoctors,
  };
};
