import { useState, useEffect, useCallback } from 'react';
import { getAllDoctors } from '../firebase/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, getSecondaryAuth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
  fetchDoctors: () => Promise<void>;
  createDoctor: (data: any) => Promise<boolean>;
  updateDoctor: (id: string, data: any) => Promise<boolean>;
  updateDoctorStatus: (id: string, status: 'active' | 'break' | 'offline') => Promise<boolean>;
  deleteDoctor: (id: string) => Promise<boolean>;
  refreshDoctors: () => Promise<void>;
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

  const createDoctor = useCallback(async (data: any): Promise<boolean> => {
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
        status: 'offline',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Include schedule and slot data if provided
      if (data.schedule) doctorData.schedule = data.schedule;
      if (data.startTime) doctorData.startTime = data.startTime;
      if (data.endTime) doctorData.endTime = data.endTime;
      if (data.availableSlots && Array.isArray(data.availableSlots)) {
        doctorData.availableSlots = data.availableSlots;
      }
      if (data.assignedAssistants && Array.isArray(data.assignedAssistants)) {
        doctorData.assignedAssistants = data.assignedAssistants;
      }

      await addDoc(collection(db, 'doctors'), doctorData);
      
      console.log('Doctor created successfully. Admin session maintained.');
      
      await fetchDoctors();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating doctor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

  const updateDoctor = useCallback(async (id: string, data: any): Promise<boolean> => {
    setLoading(true);
    try {
      // Get the doctor to find the userId
      const doctorDoc = await getDoc(doc(db, 'doctors', id));
      if (!doctorDoc.exists()) {
        throw new Error('Doctor not found');
      }
      
      const doctorData = doctorDoc.data();
      const userId = doctorData.userId;

      // Separate user fields from doctor fields
      const userFields: any = {};
      const doctorFields: any = {};

      if (data.name !== undefined) userFields.name = data.name;
      if (data.email !== undefined) userFields.email = data.email;
      if (data.phone !== undefined) userFields.phone = data.phone;
      if (data.specialty !== undefined) doctorFields.specialty = data.specialty;
      if (data.consultationDuration !== undefined) doctorFields.consultationDuration = data.consultationDuration;
      if (data.licenseNumber !== undefined) doctorFields.licenseNumber = data.licenseNumber;
      
      // Include schedule and slot data
      if (data.schedule !== undefined) doctorFields.schedule = data.schedule;
      if (data.startTime !== undefined) doctorFields.startTime = data.startTime;
      if (data.endTime !== undefined) doctorFields.endTime = data.endTime;
      if (data.availableSlots !== undefined && Array.isArray(data.availableSlots)) {
        doctorFields.availableSlots = data.availableSlots;
        console.log(`✅ Saving ${data.availableSlots.length} time slots to doctor ${id}`);
      }
      if (data.assignedAssistants !== undefined && Array.isArray(data.assignedAssistants)) {
        doctorFields.assignedAssistants = data.assignedAssistants;
        console.log(`✅ Saving ${data.assignedAssistants.length} assigned assistants to doctor ${id}`);
      }

      // Update user document if there are user fields to update
      if (Object.keys(userFields).length > 0 && userId) {
        await updateDoc(doc(db, 'users', userId), {
          ...userFields,
          updatedAt: Timestamp.now()
        });
      }

      // Update doctor document if there are doctor fields to update
      if (Object.keys(doctorFields).length > 0) {
        await updateDoc(doc(db, 'doctors', id), {
          ...doctorFields,
          updatedAt: Timestamp.now()
        });
        console.log(`✅ Doctor ${id} updated successfully`);
      }

      await fetchDoctors();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating doctor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors]);

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
    fetchDoctors,
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor,
    refreshDoctors,
  };
};
