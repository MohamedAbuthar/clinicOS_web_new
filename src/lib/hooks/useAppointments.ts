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
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled' | 'approved';
  source: 'web' | 'assistant' | 'walk_in' | 'phone';
  notes?: string;
  tokenNumber?: string;
  checkedInAt?: any;
  acceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  queueOrder?: number;
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
        data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return { 
            id: doc.id, 
            ...docData,
            // Ensure all required fields are present
            patientName: docData.patientName || '',
            patientPhone: docData.patientPhone || '',
            appointmentDate: docData.appointmentDate || '',
            appointmentTime: docData.appointmentTime || '',
            status: docData.status || 'scheduled',
            doctorId: docData.doctorId || ''
          };
        });
        
        // Debug logging
        console.log('=== FETCHED APPOINTMENTS DEBUG ===');
        console.log('Total appointments fetched:', data.length);
        if (data.length > 0) {
          console.log('Sample appointment data:', {
            id: data[0].id,
            patientName: (data[0] as any).patientName,
            patientPhone: (data[0] as any).patientPhone,
            doctorId: (data[0] as any).doctorId,
            appointmentDate: (data[0] as any).appointmentDate,
            appointmentTime: (data[0] as any).appointmentTime,
            status: (data[0] as any).status,
            tokenNumber: (data[0] as any).tokenNumber
          });
          
          // Log today's appointments
          const today = new Date().toISOString().split('T')[0];
          const todayAppts = data.filter((apt: any) => apt.appointmentDate === today);
          console.log(`Today's appointments (${today}):`, todayAppts.length);
          if (todayAppts.length > 0) {
            console.log('Today appointments:', todayAppts.map((apt: any) => ({
              id: apt.id,
              patientName: apt.patientName,
              doctorId: apt.doctorId,
              appointmentTime: apt.appointmentTime,
              tokenNumber: apt.tokenNumber,
              status: apt.status
            })));
          }
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
        status: 'approved',
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
