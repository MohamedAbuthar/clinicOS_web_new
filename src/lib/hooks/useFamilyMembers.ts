import { useState, useEffect, useCallback } from 'react';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { getFamilyMembers, addFamilyMember } from '../firebase/firestore';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PatientProfile } from '../firebase/auth';

interface UseFamilyMembersReturn {
  familyMembers: PatientProfile[];
  isLoading: boolean;
  error: string | null;
  addMember: (memberData: Partial<PatientProfile>) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<PatientProfile>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  getMember: (memberId: string) => PatientProfile | undefined;
}

export function useFamilyMembers(): UseFamilyMembersReturn {
  const { isAuthenticated, patient } = usePatientAuth();
  const [familyMembers, setFamilyMembers] = useState<PatientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = useCallback(async () => {
    if (!isAuthenticated || !patient?.id) {
      console.log('Not authenticated or no patient ID, skipping family members refresh');
      setFamilyMembers([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use patient's own ID as familyId if not set
      const familyId = patient.familyId || patient.id;
      console.log('Loading family members for familyId:', familyId);

      const result = await getFamilyMembers(familyId);
      
      if (result.success && result.data) {
        // Filter out the current patient from family members list
        const members = (result.data as PatientProfile[]).filter(m => m.id !== patient.id);
        setFamilyMembers(members);
        console.log(`✅ Loaded ${members.length} family members`);
      } else {
        console.log('No family members found or error:', result.error);
        setFamilyMembers([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching family members:', err);
      setError(err.message || 'Failed to load family members');
      setFamilyMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, patient]);

  const addMember = useCallback(async (memberData: Partial<PatientProfile>) => {
    if (!isAuthenticated || !patient?.id) {
      throw new Error('Please log in to add family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use patient's own ID as familyId if not set
      const familyId = patient.familyId || patient.id;
      console.log('Adding family member to familyId:', familyId);

      // If patient doesn't have familyId set yet, update it
      if (!patient.familyId) {
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        await updateDoc(doc(db, 'patients', patient.id), {
          familyId: patient.id
        });
      }

      const result = await addFamilyMember(familyId, memberData);
      
      if (result.success) {
        console.log('Family member added successfully');
        // Refresh the family members list
        await refreshMembers();
      } else {
        throw new Error(result.error || 'Failed to add family member');
      }
    } catch (err: any) {
      console.error('❌ Error adding family member:', err);
      const errorMessage = err.message || 'Failed to add family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, patient, refreshMembers]);

  const updateMember = useCallback(async (memberId: string, updates: Partial<PatientProfile>) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to update family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      await updateDoc(doc(db, 'patients', memberId), updates);
      await refreshMembers();
    } catch (err: any) {
      console.error('Error updating family member:', err);
      const errorMessage = err.message || 'Failed to update family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshMembers]);

  const deleteMember = useCallback(async (memberId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to delete family members');
    }

    try {
      setIsLoading(true);
      setError(null);

      await deleteDoc(doc(db, 'patients', memberId));
      await refreshMembers();
    } catch (err: any) {
      console.error('Error deleting family member:', err);
      const errorMessage = err.message || 'Failed to delete family member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshMembers]);

  const getMember = useCallback((memberId: string): PatientProfile | undefined => {
    return familyMembers.find(member => member.id === memberId);
  }, [familyMembers]);

  useEffect(() => {
    if (isAuthenticated && patient?.id) {
      refreshMembers();
    } else if (!isAuthenticated) {
      setFamilyMembers([]);
    }
  }, [isAuthenticated, patient?.id, refreshMembers]);

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
