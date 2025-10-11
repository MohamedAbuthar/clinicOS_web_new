import { useState, useEffect } from 'react';
import { auditApi, AuditLog } from '../api';

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
      
      const response = await auditApi.getRecentActivity(limit);
      
      if (response.success) {
        setAuditLogs(response.data);
      } else {
        setError(response.message || 'Failed to fetch recent activity');
      }
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
