import { useState, useEffect, useCallback } from 'react';
import { patientApi, ApiError, Patient, apiUtils } from '../api';

export interface UsePatientsReturn {
  patients: Patient[];
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
  fetchPatients: (page?: number, search?: string) => Promise<void>;
  createPatient: (data: {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address?: string;
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies?: string;
    chronicConditions?: string;
    familyId?: string;
  }) => Promise<boolean>;
  updatePatient: (id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    bloodGroup: string;
    height: number;
    weight: number;
    allergies: string;
    chronicConditions: string;
    familyId: string;
    isActive: boolean;
  }>) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  getPatientById: (id: string) => Promise<Patient | null>;
  getPatientsByFamily: (familyId: string) => Promise<Patient[]>;
  refreshPatients: () => Promise<void>;
}

export const usePatients = (): UsePatientsReturn => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients
  const fetchPatients = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientApi.getAll(page, pagination.limit, search);
      
      if (response.success && response.data) {
        setPatients(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Create patient
  const createPatient = useCallback(async (data: {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address?: string;
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies?: string;
    chronicConditions?: string;
    familyId?: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientApi.create(data);
      
      if (response.success) {
        await fetchPatients(pagination.page, searchQuery);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, pagination.page, searchQuery]);

  // Update patient
  const updatePatient = useCallback(async (id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    bloodGroup: string;
    height: number;
    weight: number;
    allergies: string;
    chronicConditions: string;
    familyId: string;
    isActive: boolean;
  }>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientApi.update(id, data);
      
      if (response.success) {
        await fetchPatients(pagination.page, searchQuery);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, pagination.page, searchQuery]);

  // Delete patient
  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientApi.delete(id);
      
      if (response.success) {
        await fetchPatients(pagination.page, searchQuery);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to delete patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients, pagination.page, searchQuery]);

  // Get patient by ID
  const getPatientById = useCallback(async (id: string): Promise<Patient | null> => {
    try {
      const response = await patientApi.getById(id);
      
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch patient:', err);
      return null;
    }
  }, []);

  // Get patients by family
  const getPatientsByFamily = useCallback(async (familyId: string): Promise<Patient[]> => {
    try {
      const response = await patientApi.getByFamily(familyId);
      
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch family patients:', err);
      return [];
    }
  }, []);

  // Refresh patients
  const refreshPatients = useCallback(async () => {
    await fetchPatients(pagination.page, searchQuery);
  }, [fetchPatients, pagination.page, searchQuery]);

  // Load data on mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    pagination,
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
