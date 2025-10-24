import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, getSecondaryAuth } from '../firebase/config';
import { getAllDoctors } from '../firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface Assistant {
  id: string;
  userId: string;
  assignedDoctors: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

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
  doctors: any[];
  loading: boolean;
  doctorsLoading: boolean;
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
  createAssistant: (data: any) => Promise<boolean>;
  updateAssistant: (id: string, data: any) => Promise<boolean>;
  deleteAssistant: (id: string) => Promise<boolean>;
  refreshAssistants: () => Promise<void>;
}

export const useAssistants = (): UseAssistantsReturn => {
  const [assistants, setAssistants] = useState<AssistantWithUser[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const result = await getAllDoctors();
      if (Array.isArray(result)) {
        // If result is an array, use it directly
        setDoctors(result);
      } else if (result && result.success && Array.isArray(result.data)) {
        // If result is an object with success and data properties
        setDoctors(result.data);
      } else {
        setDoctors([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const fetchAssistants = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(collection(db, 'assistants'));
      const snapshot = await getDocs(q);
      
      // Fetch user data and doctor names for each assistant
      const assistantsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const assistantData = docSnapshot.data();
          
          // Fetch user data
          let userData = null;
          try {
            const userDoc = await getDoc(doc(db, 'users', assistantData.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (err) {
            console.error(`Failed to fetch user data for assistant ${docSnapshot.id}:`, err);
          }
          
          // Fetch assigned doctor names
          const assignedDoctorNames: string[] = [];
          if (assistantData.assignedDoctors && Array.isArray(assistantData.assignedDoctors)) {
            for (const doctorId of assistantData.assignedDoctors) {
              try {
                const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
                if (doctorDoc.exists()) {
                  const doctorData = doctorDoc.data();
                  const userDoc = await getDoc(doc(db, 'users', doctorData.userId));
                  if (userDoc.exists()) {
                    assignedDoctorNames.push(userDoc.data().name || 'Unknown');
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch doctor ${doctorId}:`, err);
              }
            }
          }
          
          return {
            id: docSnapshot.id,
            ...assistantData,
            user: userData || {
              id: assistantData.userId,
              name: 'Unknown',
              email: 'Unknown',
              phone: '',
              isActive: true,
            },
            assignedDoctorNames,
          } as AssistantWithUser;
        })
      );
      
      setAssistants(assistantsData);
      setPagination({
        page,
        limit: 10,
        total: assistantsData.length,
        totalPages: Math.ceil(assistantsData.length / 10),
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch assistants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssistant = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use secondary auth instance to create user without affecting admin session
      const secondaryAuth = getSecondaryAuth();
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        data.email, 
        data.password || 'DefaultPassword123!'
      );
      const userId = userCredential.user.uid;
      
      // Create user profile in Firestore using UID as document ID
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'assistant',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      await addDoc(collection(db, 'assistants'), {
        userId,
        assignedDoctors: data.assignedDoctors || [],
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Assistant created successfully. Admin session maintained.');
      
      await fetchAssistants();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating assistant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants]);

  const updateAssistant = useCallback(async (id: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting assistant update for ID:', id, 'with data:', data);
      
      // Get the assistant document to find userId
      const assistantDoc = await getDoc(doc(db, 'assistants', id));
      if (!assistantDoc.exists()) {
        throw new Error('Assistant not found');
      }
      
      const assistantData = assistantDoc.data();
      const userId = assistantData.userId;
      
      console.log('Found assistant data:', assistantData, 'userId:', userId);
      
      // Separate user fields from assistant fields
      const userFields: any = {};
      const assistantFields: any = {};
      
      // User-related fields that should be updated in the users collection
      if (data.user) {
        if (data.user.name !== undefined) userFields.name = data.user.name;
        if (data.user.email !== undefined) userFields.email = data.user.email;
        if (data.user.phone !== undefined) userFields.phone = data.user.phone;
      }
      
      // Assistant-specific fields that should be updated in the assistants collection
      if (data.assignedDoctors !== undefined) assistantFields.assignedDoctors = data.assignedDoctors;
      if (data.isActive !== undefined) assistantFields.isActive = data.isActive;
      
      console.log('User fields to update:', userFields);
      console.log('Assistant fields to update:', assistantFields);
      
      // Update user document if there are user field changes
      if (Object.keys(userFields).length > 0 && userId) {
        console.log('Updating user document:', userId, userFields);
        await updateDoc(doc(db, 'users', userId), {
          ...userFields,
          updatedAt: Timestamp.now()
        });
        console.log('User document updated successfully');
      }
      
      // Update assistant document if there are assistant field changes
      if (Object.keys(assistantFields).length > 0) {
        console.log('Updating assistant document:', id, assistantFields);
        await updateDoc(doc(db, 'assistants', id), {
          ...assistantFields,
          updatedAt: Timestamp.now()
        });
        console.log('Assistant document updated successfully');
      }
      
      console.log('Refreshing assistants list...');
      await fetchAssistants(pagination.page);
      console.log('Assistant update completed successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating assistant:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. You do not have sufficient permissions to update this assistant.';
      } else if (err.code === 'not-found') {
        errorMessage = 'Assistant not found. Please refresh the page and try again.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants, pagination.page]);

  const deleteAssistant = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting assistant deletion for ID:', id);
      
      // Step 1: Get the assistant document to find userId
      const assistantDoc = await getDoc(doc(db, 'assistants', id));
      if (!assistantDoc.exists()) {
        throw new Error('Assistant not found');
      }
      
      const assistantData = assistantDoc.data();
      const userId = assistantData.userId;
      
      console.log('Found assistant with userId:', userId);
      
      // Step 2: Delete user document from 'users' collection
      if (userId) {
        console.log('Deleting user document:', userId);
        await deleteDoc(doc(db, 'users', userId));
        console.log('User document deleted successfully');
        
        // Step 3: Delete user from Firebase Authentication (via API)
        try {
          console.log('Deleting authentication account...');
          const response = await fetch('/api/assistant/delete-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('Authentication account deleted successfully');
          } else {
            console.warn('Failed to delete authentication account:', result.message);
            // Continue anyway - Firestore cleanup is more important
          }
        } catch (authError) {
          console.warn('Error deleting authentication account:', authError);
          // Continue anyway - Firestore cleanup is more important
        }
      }
      
      // Step 4: Delete assistant document from 'assistants' collection
      console.log('Deleting assistant document:', id);
      await deleteDoc(doc(db, 'assistants', id));
      console.log('Assistant document deleted successfully');
      
      // Step 5: Refresh the assistants list
      await fetchAssistants(pagination.page);
      
      console.log('Assistant deletion completed successfully');
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting assistant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssistants, pagination.page]);

  const refreshAssistants = useCallback(async () => {
    await fetchAssistants(pagination.page);
  }, [fetchAssistants, pagination.page]);

  useEffect(() => {
    fetchAssistants();
    fetchDoctors();
  }, [fetchAssistants, fetchDoctors]);

  return {
    assistants,
    doctors,
    loading,
    doctorsLoading,
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
