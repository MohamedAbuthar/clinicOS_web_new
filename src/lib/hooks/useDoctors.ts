import { useState, useEffect, useCallback } from 'react';
import { getAllDoctors } from '../firebase/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db, getSecondaryAuth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationDuration: number;
  isActive: boolean;
  status?: 'In' | 'Break' | 'Out';
  schedule?: string;
  startTime?: string;
  endTime?: string;
  morningStartTime?: string;
  morningEndTime?: string;
  eveningStartTime?: string;
  eveningEndTime?: string;
  availableSlots?: string[];
  assignedAssistants?: string[];
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

export interface UseDoctorsReturn {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchDoctors: () => Promise<void>;
  createDoctor: (data: any) => Promise<Doctor | null>;
  updateDoctor: (id: string, data: any) => Promise<boolean>;
  updateDoctorStatus: (id: string, status: 'active' | 'break' | 'offline') => Promise<boolean>;
  deleteDoctor: (id: string) => Promise<boolean>;
  refreshDoctors: () => Promise<void>;
  testFirestorePermissions: () => Promise<void>;
}

export const useDoctors = (): UseDoctorsReturn => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching doctors...');
      const result = await getAllDoctors();
      console.log('Doctors result:', result);
      
      if (result.success && result.data) {
        console.log('Found doctors:', result.data.length);
        setDoctors(result.data as Doctor[]);
      } else if (result.error) {
        console.error('Error from getAllDoctors:', result.error);
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDoctor = useCallback(async (data: any): Promise<Doctor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use secondary auth instance to create user without affecting admin session
      const secondaryAuth = getSecondaryAuth();
      
      // Create user in Firebase Auth using secondary instance
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
        role: 'doctor',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Create doctor profile in Firestore
      const doctorData: any = {
        userId,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber,
        consultationDuration: data.consultationDuration,
        isActive: true,
        status: data.status || 'Out', // Use provided status or default to Out
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Include schedule and slot data if provided
      if (data.schedule) doctorData.schedule = data.schedule;
      if (data.startTime) doctorData.startTime = data.startTime;
      if (data.endTime) doctorData.endTime = data.endTime;
      if (data.morningStartTime) doctorData.morningStartTime = data.morningStartTime;
      if (data.morningEndTime) doctorData.morningEndTime = data.morningEndTime;
      if (data.eveningStartTime) doctorData.eveningStartTime = data.eveningStartTime;
      if (data.eveningEndTime) doctorData.eveningEndTime = data.eveningEndTime;
      if (data.availableSlots && Array.isArray(data.availableSlots)) {
        doctorData.availableSlots = data.availableSlots;
      }
      if (data.assignedAssistants && Array.isArray(data.assignedAssistants)) {
        doctorData.assignedAssistants = data.assignedAssistants;
      }

      // Add doctor document and get the reference
      const docRef = await addDoc(collection(db, 'doctors'), doctorData);
      
      // Retrieve the created document to return complete data
      const createdDoc = await getDoc(docRef);
      if (!createdDoc.exists()) {
        throw new Error('Failed to retrieve created doctor document');
      }

      const docData = createdDoc.data();
      const createdDoctor: Doctor = {
        id: createdDoc.id,
        ...docData,
        user: {
          id: userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          isActive: true
        }
      } as Doctor;
      
      console.log('Doctor created successfully. Admin session maintained.');
      console.log('Created Doctor Data:', JSON.stringify(createdDoctor, null, 2));
      
      await fetchDoctors();
      return createdDoctor;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating doctor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

  const updateDoctor = useCallback(async (id: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting doctor update for ID:', id, 'with data:', data);
      console.log('Current user auth state:', await import('firebase/auth').then(({ getAuth }) => {
        const auth = getAuth();
        return {
          currentUser: auth.currentUser?.uid,
          email: auth.currentUser?.email
        };
      }));
      
      // Validate input data
      if (!id || !data) {
        throw new Error('Invalid input data provided for doctor update');
      }
      
      // Get the doctor to find the userId
      const doctorDoc = await getDoc(doc(db, 'doctors', id));
      if (!doctorDoc.exists()) {
        throw new Error('Doctor not found');
      }
      
      const doctorData = doctorDoc.data();
      const userId = doctorData.userId;
      
      console.log('Found doctor data:', doctorData, 'userId:', userId);

      // Validate that we have a userId
      if (!userId) {
        throw new Error('Doctor user ID not found. Cannot update user profile.');
      }

      // Separate user fields from doctor fields with validation
      const userFields: any = {};
      const doctorFields: any = {};

      // User fields with validation
      if (data.name !== undefined && data.name !== null && data.name.trim() !== '') {
        userFields.name = data.name.trim();
      }
      if (data.email !== undefined && data.email !== null && data.email.trim() !== '') {
        userFields.email = data.email.trim();
      }
      if (data.phone !== undefined && data.phone !== null && data.phone.trim() !== '') {
        userFields.phone = data.phone.trim();
      }
      
      // Doctor fields with validation
      if (data.specialty !== undefined && data.specialty !== null && data.specialty.trim() !== '') {
        doctorFields.specialty = data.specialty.trim();
      }
      if (data.consultationDuration !== undefined && data.consultationDuration !== null) {
        doctorFields.consultationDuration = parseInt(data.consultationDuration);
      }
      if (data.licenseNumber !== undefined && data.licenseNumber !== null && data.licenseNumber.trim() !== '') {
        doctorFields.licenseNumber = data.licenseNumber.trim();
      }
      
      // Include schedule and slot data with validation
      if (data.schedule !== undefined && data.schedule !== null && data.schedule.trim() !== '') {
        doctorFields.schedule = data.schedule.trim();
      }
      if (data.startTime !== undefined && data.startTime !== null && data.startTime.trim() !== '') {
        doctorFields.startTime = data.startTime.trim();
      }
      if (data.endTime !== undefined && data.endTime !== null && data.endTime.trim() !== '') {
        doctorFields.endTime = data.endTime.trim();
      }
      // Add morning and evening session timing fields
      if (data.morningStartTime !== undefined && data.morningStartTime !== null && data.morningStartTime.trim() !== '') {
        doctorFields.morningStartTime = data.morningStartTime.trim();
      }
      if (data.morningEndTime !== undefined && data.morningEndTime !== null && data.morningEndTime.trim() !== '') {
        doctorFields.morningEndTime = data.morningEndTime.trim();
      }
      if (data.eveningStartTime !== undefined && data.eveningStartTime !== null && data.eveningStartTime.trim() !== '') {
        doctorFields.eveningStartTime = data.eveningStartTime.trim();
      }
      if (data.eveningEndTime !== undefined && data.eveningEndTime !== null && data.eveningEndTime.trim() !== '') {
        doctorFields.eveningEndTime = data.eveningEndTime.trim();
      }
      // Add room field
      if (data.room !== undefined && data.room !== null && data.room.trim() !== '') {
        doctorFields.room = data.room.trim();
      }
      if (data.availableSlots !== undefined && Array.isArray(data.availableSlots) && data.availableSlots.length > 0) {
        doctorFields.availableSlots = data.availableSlots;
        console.log(`✅ Saving ${data.availableSlots.length} time slots to doctor ${id}`);
      }
      if (data.assignedAssistants !== undefined && Array.isArray(data.assignedAssistants)) {
        doctorFields.assignedAssistants = data.assignedAssistants;
        console.log(`✅ Saving ${data.assignedAssistants.length} assigned assistants to doctor ${id}`);
        
        // Sync assistant documents: update each assistant's assignedDoctors array
        const oldAssignedAssistants = (doctorData.assignedAssistants || []) as string[];
        const newAssignedAssistants = data.assignedAssistants as string[];
        
        // Find assistants that were removed (in old but not in new)
        const removedAssistants = oldAssignedAssistants.filter(aid => !newAssignedAssistants.includes(aid));
        // Find assistants that were added (in new but not in old)
        const addedAssistants = newAssignedAssistants.filter(aid => !oldAssignedAssistants.includes(aid));
        
        console.log('🔄 Syncing assistant documents:', {
          removed: removedAssistants,
          added: addedAssistants,
          doctorId: id
        });
        
        // Update removed assistants: remove this doctor from their assignedDoctors
        for (const assistantId of removedAssistants) {
          try {
            const assistantDoc = await getDoc(doc(db, 'assistants', assistantId));
            if (assistantDoc.exists()) {
              const assistantData = assistantDoc.data();
              const currentAssignedDoctors = (assistantData.assignedDoctors || []) as string[];
              const updatedAssignedDoctors = currentAssignedDoctors.filter(docId => docId !== id);
              
              await updateDoc(doc(db, 'assistants', assistantId), {
                assignedDoctors: updatedAssignedDoctors,
                updatedAt: Timestamp.now()
              });
              console.log(`✅ Removed doctor ${id} from assistant ${assistantId}`);
            }
          } catch (error) {
            console.error(`❌ Error updating assistant ${assistantId}:`, error);
          }
        }
        
        // Update added assistants: add this doctor to their assignedDoctors
        for (const assistantId of addedAssistants) {
          try {
            const assistantDoc = await getDoc(doc(db, 'assistants', assistantId));
            if (assistantDoc.exists()) {
              const assistantData = assistantDoc.data();
              const currentAssignedDoctors = (assistantData.assignedDoctors || []) as string[];
              
              // Only add if not already present
              if (!currentAssignedDoctors.includes(id)) {
                const updatedAssignedDoctors = [...currentAssignedDoctors, id];
                
                await updateDoc(doc(db, 'assistants', assistantId), {
                  assignedDoctors: updatedAssignedDoctors,
                  updatedAt: Timestamp.now()
                });
                console.log(`✅ Added doctor ${id} to assistant ${assistantId}`);
              }
            }
          } catch (error) {
            console.error(`❌ Error updating assistant ${assistantId}:`, error);
          }
        }
      }

      console.log('User fields to update:', userFields);
      console.log('Doctor fields to update:', doctorFields);
      console.log('Total user fields count:', Object.keys(userFields).length);
      console.log('Total doctor fields count:', Object.keys(doctorFields).length);

      // Check if we have any fields to update
      if (Object.keys(userFields).length === 0 && Object.keys(doctorFields).length === 0) {
        console.log('No fields to update, skipping update operation');
        await fetchDoctors();
        return true;
      }

      // Update user document if there are user fields to update
      let userUpdateSuccess = true;
      if (Object.keys(userFields).length > 0 && userId) {
        console.log('Updating user document:', userId, userFields);
        try {
          // Validate user fields before updating
          const validatedUserFields: any = {};
          
          if (userFields.name && typeof userFields.name === 'string' && userFields.name.trim().length > 0) {
            validatedUserFields.name = userFields.name.trim();
          }
          if (userFields.email && typeof userFields.email === 'string' && userFields.email.trim().length > 0) {
            validatedUserFields.email = userFields.email.trim();
          }
          if (userFields.phone && typeof userFields.phone === 'string' && userFields.phone.trim().length > 0) {
            validatedUserFields.phone = userFields.phone.trim();
          }
          
          // Only update if we have validated fields
          if (Object.keys(validatedUserFields).length > 0) {
            const userUpdateData = {
              ...validatedUserFields,
              updatedAt: Timestamp.now()
            };
            
            console.log('User update data:', userUpdateData);
            await updateDoc(doc(db, 'users', userId), userUpdateData);
            console.log('User document updated successfully');
          } else {
            console.log('No valid user fields to update, skipping user document update');
          }
        } catch (userUpdateError: any) {
          console.error('Error updating user document:', userUpdateError);
          console.error('User update error details:', {
            code: userUpdateError.code,
            message: userUpdateError.message,
            userId: userId,
            userFields: userFields
          });
          
          userUpdateSuccess = false;
          
          // If it's a permission error, log it but don't throw - continue with doctor update
          if (userUpdateError.code === 'permission-denied') {
            console.warn('Permission denied for user update, but continuing with doctor update');
          } else {
            console.warn('User document update failed, but continuing with doctor document update');
          }
        }
      }

      // Update doctor document if there are doctor fields to update
      if (Object.keys(doctorFields).length > 0) {
        console.log('Updating doctor document:', id, doctorFields);
        try {
          // Validate and sanitize doctor fields
          const validatedDoctorFields: any = {};
          
          if (doctorFields.specialty && typeof doctorFields.specialty === 'string' && doctorFields.specialty.trim().length > 0) {
            validatedDoctorFields.specialty = doctorFields.specialty.trim();
          }
          if (doctorFields.consultationDuration && typeof doctorFields.consultationDuration === 'number' && doctorFields.consultationDuration > 0) {
            validatedDoctorFields.consultationDuration = doctorFields.consultationDuration;
          }
          if (doctorFields.licenseNumber && typeof doctorFields.licenseNumber === 'string' && doctorFields.licenseNumber.trim().length > 0) {
            validatedDoctorFields.licenseNumber = doctorFields.licenseNumber.trim();
          }
          if (doctorFields.schedule && typeof doctorFields.schedule === 'string' && doctorFields.schedule.trim().length > 0) {
            validatedDoctorFields.schedule = doctorFields.schedule.trim();
          }
          if (doctorFields.startTime && typeof doctorFields.startTime === 'string' && doctorFields.startTime.trim().length > 0) {
            validatedDoctorFields.startTime = doctorFields.startTime.trim();
          }
          if (doctorFields.endTime && typeof doctorFields.endTime === 'string' && doctorFields.endTime.trim().length > 0) {
            validatedDoctorFields.endTime = doctorFields.endTime.trim();
          }
          // Add validation for morning and evening session timing fields
          if (doctorFields.morningStartTime && typeof doctorFields.morningStartTime === 'string' && doctorFields.morningStartTime.trim().length > 0) {
            validatedDoctorFields.morningStartTime = doctorFields.morningStartTime.trim();
          }
          if (doctorFields.morningEndTime && typeof doctorFields.morningEndTime === 'string' && doctorFields.morningEndTime.trim().length > 0) {
            validatedDoctorFields.morningEndTime = doctorFields.morningEndTime.trim();
          }
          if (doctorFields.eveningStartTime && typeof doctorFields.eveningStartTime === 'string' && doctorFields.eveningStartTime.trim().length > 0) {
            validatedDoctorFields.eveningStartTime = doctorFields.eveningStartTime.trim();
          }
          if (doctorFields.eveningEndTime && typeof doctorFields.eveningEndTime === 'string' && doctorFields.eveningEndTime.trim().length > 0) {
            validatedDoctorFields.eveningEndTime = doctorFields.eveningEndTime.trim();
          }
          // Add validation for room field
          if (doctorFields.room && typeof doctorFields.room === 'string' && doctorFields.room.trim().length > 0) {
            validatedDoctorFields.room = doctorFields.room.trim();
          }
          if (doctorFields.availableSlots && Array.isArray(doctorFields.availableSlots) && doctorFields.availableSlots.length > 0) {
            validatedDoctorFields.availableSlots = doctorFields.availableSlots;
          }
          if (doctorFields.assignedAssistants && Array.isArray(doctorFields.assignedAssistants)) {
            validatedDoctorFields.assignedAssistants = doctorFields.assignedAssistants;
          }
          
          // Only update if we have validated fields
          if (Object.keys(validatedDoctorFields).length > 0) {
            const doctorUpdateData = {
              ...validatedDoctorFields,
              updatedAt: Timestamp.now()
            };
            
            console.log('Doctor update data:', doctorUpdateData);
            await updateDoc(doc(db, 'doctors', id), doctorUpdateData);
            console.log(`✅ Doctor ${id} updated successfully`);
          } else {
            console.log('No valid doctor fields to update, skipping doctor document update');
          }
        } catch (doctorUpdateError: any) {
          console.error('Error updating doctor document:', doctorUpdateError);
          console.error('Doctor update error details:', {
            code: doctorUpdateError.code,
            message: doctorUpdateError.message,
            doctorId: id,
            doctorFields: doctorFields
          });
          
          // If it's a permission error, throw it
          if (doctorUpdateError.code === 'permission-denied') {
            throw new Error('Permission denied: Cannot update doctor profile. Please check your permissions.');
          }
          
          throw new Error(`Failed to update doctor profile: ${doctorUpdateError.message}`);
        }
      }

      console.log('Refreshing doctors list...');
      await fetchDoctors();
      
      if (userUpdateSuccess) {
        console.log('Doctor update completed successfully (both user and doctor profiles updated)');
      } else {
        console.log('Doctor update completed successfully (doctor profile updated, user profile update skipped)');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error updating doctor:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        doctorId: id,
        updateData: data
      });
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. You do not have sufficient permissions to update this doctor.';
      } else if (err.code === 'not-found') {
        errorMessage = 'Doctor not found. Please refresh the page and try again.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (err.code === 'invalid-argument') {
        errorMessage = 'Invalid data provided. Please check your input and try again.';
      } else if (err.code === 'failed-precondition') {
        errorMessage = 'The operation failed due to a precondition. Please try again.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

  // Test function to verify Firestore permissions
  const testFirestorePermissions = useCallback(async (): Promise<void> => {
    try {
      console.log('Testing Firestore permissions...');
      
      // Test reading doctors collection
      const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
      console.log('✅ Can read doctors collection:', doctorsSnapshot.size, 'documents');
      
      // Test reading users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log('✅ Can read users collection:', usersSnapshot.size, 'documents');
      
      // Test updating a doctor document (if any exist)
      if (doctorsSnapshot.size > 0) {
        const firstDoctor = doctorsSnapshot.docs[0];
        const doctorId = firstDoctor.id;
        const doctorData = firstDoctor.data();
        
        console.log('Testing doctor update permissions for:', doctorId);
        
        try {
          await updateDoc(doc(db, 'doctors', doctorId), {
            updatedAt: Timestamp.now()
          });
          console.log('✅ Can update doctors collection');
        } catch (error: any) {
          console.error('❌ Cannot update doctors collection:', error.message);
        }
        
        // Test updating user document
        if (doctorData.userId) {
          console.log('Testing user update permissions for:', doctorData.userId);
          try {
            await updateDoc(doc(db, 'users', doctorData.userId), {
              updatedAt: Timestamp.now()
            });
            console.log('✅ Can update users collection');
          } catch (error: any) {
            console.error('❌ Cannot update users collection:', error.message);
          }
        }
      }
      
      console.log('Firestore permissions test completed');
    } catch (error: any) {
      console.error('Error testing Firestore permissions:', error);
    }
  }, []);

  const updateDoctorStatus = useCallback(async (id: string, status: 'active' | 'break' | 'offline'): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'doctors', id), {
        status,
        updatedAt: Timestamp.now()
      });
      await fetchDoctors();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

  const deleteDoctor = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'doctors', id));
      await fetchDoctors();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

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
    setError,
    fetchDoctors,
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor,
    refreshDoctors,
    testFirestorePermissions,
  };
};
