import React, { useState, useEffect } from 'react';
import { Save, Database, Bell, Shield, X, AlertCircle, Loader2 } from 'lucide-react';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { apiUtils } from '@/lib/api';

// TypeScript Interfaces
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('token-rules');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [maxSkips, setMaxSkips] = useState('3');
  const [autoNoShow, setAutoNoShow] = useState('30');
  const [allowWalkIn, setAllowWalkIn] = useState(true);
  const [familyBooking, setFamilyBooking] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form states for new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Front Desk');

  const { doctors } = useDoctors();
  const { assistants } = useAssistants();

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Combine doctors and assistants into users list
  const users: User[] = [
    ...doctors.map((doctor, index) => ({
      id: parseInt(doctor.id),
      name: doctor.user.name,
      email: doctor.user.email,
      role: 'Doctor'
    })),
    ...assistants.map((assistant, index) => ({
      id: parseInt(assistant.id) + 1000, // Offset to avoid ID conflicts
      name: assistant.user.name,
      email: assistant.user.email,
      role: 'Assistant'
    }))
  ];

  const auditLogs: AuditLog[] = [
    { id: 1, action: 'Token #14 moved to position 2', user: 'Priya Sharma', timestamp: '2 mins ago' },
    { id: 2, action: 'Dr. Sivakumar marked IN', user: 'Ravi Menon', timestamp: '15 mins ago' },
    { id: 3, action: 'Walk-in patient added', user: 'Priya Sharma', timestamp: '23 mins ago' },
    { id: 4, action: 'Appointment rescheduled', user: 'Lakshmi Iyer', timestamp: '1 hour ago' },
    { id: 5, action: 'Token #8 skipped', user: 'Ravi Menon', timestamp: '2 hours ago' }
  ];

  const tabs = [
    { id: 'token-rules', label: 'Token Rules' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'user-access', label: 'User Access' },
    { id: 'audit-logs', label: 'Audit Logs' }
  ];

  const roles = ['Administrator', 'Front Desk', 'Queue Manager', 'Doctor'];

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // TODO: Implement add user API call based on role
      console.log('Adding user:', { newUserName, newUserEmail, newUserRole });
      setSuccessMessage('User added successfully');
      // Reset form and close dialog
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('Front Desk');
      setShowAddUserDialog(false);
    } catch (err) {
      setError(apiUtils.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement save settings API call
      console.log('Saving settings:', {
        gracePeriod,
        maxSkips,
        autoNoShow,
        allowWalkIn,
        familyBooking,
        sendSMS
      });
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      setError(apiUtils.handleError(err));
    } finally {
      setLoading(false);
    }
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
            <p className="text-gray-500">Configure clinic operations and system preferences</p>
          </div>
          <button 
            onClick={handleSaveSettings}
            disabled={loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 rounded-2xl p-2 mb-6 inline-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`bg-white rounded-lg shadow-sm p-8 ${showAddUserDialog ? 'blur-sm' : ''}`}>
          {/* Token Rules Tab */}
          {activeTab === 'token-rules' && (
            <div>
              <div className="flex items-start gap-3 mb-6">
                <Database className="w-6 h-6 text-gray-700 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Queue & Token Settings</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure how tokens and queues behave</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Grace Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Time allowed for late arrivals before marking as no-show
                  </p>
                </div>

                {/* Maximum Skips */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maximum Skips Allowed
                  </label>
                  <input
                    type="number"
                    value={maxSkips}
                    onChange={(e) => setMaxSkips(e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Maximum times a patient can be skipped before auto-cancellation
                  </p>
                </div>

                {/* Auto No-Show Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Auto No-Show Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={autoNoShow}
                    onChange={(e) => setAutoNoShow(e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Automatically mark as no-show after this delay
                  </p>
                </div>

                {/* Walk-in Patients Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Allow Walk-in Patients</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Enable adding patients without appointments</p>
                  </div>
                  <button
                    onClick={() => setAllowWalkIn(!allowWalkIn)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      allowWalkIn ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        allowWalkIn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Family Bookings Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Enable Family Bookings</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Allow multiple family members in one appointment</p>
                  </div>
                  <button
                    onClick={() => setFamilyBooking(!familyBooking)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      familyBooking ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        familyBooking ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-start gap-3 mb-6">
                <Bell className="w-6 h-6 text-gray-700 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notification Templates</h2>
                  <p className="text-gray-500 text-sm mt-1">Customize messages sent to patients</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Appointment Confirmed */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Appointment Confirmed
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Hi {name}, your appointment with {doctor} is confirmed for {date} at {time}. Token: {token}"
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Appointment Reminder */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Appointment Reminder
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Reminder: You have an appointment with {doctor} tomorrow at {time}. Token: {token}"
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Doctor Started Session */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Doctor Started Session
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="{doctor} has started. Your token is {token}. Current queue position: {position}"
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* You're Next Alert */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    You are Next Alert
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Hi {name}, you're next in line. Please proceed to the consultation room."
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Send SMS Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Send SMS Notifications</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Automatically send SMS updates to patients</p>
                  </div>
                  <button
                    onClick={() => setSendSMS(!sendSMS)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      sendSMS ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        sendSMS ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Access Tab */}
          {activeTab === 'user-access' && (
            <div>
              <div className="flex items-start gap-3 mb-6">
                <Shield className="w-6 h-6 text-gray-700 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Staff Access Control</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage user roles and permissions</p>
                </div>
              </div>

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{user.role}</span>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => setShowAddUserDialog(true)}
                  className="w-full py-3 border-2 border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors mt-4"
                >
                  Add New User
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit-logs' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-500 text-sm mt-1">System audit log for token and appointment changes</p>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-4 border-b border-gray-200 last:border-0">
                    <div>
                      <h3 className="font-medium text-gray-900">{log.action}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {log.user}</p>
                    </div>
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      {showAddUserDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in">
            {/* Dialog Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button 
                onClick={() => setShowAddUserDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddUserDialog(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}