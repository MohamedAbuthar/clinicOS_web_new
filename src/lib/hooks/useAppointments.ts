import { useState, useEffect, useCallback } from 'react';
import {
  createAppointment as createAppointmentFirestore,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment as cancelAppointmentFirestore,
  rescheduleAppointment as rescheduleAppointmentFirestore,
} from '../firebase/firestore';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // Store patient name directly in appointment
  patientPhone?: string; // Store patient phone directly in appointment
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  source: 'web' | 'assistant' | 'walk_in' | 'phone';
  notes?: string;
  tokenNumber?: string;
  checkedInAt?: any;
  acceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  acceptedAt?: any;
  rejectedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (data: any) => Promise<boolean>;
  updateAppointment: (id: string, data: any) => Promise<boolean>;
  cancelAppointment: (id: string, reason: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<boolean>;
  completeAppointment: (id: string) => Promise<boolean>;
  markNoShow: (id: string) => Promise<boolean>;
  checkInAppointment: (id: string) => Promise<boolean>;
  acceptAppointment: (id: string) => Promise<boolean>;
  rejectAppointment: (id: string) => Promise<boolean>;
  getAvailableSlots: (doctorId: string, date: string) => Promise<any[]>;
  refreshAppointments: () => Promise<void>;
}

export const useAppointments = (patientId?: string, doctorId?: string): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (patientId) {
        data = await getPatientAppointments(patientId);
      } else if (doctorId) {
        const result = await getDoctorAppointments(doctorId);
        data = result?.success && result?.data ? result.data : [];
      } else {
        const q = query(collection(db, 'appointments'));
        const snapshot = await getDocs(q);
        data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Debug logging
        console.log('=== FETCHED APPOINTMENTS DEBUG ===');
        console.log('Total appointments fetched:', data.length);
        if (data.length > 0) {
          console.log('First appointment data:', data[0]);
          console.log('First appointment patientName:', (data[0] as any).patientName);
          console.log('First appointment patientPhone:', (data[0] as any).patientPhone);
        }
        console.log('==================================');
      }
      
      if (data) {
        setAppointments(data as Appointment[]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, doctorId]);

  const createAppointment = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createAppointmentFirestore(data);
      if (result.success) {
        await fetchAppointments();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const cancelAppointment = useCallback(async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await cancelAppointmentFirestore(id, reason);
      if (result.success) {
        await fetchAppointments();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const rescheduleAppointment = useCallback(async (id: string, newDate: string, newTime: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await rescheduleAppointmentFirestore(id, newDate, newTime);
      if (result.success) {
        await fetchAppointments();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const completeAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'completed',
        updatedAt: Timestamp.now()
      });
      await fetchAppointments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const markNoShow = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'no_show',
        updatedAt: Timestamp.now()
      });
      await fetchAppointments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const checkInAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Check-in started for appointment:', id);
      
      // Only update the appointment with checkedInAt timestamp
      // The queue entry will be created in Queue Management page when "Add to Queue" is clicked
      const appointmentRef = doc(db, 'appointments', id);
      await updateDoc(appointmentRef, {
        checkedInAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('Appointment updated with checkedInAt timestamp');

      await fetchAppointments();
      console.log('Check-in completed successfully');
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Check-in error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const acceptAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', id), {
        acceptanceStatus: 'accepted',
        acceptedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchAppointments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const rejectAppointment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', id), {
        acceptanceStatus: 'rejected',
        rejectedAt: Timestamp.now(),
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      await fetchAppointments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (id: string, data: any): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', id), {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchAppointments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const getAvailableSlots = useCallback(async (doctorId: string, date: string): Promise<any[]> => {
    try {
      // Get all appointments for this doctor on this date
      const q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('appointmentDate', '==', date)
      );
      const snapshot = await getDocs(q);
      const bookedTimes = snapshot.docs.map(doc => doc.data().appointmentTime);

      // Generate time slots (9 AM to 5 PM, 30-minute intervals)
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time,
            isBooked: bookedTimes.includes(time)
          });
        }
      }
      return slots;
    } catch (err: any) {
      console.error('Error getting available slots:', err);
      return [];
    }
  }, []);

  const refreshAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    rescheduleAppointment,
    completeAppointment,
    markNoShow,
    checkInAppointment,
    acceptAppointment,
    rejectAppointment,
    getAvailableSlots,
    refreshAppointments,
  };
};
