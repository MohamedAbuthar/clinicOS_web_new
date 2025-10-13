import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ScheduleOverride {
  id: string;
  doctorId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  type: 'holiday' | 'extended_hours' | 'reduced_hours';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UseScheduleOverridesReturn {
  overrides: ScheduleOverride[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchOverrides: (doctorId: string) => Promise<void>;
  createOverride: (doctorId: string, data: any) => Promise<boolean>;
  updateOverride: (doctorId: string, overrideId: string, data: any) => Promise<boolean>;
  deleteOverride: (doctorId: string, overrideId: string) => Promise<boolean>;
  refreshOverrides: (doctorId: string) => Promise<void>;
}

export const useScheduleOverrides = (): UseScheduleOverridesReturn => {
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverrides = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'scheduleOverrides'),
        where('doctorId', '==', doctorId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleOverride[];
      setOverrides(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch schedule overrides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOverride = useCallback(async (doctorId: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'scheduleOverrides'), {
        doctorId,
        ...data,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchOverrides(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  const updateOverride = useCallback(async (doctorId: string, overrideId: string, data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateDoc(doc(db, 'scheduleOverrides', overrideId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchOverrides(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  const deleteOverride = useCallback(async (doctorId: string, overrideId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'scheduleOverrides', overrideId));
      await fetchOverrides(doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchOverrides]);

  const refreshOverrides = useCallback(async (doctorId: string) => {
    await fetchOverrides(doctorId);
  }, [fetchOverrides]);

  return {
    overrides,
    loading,
    error,
    setError,
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride,
    refreshOverrides,
  };
};
