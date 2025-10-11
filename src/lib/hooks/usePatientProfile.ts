import { useState, useEffect, useCallback } from 'react';
import { patientDashboardApi, Patient } from '../api';
import { usePatientAuth } from '../contexts/PatientAuthContext';

interface UsePatientProfileReturn {
  profile: Patient | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  updateProfile: (updates: Partial<Patient>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setIsEditing: (editing: boolean) => void;
}

export function usePatientProfile(): UsePatientProfileReturn {
  const { patient, isAuthenticated, refreshPatient } = usePatientAuth();
  const [profile, setProfile] = useState<Patient | null>(patient);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update local profile when patient changes
  useEffect(() => {
    setProfile(patient);
  }, [patient]);

  // Fetch profile from API
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view your profile');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientDashboardApi.getPatientProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
        // Also refresh the patient data in auth context
        await refreshPatient();
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshPatient]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Patient>) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to update your profile');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientDashboardApi.updatePatientProfile(updates);
      
      if (response.success && response.data) {
        setProfile(response.data);
        setIsEditing(false);
        // Refresh patient data in auth context
        await refreshPatient();
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshPatient]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !profile) {
      refreshProfile();
    }
  }, [isAuthenticated, profile, refreshProfile]);

  return {
    profile,
    isLoading,
    error,
    isEditing,
    updateProfile,
    refreshProfile,
    setIsEditing,
  };
}

