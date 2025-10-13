import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface AuditLog {
  id: string;
  action: string;
  user: string; // Changed from userId to user for display
  userId?: string; // Keep userId for reference
  entityType?: string;
  entityId?: string;
  timestamp: string; // Changed to string for display
  details?: string;
}

interface UseRecentActivityReturn {
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useRecentActivity = (limit: number = 20): UseRecentActivityReturn => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to readable string
        let timestampString = 'Unknown';
        if (data.timestamp) {
          try {
            const timestamp = data.timestamp instanceof Timestamp 
              ? data.timestamp.toDate() 
              : new Date(data.timestamp);
            timestampString = timestamp.toLocaleString();
          } catch (e) {
            console.error('Error converting timestamp:', e);
          }
        }
        
        return {
          id: doc.id,
          action: data.action || 'Unknown action',
          user: data.user || data.userId || 'Unknown user',
          userId: data.userId,
          entityType: data.entityType,
          entityId: data.entityId,
          timestamp: timestampString,
          details: data.details,
        } as AuditLog;
      });
      
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [limit]);

  const refetch = () => {
    fetchRecentActivity();
  };

  return {
    auditLogs,
    loading,
    error,
    refetch
  };
};
