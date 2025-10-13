import { useState, useCallback } from 'react';
import { getDoctorSchedule } from '../firebase/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UseScheduleReturn {
  schedules: DoctorSchedule[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchSchedules: (doctorId: string) => Promise<void>;
  createSchedule: (doctorId: string, data: any) => Promise<boolean>;
  updateSchedule: (doctorId: string, scheduleId: string, data: any) => Promise<boolean>;
  deleteSchedule: (doctorId: string, scheduleId: string) => Promise<boolean>;
  refreshSchedules: (doctorId: string) => Promise<void>;
}

export const useSchedule = (): UseScheduleReturn => {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDoctorSchedule(doctorId);
      if (result.success && result.data) {
        setSchedules(result.data as DoctorSchedule[]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (doctorId: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'doctorSchedules'), {
        doctorId,
        ...data,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchSchedules(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  const updateSchedule = useCallback(async (doctorId: string, scheduleId: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateDoc(doc(db, 'doctorSchedules', scheduleId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchSchedules(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  const deleteSchedule = useCallback(async (doctorId: string, scheduleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'doctorSchedules', scheduleId));
      await fetchSchedules(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  const refreshSchedules = useCallback(async (doctorId: string) => {
    await fetchSchedules(doctorId);
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    setError,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules,
  };
};
