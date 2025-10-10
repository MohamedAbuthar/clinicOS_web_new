import { useState, useEffect, useCallback } from 'react';
import { queueApi, ApiError, QueueItem, QueueAnalytics, apiUtils } from '../api';

export interface UseQueueReturn {
  currentPatient: QueueItem | null;
  waitingQueue: QueueItem[];
  queueStats: QueueAnalytics | null;
  activities: any[];
  loading: boolean;
  error: string | null;
  selectedDoctorId: string | null;
  setSelectedDoctorId: (doctorId: string) => void;
  fetchQueueData: (doctorId: string) => Promise<void>;
  callNextPatient: () => Promise<boolean>;
  skipPatient: (queueItemId: string, reason?: string) => Promise<boolean>;
  reinsertPatient: (queueItemId: string) => Promise<boolean>;
  completePatient: (queueItemId: string) => Promise<boolean>;
  updateQueuePosition: (queueItemId: string, newPosition: number) => Promise<boolean>;
  addToQueue: (data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    tokenNumber: string;
  }) => Promise<boolean>;
  refreshQueue: () => Promise<void>;
}

export const useQueue = (): UseQueueReturn => {
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueAnalytics | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Fetch queue data for a specific doctor
  const fetchQueueData = useCallback(async (doctorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [currentResponse, waitingResponse, statsResponse] = await Promise.all([
        queueApi.getCurrentPatient(doctorId),
        queueApi.getWaitingQueue(doctorId),
        queueApi.getStats(doctorId),
      ]);

      if (currentResponse.success && currentResponse.data) {
        setCurrentPatient(currentResponse.data);
      } else {
        setCurrentPatient(null);
      }

      if (waitingResponse.success && waitingResponse.data) {
        setWaitingQueue(waitingResponse.data);
      } else {
        setWaitingQueue([]);
      }

      if (statsResponse.success && statsResponse.data) {
        setQueueStats(statsResponse.data);
      }

      // Generate sample activities (in real app, this would come from activities API)
      setActivities([
        {
          id: '1',
          message: 'Queue initialized',
          timestamp: 'Just now',
          type: 'info'
        }
      ]);

    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to fetch queue data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call next patient
  const callNextPatient = useCallback(async (): Promise<boolean> => {
    if (!selectedDoctorId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.callNext(selectedDoctorId);
      
      if (response.success) {
        await fetchQueueData(selectedDoctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to call next patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Skip patient
  const skipPatient = useCallback(async (queueItemId: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.skip(queueItemId, reason);
      
      if (response.success) {
        if (selectedDoctorId) {
          await fetchQueueData(selectedDoctorId);
        }
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to skip patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Reinsert patient
  const reinsertPatient = useCallback(async (queueItemId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.reinsert(queueItemId);
      
      if (response.success) {
        if (selectedDoctorId) {
          await fetchQueueData(selectedDoctorId);
        }
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to reinsert patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Complete patient
  const completePatient = useCallback(async (queueItemId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.complete(queueItemId);
      
      if (response.success) {
        if (selectedDoctorId) {
          await fetchQueueData(selectedDoctorId);
        }
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to complete patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Update queue position
  const updateQueuePosition = useCallback(async (queueItemId: string, newPosition: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.updatePosition({ queueItemId, newPosition });
      
      if (response.success) {
        if (selectedDoctorId) {
          await fetchQueueData(selectedDoctorId);
        }
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to update queue position:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Add to queue
  const addToQueue = useCallback(async (data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    tokenNumber: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queueApi.addToQueue(data);
      
      if (response.success) {
        await fetchQueueData(data.doctorId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = apiUtils.handleError(err);
      setError(errorMessage);
      console.error('Failed to add to queue:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchQueueData]);

  // Refresh queue
  const refreshQueue = useCallback(async () => {
    if (selectedDoctorId) {
      await fetchQueueData(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchQueueData]);

  // Load queue data when doctor is selected
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
    reinsertPatient,
    completePatient,
    updateQueuePosition,
    addToQueue,
    refreshQueue,
  };
};
