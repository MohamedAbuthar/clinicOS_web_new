import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Shield, User, Edit } from 'lucide-react';
import { useRecentActivity } from '@/lib/hooks/useRecentActivity';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { useDoctors } from '@/lib/hooks/useDoctors';
import EditDoctorProfileDialog, { DoctorProfileData } from './EditDoctorProfileDialog';
import EditAdminProfileDialog, { AdminProfileData } from './EditAdminProfileDialog';
import EditAssistantProfileDialog, { AssistantProfileData } from './EditAssistantProfileDialog';
import { updateUserProfile } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false);
  const [isEditAssistantDialogOpen, setIsEditAssistantDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { user: currentUser, isAuthenticated, refreshUser } = useAuth();
  const { assistants, updateAssistant, fetchAssistants } = useAssistants();
  const { doctors, updateDoctor, fetchDoctors, loading: doctorsLoading } = useDoctors();
  const isAdmin = currentUser?.role === 'admin';
  const isDoctor = currentUser?.role === 'doctor';
  const isAssistant = currentUser?.role === 'assistant';
  
  // Get current doctor data if user is a doctor
  const currentDoctor = isDoctor 
    ? doctors.find(d => d.userId === currentUser?.id)
    : null;

  // Get current assistant data if user is an assistant
  const currentAssistant = isAssistant
    ? assistants.find(a => a.userId === currentUser?.id)
    : null;
  
  // Only fetch audit logs for admin users
  const { auditLogs, loading, error: apiError } = useRecentActivity(isAdmin ? 20 : 0);

  // Fetch doctors when component loads if user is a doctor
  useEffect(() => {
    if (isDoctor && isAuthenticated) {
      fetchDoctors();
    }
  }, [isDoctor, isAuthenticated, fetchDoctors]);

  // Fetch assistants when component loads if user is an assistant
  useEffect(() => {
    if (isAssistant && isAuthenticated) {
      fetchAssistants();
    }
  }, [isAssistant, isAuthenticated, fetchAssistants]);

  // Filter audit logs based on user role
  const getFilteredAuditLogs = () => {
    if (!isAuthenticated || !currentUser) return [];
    
    if (currentUser.role === 'admin') {
      // Admin sees all audit logs
      return auditLogs;
    } else if (currentUser.role === 'doctor') {
      // Doctor sees only their own activities
      return auditLogs.filter(log => 
        log.userId === currentUser.id || 
        log.action?.includes('doctor') ||
        log.action?.includes(currentUser.name || '')
      );
    } else if (currentUser.role === 'assistant') {
      // Assistant sees their own activities and activities related to their assigned doctors
      const assistant = assistants.find(a => a.userId === currentUser.id);
      const assignedDoctorIds = assistant?.assignedDoctors || [];
      
      return auditLogs.filter(log => 
        log.userId === currentUser.id || 
        (log.userId && assignedDoctorIds.includes(log.userId)) ||
        log.action?.includes('assistant') ||
        log.action?.includes(currentUser.name || '')
      );
    }
    
    return [];
  };
  
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

  const handleEditProfile = () => {
    if (isDoctor) {
      if (!currentDoctor || !currentUser) {
        toast.error('Doctor profile data not loaded yet');
        return;
      }
      setIsEditDialogOpen(true);
    } else if (isAdmin) {
      if (!currentUser) {
        toast.error('User data not loaded yet');
        return;
      }
      setIsEditAdminDialogOpen(true);
    } else if (isAssistant) {
      if (!currentAssistant || !currentUser) {
        toast.error('Assistant profile data not loaded yet');
        return;
      }
      setIsEditAssistantDialogOpen(true);
    }
  };

  const handleSaveProfile = async (data: DoctorProfileData) => {
    if (!currentDoctor) {
      toast.error('Doctor profile not found');
      return;
    }

    setIsUpdating(true);
    try {
      // Prepare updates with all fields
      const updates = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        specialty: data.specialty.trim(),
      };

      const success = await updateDoctor(currentDoctor.id, updates);
      
      if (success) {
        // Refresh doctors list first to get updated specialty data
        await fetchDoctors();
        // Then refresh user data from AuthContext to show updated name, email, phone
        await refreshUser();
        
        toast.success('✅ Profile updated successfully');
        setIsEditDialogOpen(false);
        setSuccessMessage('Profile updated successfully');
      } else {
        toast.error('❌ Failed to update profile');
      }
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAdminProfile = async (data: AdminProfileData) => {
    if (!currentUser) {
      toast.error('User data not found');
      return;
    }

    setIsUpdating(true);
    try {
      const updates = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim() || '',
      };

      await updateUserProfile(updates);
      
      // Refresh user data from AuthContext to show updated data
      await refreshUser();
      
      toast.success('✅ Profile updated successfully');
      setIsEditAdminDialogOpen(false);
      setSuccessMessage('Profile updated successfully');
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAssistantProfile = async (data: AssistantProfileData) => {
    if (!currentAssistant) {
      toast.error('Assistant profile not found');
      return;
    }

    setIsUpdating(true);
    try {
      const updates = {
        user: {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || '',
        }
      };

      const success = await updateAssistant(currentAssistant.id, updates);
      
      if (success) {
        // Refresh assistants list
        await fetchAssistants();
        // Refresh user data from AuthContext to show updated name, email, phone
        await refreshUser();
        
        toast.success('✅ Profile updated successfully');
        setIsEditAssistantDialogOpen(false);
        setSuccessMessage('Profile updated successfully');
      } else {
        toast.error('❌ Failed to update profile');
      }
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitialProfileData = (): DoctorProfileData | null => {
    if (!currentDoctor || !currentUser) return null;
    
    return {
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      specialty: currentDoctor.specialty || '',
    };
  };

  const getInitialAdminProfileData = (): AdminProfileData | null => {
    if (!currentUser) return null;
    
    // Ensure phone has +91 prefix
    let phoneValue = currentUser.phone || '';
    if (phoneValue && !phoneValue.startsWith('+91 ')) {
      const digitsOnly = phoneValue.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        phoneValue = '+91 ' + digitsOnly;
      } else {
        phoneValue = '+91 ';
      }
    } else if (!phoneValue) {
      phoneValue = '+91 ';
    }
    
    return {
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: phoneValue,
    };
  };

  const getInitialAssistantProfileData = (): AssistantProfileData | null => {
    if (!currentAssistant || !currentUser) return null;
    
    // Ensure phone has +91 prefix
    let phoneValue = currentUser.phone || '';
    if (phoneValue && !phoneValue.startsWith('+91 ')) {
      const digitsOnly = phoneValue.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        phoneValue = '+91 ' + digitsOnly;
      } else {
        phoneValue = '+91 ';
      }
    } else if (!phoneValue) {
      phoneValue = '+91 ';
    }
    
    return {
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: phoneValue,
    };
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {currentUser?.role === 'doctor' 
              ? 'Your Settings' 
              : currentUser?.role === 'assistant'
              ? 'Your Settings'
              : 'Settings'
            }
          </h1>
          <p className="text-gray-500">
            {currentUser?.role === 'doctor' 
              ? 'Your profile settings and activity logs' 
              : currentUser?.role === 'assistant'
              ? 'Your profile settings and activity logs'
              : 'System settings and user management'
            }
          </p>
          {/* User context indicator */}
          {currentUser && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
              {currentUser.role === 'doctor' && '👨‍⚕️ Doctor View'}
              {currentUser.role === 'assistant' && '👩‍💼 Assistant View'}
              {currentUser.role === 'admin' && '👨‍💼 Admin View'}
            </div>
          )}
        </div>


        {/* User Profile Section - For All Staff */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
            </div>
            {(isDoctor && currentDoctor) || isAdmin || (isAssistant && currentAssistant) ? (
              <button
                onClick={handleEditProfile}
                className="flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
                <span className="text-sm font-medium">Edit</span>
              </button>
            ) : null}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{currentUser?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{currentUser?.email || 'N/A'}</p>
              </div>
              {isDoctor && currentDoctor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <p className="text-gray-900 font-medium">{currentDoctor.specialty || 'N/A'}</p>
                </div>
              )}
              {currentUser?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{currentUser.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-900 font-medium capitalize">{currentUser?.role || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Access Level</h3>
              <p className="text-sm text-gray-600">
                {isAdmin 
                  ? "You have full administrative access to all system features and data."
                  : currentUser?.role === 'doctor'
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
                <>
                  {getFilteredAuditLogs().map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border-b border-gray-200 last:border-0">
                      <div>
                        <h3 className="font-medium text-gray-900">{log.action}</h3>
                        <p className="text-sm text-gray-500 mt-1">by {log.user}</p>
                      </div>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                  ))}
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
                    As a {currentUser?.role}, you have access to view and manage appointments, 
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

        {/* Edit Doctor Profile Dialog */}
        {isDoctor && currentDoctor && (
          <EditDoctorProfileDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={handleSaveProfile}
            initialData={getInitialProfileData()}
            loading={isUpdating}
          />
        )}

        {/* Edit Admin Profile Dialog */}
        {isAdmin && (
          <EditAdminProfileDialog
            isOpen={isEditAdminDialogOpen}
            onClose={() => setIsEditAdminDialogOpen(false)}
            onSave={handleSaveAdminProfile}
            initialData={getInitialAdminProfileData()}
            loading={isUpdating}
          />
        )}

        {/* Edit Assistant Profile Dialog */}
        {isAssistant && currentAssistant && (
          <EditAssistantProfileDialog
            isOpen={isEditAssistantDialogOpen}
            onClose={() => setIsEditAssistantDialogOpen(false)}
            onSave={handleSaveAssistantProfile}
            initialData={getInitialAssistantProfileData()}
            loading={isUpdating}
          />
        )}
      </div>
    </div>
  );
}