import { useState, useEffect, useCallback } from 'react';
import { getAllDoctors } from '../firebase/firestore';

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationDuration: number;
  isActive: boolean;
  status?: 'active' | 'break' | 'offline';
  schedule?: string;
  startTime?: string;
  endTime?: string;
  morningStartTime?: string;
  morningEndTime?: string;
  eveningStartTime?: string;
  eveningEndTime?: string;
  availableSlots?: string[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

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

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('usePatientDoctors: Fetching doctors...');
      const result = await getAllDoctors();
      console.log('usePatientDoctors: Result:', result);
      
      if (result.success && result.data) {
        console.log('usePatientDoctors: Setting doctors:', result.data.length);
        setDoctors(result.data as Doctor[]);
      } else {
        console.error('usePatientDoctors: Error:', result.error);
        setError(result.error || 'Failed to fetch doctors');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDoctors = useCallback(async () => {
    await fetchDoctors();
  }, [fetchDoctors]);

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
