import { useState, useEffect, useCallback } from 'react';
import { getDoctorQueue } from '../firebase/firestore';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface QueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  tokenNumber: string;
  position: number;
  status: 'waiting' | 'current' | 'completed' | 'skipped' | 'cancelled';
  arrivedAt?: any;
  calledAt?: any;
  completedAt?: any;
  skippedAt?: any;
  waitingTime?: number;
  createdAt: any;
  updatedAt: any;
}

export interface QueueStats {
  total: number;
  waiting: number;
  completed: number;
  avgWaitTime: string;
}

export interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
}

export interface UseQueueReturn {
  currentPatient: QueueItem | null;
  waitingQueue: QueueItem[];
  queueStats: QueueStats;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  selectedDoctorId: string | null;
  setSelectedDoctorId: (doctorId: string) => void;
  fetchQueueData: (doctorId: string) => Promise<void>;
  callNextPatient: () => Promise<boolean>;
  skipPatient: (queueItemId: string, reason?: string) => Promise<boolean>;
  completePatient: (queueItemId: string) => Promise<boolean>;
  reinsertPatient: (queueItemId: string) => Promise<boolean>;
  updateQueuePosition: (queueItemId: string, newPosition: number) => Promise<boolean>;
  addToQueue: (data: any) => Promise<boolean>;
  refreshQueue: () => Promise<void>;
}

export const useQueue = (): UseQueueReturn => {
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    waiting: 0,
    completed: 0,
    avgWaitTime: '0 min'
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const fetchQueueData = useCallback(async (doctorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDoctorQueue(doctorId);
      if (result.success && result.data) {
        const queue = result.data as QueueItem[];
        const current = queue.find(item => item.status === 'current') || null;
        const waiting = queue.filter(item => item.status === 'waiting');
        const completed = queue.filter(item => item.status === 'completed');
        
        setCurrentPatient(current);
        setWaitingQueue(waiting);
        
        // Calculate stats
        setQueueStats({
          total: queue.length,
          waiting: waiting.length,
          completed: completed.length,
          avgWaitTime: '15 min' // TODO: Calculate actual average
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch queue data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const callNextPatient = useCallback(async (): Promise<boolean> => {
    if (!selectedDoctorId) return false;
    
    setLoading(true);
    try {
      if (currentPatient) {
        await updateDoc(doc(db, 'queue', currentPatient.id), {
          status: 'completed',
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      if (waitingQueue.length > 0) {
        const nextPatient = waitingQueue[0];
        await updateDoc(doc(db, 'queue', nextPatient.id), {
          status: 'current',
          calledAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      await fetchQueueData(selectedDoctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, currentPatient, waitingQueue, fetchQueueData]);

  const skipPatient = useCallback(async (queueItemId: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'queue', queueItemId), {
        status: 'skipped',
        skippedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      if (selectedDoctorId) {
        await fetchQueueData(selectedDoctorId);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  const completePatient = useCallback(async (queueItemId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'queue', queueItemId), {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      if (selectedDoctorId) {
        await fetchQueueData(selectedDoctorId);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  const addToQueue = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'queue'), {
        ...data,
        status: 'waiting',
        arrivedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchQueueData(data.doctorId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchQueueData]);

  const reinsertPatient = useCallback(async (queueItemId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'queue', queueItemId), {
        status: 'waiting',
        updatedAt: Timestamp.now()
      });
      if (selectedDoctorId) {
        await fetchQueueData(selectedDoctorId);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  const updateQueuePosition = useCallback(async (queueItemId: string, newPosition: number): Promise<boolean> => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'queue', queueItemId), {
        position: newPosition,
        updatedAt: Timestamp.now()
      });
      if (selectedDoctorId) {
        await fetchQueueData(selectedDoctorId);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  const refreshQueue = useCallback(async () => {
    if (selectedDoctorId) {
      await fetchQueueData(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchQueueData]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueueData(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchQueueData]);

  return {
    currentPatient,
    waitingQueue,
    queueStats,
    activities,
    loading,
    error,
    selectedDoctorId,
    setSelectedDoctorId,
    fetchQueueData,
    callNextPatient,
    skipPatient,
    completePatient,
    reinsertPatient,
    updateQueuePosition,
    addToQueue,
    refreshQueue,
  };
};
