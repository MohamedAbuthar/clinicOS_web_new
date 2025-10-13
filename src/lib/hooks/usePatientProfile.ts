import { useState, useEffect, useCallback } from 'react';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { getPatientProfile, updatePatientProfile } from '../firebase/firestore';
import { PatientProfile } from '../firebase/auth';

interface UsePatientProfileReturn {
  profile: PatientProfile | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  updateProfile: (updates: Partial<PatientProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setIsEditing: (editing: boolean) => void;
}

export function usePatientProfile(): UsePatientProfileReturn {
  const { patient, isAuthenticated, refreshPatient, firebaseUser } = usePatientAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(patient);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update local profile when patient changes
  useEffect(() => {
    setProfile(patient);
  }, [patient]);

  // Fetch profile from Firebase Firestore
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !firebaseUser) {
      setError('Please log in to view your profile');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await getPatientProfile(firebaseUser.uid);
      
      if (result.success && result.data) {
        setProfile(result.data as PatientProfile);
        // Also refresh the patient data in auth context
        await refreshPatient();
      } else {
        throw new Error(result.error || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, firebaseUser, refreshPatient]);

  // Update profile in Firebase Firestore
  const updateProfile = useCallback(async (updates: Partial<PatientProfile>) => {
    if (!isAuthenticated || !firebaseUser) {
      throw new Error('Please log in to update your profile');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await updatePatientProfile(firebaseUser.uid, updates);
      
      if (result.success) {
        // Refresh to get updated data
        await refreshProfile();
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, firebaseUser, refreshProfile]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !profile && firebaseUser) {
      refreshProfile();
    }
  }, [isAuthenticated, profile, firebaseUser, refreshProfile]);

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

