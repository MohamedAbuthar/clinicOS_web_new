import { useState, useEffect, useCallback } from 'react';
import { getAllPatients, getPatientProfile, updatePatientProfile, getFamilyMembers } from '../firebase/firestore';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PatientProfile } from '../firebase/auth';

export interface UsePatientsReturn {
  patients: PatientProfile[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchPatients: (search?: string) => Promise<void>;
  createPatient: (data: any) => Promise<string | null>;
  updatePatient: (id: string, data: any) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  getPatientById: (id: string) => Promise<PatientProfile | null>;
  getPatientsByFamily: (familyId: string) => Promise<PatientProfile[]>;
  refreshPatients: () => Promise<void>;
}

export const usePatients = (): UsePatientsReturn => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllPatients(search);
      if (result.success && result.data) {
        setPatients(result.data as PatientProfile[]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (data: any): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = await addDoc(collection(db, 'patients'), {
        ...data,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchPatients(searchQuery);
      return docRef.id; // Return the created patient's ID
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, searchQuery]);

  const updatePatient = useCallback(async (id: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await updatePatientProfile(id, data);
      if (result.success) {
        await fetchPatients(searchQuery);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, searchQuery]);

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'patients', id));
      await fetchPatients(searchQuery);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, searchQuery]);

  const getPatientById = useCallback(async (id: string): Promise<PatientProfile | null> => {
    try {
      const result = await getPatientProfile(id);
      if (result.success && result.data) {
        return result.data as PatientProfile;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch patient:', err);
      return null;
    }
  }, []);

  const getPatientsByFamily = useCallback(async (familyId: string): Promise<PatientProfile[]> => {
    try {
      const result = await getFamilyMembers(familyId);
      if (result.success && result.data) {
        return result.data as PatientProfile[];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch family patients:', err);
      return [];
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    await fetchPatients(searchQuery);
  }, [fetchPatients, searchQuery]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    getPatientsByFamily,
    refreshPatients,
  };
};
