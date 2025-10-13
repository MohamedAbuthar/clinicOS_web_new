import { useState, useEffect, useCallback } from 'react';
import {
  createAppointment as createAppointmentFirestore,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment as cancelAppointmentFirestore,
  rescheduleAppointment as rescheduleAppointmentFirestore,
} from '../firebase/firestore';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  source: 'web' | 'assistant' | 'walk_in' | 'phone';
  notes?: string;
  tokenNumber?: string;
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
    getAvailableSlots,
    refreshAppointments,
  };
};
