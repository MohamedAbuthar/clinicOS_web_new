import { useState, useEffect, useCallback } from 'react';
import { getDoctorQueue } from '../firebase/firestore';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PendingCheckIn {
  id: string;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber: string;
  status: string;
}

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
  checkInPatient: (appointmentId: string, patientId: string, doctorId: string, tokenNumber: string) => Promise<boolean>;
  getPendingCheckIns: (doctorId: string, date: string) => Promise<any[]>;
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
      // Query queue collection directly for better real-time data
      const queueRef = collection(db, 'queue');
      const q = query(
        queueRef,
        where('doctorId', '==', doctorId)
      );
      
      const snapshot = await getDocs(q);
      const queue = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QueueItem[];
      
      console.log('Fetched queue data:', queue);
      
      // Sort by position in JavaScript instead of Firestore
      const sortedQueue = queue.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const current = sortedQueue.find(item => item.status === 'current') || null;
      const waiting = sortedQueue.filter(item => item.status === 'waiting');
      const completed = sortedQueue.filter(item => item.status === 'completed');
      
      setCurrentPatient(current);
      setWaitingQueue(waiting);
      
      // Calculate stats
      setQueueStats({
        total: queue.length,
        waiting: waiting.length,
        completed: completed.length,
        avgWaitTime: '15 min' // TODO: Calculate actual average
      });
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

  // Check-in patient: Creates queue entry when patient arrives at clinic
  const checkInPatient = useCallback(async (
    appointmentId: string,
    patientId: string,
    doctorId: string,
    tokenNumber: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current queue to determine position
      const queueRef = collection(db, 'queue');
      const q = query(
        queueRef,
        where('doctorId', '==', doctorId),
        where('status', 'in', ['waiting', 'current'])
      );
      const snapshot = await getDocs(q);
      
      // Find max position in JavaScript
      let maxPosition = 0;
      snapshot.forEach(doc => {
        const position = doc.data().position || 0;
        if (position > maxPosition) {
          maxPosition = position;
        }
      });

      // Create queue entry
      const queueData = {
        appointmentId,
        patientId,
        doctorId,
        tokenNumber,
        position: maxPosition + 1,
        status: 'waiting',
        arrivedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(queueRef, queueData);

      // Update appointment - the checkedInAt should already be set, this is just for safety
      await updateDoc(doc(db, 'appointments', appointmentId), {
        updatedAt: Timestamp.now(),
      });

      // Add activity log
      const newActivity: Activity = {
        id: Date.now().toString(),
        message: `Patient ${tokenNumber} checked in and added to queue`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);

      await fetchQueueData(doctorId);
      return true;
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchQueueData]);

  // Get appointments that have been checked in (completed status with checkedInAt timestamp)
  const getPendingCheckIns = useCallback(async (doctorId: string, date: string): Promise<any[]> => {
    try {
      console.log('Getting pending check-ins for doctor:', doctorId, 'date:', date);
      
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', doctorId),
        where('appointmentDate', '==', date),
        where('status', '==', 'completed')
      );
      
      const snapshot = await getDocs(q);
      console.log('Found completed appointments:', snapshot.size);
      
      const checkedInAppointments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter only appointments that have been checked in
        .filter((apt: any) => {
          const hasCheckedIn = !!apt.checkedInAt;
          console.log(`Appointment ${apt.tokenNumber} - hasCheckedIn:`, hasCheckedIn);
          return hasCheckedIn;
        })
        // Sort by checkedInAt timestamp (earliest first)
        .sort((a: any, b: any) => {
          const aTime = a.checkedInAt?.toMillis?.() || 0;
          const bTime = b.checkedInAt?.toMillis?.() || 0;
          return aTime - bTime;
        });

      console.log('Checked-in appointments:', checkedInAppointments.length);

      // Filter out appointments that are already in queue
      const queueRef = collection(db, 'queue');
      const queueQuery = query(
        queueRef,
        where('doctorId', '==', doctorId)
      );
      const queueSnapshot = await getDocs(queueQuery);
      const queueAppointmentIds = queueSnapshot.docs.map(doc => doc.data().appointmentId);
      
      console.log('Appointments already in queue:', queueAppointmentIds);

      const pending = checkedInAppointments.filter(apt => !queueAppointmentIds.includes(apt.id));
      console.log('Pending check-ins (not in queue yet):', pending.length);
      
      return pending;
    } catch (err: any) {
      console.error('Get pending check-ins error:', err);
      return [];
    }
  }, []);

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
    checkInPatient,
    getPendingCheckIns,
  };
};
