import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRecentActivity } from '@/lib/hooks/useRecentActivity';

export default function SettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { auditLogs, loading, error: apiError, refetch } = useRecentActivity(20);

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Update error state when API error changes
  useEffect(() => {
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

  const handleRefresh = () => {
    setError(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-gray-500">System audit log for token and appointment changes</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Recent Activity Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-gray-500 text-sm mt-1">System audit log for token and appointment changes</p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Loading recent activity...</span>
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <AlertCircle size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Activity</h3>
                  <p className="text-gray-500">No recent activity found. Activities will appear here as they occur.</p>
                </div>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border-b border-gray-200 last:border-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{log.action}</h3>
                    <p className="text-sm text-gray-500 mt-1">by {log.user}</p>
                  </div>
                  <span className="text-sm text-gray-500">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}