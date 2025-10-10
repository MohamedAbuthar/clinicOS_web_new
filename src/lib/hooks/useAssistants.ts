import { useState, useEffect, useCallback } from 'react';
import { assistantApi, doctorApi, ApiError, Assistant, Doctor, apiUtils } from '../api';

export interface AssistantWithUser extends Assistant {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
  assignedDoctorNames: string[];
}

export interface UseAssistantsReturn {
  assistants: AssistantWithUser[];
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchAssistants: (page?: number) => Promise<void>;
  createAssistant: (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    assignedDoctors: string[];
  }) => Promise<boolean>;
  updateAssistant: (id: string, data: Partial<{
    assignedDoctors: string[];
    isActive: boolean;
    user?: {
      name: string;
      email: string;
      phone: string;
    };
  }>) => Promise<boolean>;
  deleteAssistant: (id: string) => Promise<boolean>;
  refreshAssistants: () => Promise<void>;
}

export const useAssistants = (): UseAssistantsReturn => {
  const [assistants, setAssistants] = useState<AssistantWithUser[]>([]);
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

  // Fetch doctors for assignment dropdown
  const fetchDoctors = useCallback(async () => {
    try {
      const response = await doctorApi.getAll(1, 100); // Get all doctors
      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  }, []);

  // Fetch assistants
  const fetchAssistants = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantApi.getAll(page, pagination.limit);
      
      if (response.success && response.data) {
        // Transform assistants to include user data and doctor names
        const assistantsWithUser: AssistantWithUser[] = response.data.map(assistant => {
          // Find assigned doctor names
          const assignedDoctorNames = assistant.assignedDoctors
            .map(doctorId => {
              const doctor = doctors.find(d => d.id === doctorId);
              return doctor ? `${doctor.user?.name || 'Unknown'} - ${doctor.specialty}` : 'Unknown Doctor';
            });

          return {
            ...assistant,
            user: assistant.user || {
              id: assistant.userId,
              name: 'Loading...',
              email: 'Loading...',
              phone: 'Loading...',
              isActive: assistant.isActive,
            },
            assignedDoctorNames,
          };
        });

        setAssistants(assistantsWithUser);
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch assistants:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Create assistant
  const createAssistant = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    assignedDoctors: string[];
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantApi.create(data);
      
      if (response.success) {
        await fetchAssistants(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to create assistant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants, pagination.page]);

  // Update assistant
  const updateAssistant = useCallback(async (id: string, data: Partial<{
    assignedDoctors: string[];
    isActive: boolean;
    user?: {
      name: string;
      email: string;
      phone: string;
    };
  }>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantApi.update(id, data);
      
      if (response.success) {
        await fetchAssistants(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update assistant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants, pagination.page]);

  // Delete assistant
  const deleteAssistant = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantApi.delete(id);
      
      if (response.success) {
        await fetchAssistants(pagination.page);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to delete assistant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants, pagination.page]);

  // Refresh assistants
  const refreshAssistants = useCallback(async () => {
    await fetchAssistants(pagination.page);
  }, [fetchAssistants, pagination.page]);

  // Load data on mount
  useEffect(() => {
    fetchDoctors();
    fetchAssistants();
  }, []); // Empty dependency array to run only once on mount

  return {
    assistants,
    doctors,
    loading,
    error,
    setError,
    pagination,
    searchQuery,
    setSearchQuery,
    fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    refreshAssistants,
  };
};
