import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Shield, User } from 'lucide-react';
import { useRecentActivity } from '@/lib/hooks/useRecentActivity';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Only fetch audit logs for admin users
  const { auditLogs, loading, error: apiError, refetch } = useRecentActivity(isAdmin ? 20 : 0);
  
  // Track if we've manually refreshed
  const [hasManuallyRefreshed, setHasManuallyRefreshed] = useState(false);

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
    setHasManuallyRefreshed(true);
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
            <p className="text-gray-500">System settings and user management</p>
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


        {/* User Profile Section - For All Staff */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-900 font-medium capitalize">{user?.role || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Access Level</h3>
              <p className="text-sm text-gray-600">
                {isAdmin 
                  ? "You have full administrative access to all system features and data."
                  : user?.role === 'doctor'
                  ? "You have access to view and manage appointments, queues, and patient data."
                  : "You have access to view appointments, queues, and assist with patient management."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Content - Admin Only */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-gray-500 text-sm mt-1">System audit log for token and appointment changes</p>
            </div>

            <div className="space-y-3">
              {loading && !hasManuallyRefreshed ? (
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
                <>
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border-b border-gray-200 last:border-0">
                      <div>
                        <h3 className="font-medium text-gray-900">{log.action}</h3>
                        <p className="text-sm text-gray-500 mt-1">by {log.user}</p>
                      </div>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                  ))}
                  {loading && hasManuallyRefreshed && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-sm">Refreshing...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* System Information - For All Staff */}
        {!isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">System Information</h2>
              <p className="text-gray-500">General system information and your access details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Your Access</h3>
                  <p className="text-sm text-blue-700">
                    As a {user?.role}, you have access to view and manage appointments, 
                    patient queues, and relevant patient data. You can also update your 
                    own profile information.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Available Features</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• View and manage appointments</li>
                    <li>• Manage patient queues</li>
                    <li>• Access patient information</li>
                    <li>• View system reports</li>
                    <li>• Update your profile</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Need More Access?</h3>
                  <p className="text-sm text-yellow-700">
                    If you need access to additional features or system settings, 
                    please contact your system administrator.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">System is operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}