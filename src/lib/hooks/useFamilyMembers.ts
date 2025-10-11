import { useState, useEffect, useCallback } from 'react';
import { patientFamilyApi, Patient } from '../api';
import { usePatientAuth } from '../contexts/PatientAuthContext';

interface UseFamilyMembersReturn {
  familyMembers: Patient[];
  isLoading: boolean;
  error: string | null;
  addMember: (memberData: Partial<Patient>) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<Patient>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  getMember: (memberId: string) => Patient | undefined;
}

export function useFamilyMembers(): UseFamilyMembersReturn {
  const { isAuthenticated } = usePatientAuth();
  const [familyMembers, setFamilyMembers] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch family members from API
  const refreshMembers = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view family members');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientFamilyApi.getFamilyMembers();
      
      if (response.success && response.data) {
        setFamilyMembers(response.data);
      } else {
        throw new Error(response.message || 'Failed to load family members');
      }
    } catch (err: any) {
      console.error('Error fetching family members:', err);
      setError(err.message || 'Failed to load family members');
      setFamilyMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Add a new family member
  const addMember = useCallback(async (memberData: Partial<Patient>) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientFamilyApi.addFamilyMember(memberData);
      
      if (response.success && response.data) {
        // Add the new member to the list
        setFamilyMembers(prev => [...prev, response.data as Patient]);
      } else {
        throw new Error(response.message || 'Failed to add family member');
      }
    } catch (err: any) {
      console.error('Error adding family member:', err);
      const errorMessage = err.message || 'Failed to add family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Update a family member
  const updateMember = useCallback(async (memberId: string, updates: Partial<Patient>) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to update family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientFamilyApi.updateFamilyMember(memberId, updates);
      
      if (response.success && response.data) {
        // Update the member in the list
        setFamilyMembers(prev => 
          prev.map(member => member.id === memberId ? response.data as Patient : member)
        );
      } else {
        throw new Error(response.message || 'Failed to update family member');
      }
    } catch (err: any) {
      console.error('Error updating family member:', err);
      const errorMessage = err.message || 'Failed to update family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Delete a family member
  const deleteMember = useCallback(async (memberId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to delete family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await patientFamilyApi.deleteFamilyMember(memberId);
      
      if (response.success) {
        // Remove the member from the list
        setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
      } else {
        throw new Error(response.message || 'Failed to delete family member');
      }
    } catch (err: any) {
      console.error('Error deleting family member:', err);
      const errorMessage = err.message || 'Failed to delete family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Get a specific member
  const getMember = useCallback((memberId: string): Patient | undefined => {
    return familyMembers.find(member => member.id === memberId);
  }, [familyMembers]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshMembers();
    }
  }, [isAuthenticated, refreshMembers]);

  return {
    familyMembers,
    isLoading,
    error,
    addMember,
    updateMember,
    deleteMember,
    refreshMembers,
    getMember,
  };
}

