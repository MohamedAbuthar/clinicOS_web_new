"use client"

import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, GripVertical, Clock, X, AlertCircle, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { useQueue } from '@/lib/hooks/useQueue';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { usePatients } from '@/lib/hooks/usePatients';
import { apiUtils } from '@/lib/api';

// Types
interface Patient {
  id: string;
  tokenNumber: string;
  name: string;
  category?: string;
  waitingTime: string;
  status: 'Arrived' | 'Late' | 'Walk-in';
}

interface CurrentPatient {
  tokenNumber: string;
  name: string;
  status: string;
}

interface DoctorStatus {
  status: string;
  avgConsultTime: string;
  patientsServed: number;
  estimatedComplete: string;
}

interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
}

interface QuickAction {
  label: string;
  onClick: () => void;
  variant?: 'danger';
}

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const Button = ({ children, variant = 'primary', icon, onClick }: ButtonProps) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors";
  const variants: Record<'primary' | 'secondary' | 'danger', string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]}`} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
};

// Current Patient Card
interface CurrentPatientCardProps {
  patient: CurrentPatient;
  onComplete: () => void;
}

const CurrentPatientCard = ({ patient, onComplete }: CurrentPatientCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">Current Patient</h2>
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        {patient.status}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-bold text-gray-900">{patient.tokenNumber}</p>
        <p className="text-lg text-gray-600 mt-1">{patient.name}</p>
      </div>
      <Button variant="primary" onClick={onComplete}>
        Complete
      </Button>
    </div>
  </div>
);

// Draggable Queue Item
interface QueueItemProps {
  patient: Patient;
  index: number;
  onSkip: () => void;
  isSelected: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
}

const QueueItem = ({ patient, index, onSkip, isSelected, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }: QueueItemProps) => {
  const statusColors: Record<Patient['status'], string> = {
    Arrived: 'bg-green-100 text-green-700',
    Late: 'bg-yellow-100 text-yellow-700',
    'Walk-in': 'bg-blue-100 text-blue-700'
  };
  console.log(index);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-move ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : isDragging
          ? 'border-gray-300 bg-gray-100 opacity-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
      
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-gray-900">{patient.tokenNumber}</p>
            <p className="text-xs text-gray-500">Token</p>
          </div>
          
          <div>
            <p className="font-semibold text-gray-900">{patient.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {patient.category && (
                <span className="text-xs text-gray-500">{patient.category}</span>
              )}
              <span className="text-xs text-gray-500">• Waiting: {patient.waitingTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[patient.status]}`}>
            {patient.status}
          </span>
          <button
            onClick={onSkip}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

// Doctor Status Card
interface DoctorStatusCardProps {
  doctorStatus: DoctorStatus;
}

const DoctorStatusCard = ({ doctorStatus }: DoctorStatusCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-sm font-semibold text-gray-900 mb-4">Doctor Status</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">Status</span>
        <span className="text-sm font-medium text-green-600">{doctorStatus.status}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">Avg. Consult Time</span>
        <span className="text-sm font-medium text-gray-900">{doctorStatus.avgConsultTime}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">Patients Served</span>
        <span className="text-sm font-medium text-gray-900">{doctorStatus.patientsServed}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">Est. Complete</span>
        <span className="text-sm font-medium text-gray-900">{doctorStatus.estimatedComplete}</span>
      </div>
    </div>
  </div>
);

// Quick Actions Card
const QuickActionsCard = ({ actions }: { actions: QuickAction[] }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
    <div className="space-y-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action.variant === 'danger'
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  </div>
);

// Activity Item
const ActivityItem = ({ activity }: { activity: Activity }) => {
  const typeColors = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[activity.type].replace('text', 'bg')}`} />
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
      </div>
    </div>
  );
};

// Doctor Break Dropdown
interface DoctorBreakDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fromTime: string, toTime: string) => void;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}

const DoctorBreakDropdown = ({ isOpen, onClose, onSubmit, buttonRef }: DoctorBreakDropdownProps) => {
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' as string | number });

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320; // Width of dropdown (w-80 = 320px)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = buttonRect.bottom + 8;
      let left = buttonRect.left;
      let right: string | number = 'auto';
      
      // Check if dropdown goes beyond right edge
      if (left + dropdownWidth > viewportWidth) {
        right = 16; // 1rem padding from right edge
        left = viewportWidth - dropdownWidth - 16;
      }
      
      // Check if dropdown goes beyond bottom edge
      const dropdownHeight = 280; // Approximate height
      if (top + dropdownHeight > viewportHeight) {
        top = buttonRect.top - dropdownHeight - 8; // Show above button
      }
      
      setPosition({ top, left, right });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const handleSubmit = () => {
    if (fromTime && toTime) {
      onSubmit(fromTime, toTime);
      setFromTime('');
      setToTime('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000
      }}
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 w-80"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Set Break Time</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fromTime || !toTime}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm Break
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function QueueManagementPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    currentPatient,
    waitingQueue,
    queueStats,
    activities,
    loading,
    error,
    selectedDoctorId,
    setSelectedDoctorId,
    callNextPatient,
    skipPatient,
    reinsertPatient,
    completePatient,
    updateQueuePosition,
  } = useQueue();

  const { doctors } = useDoctors();
  const { patients } = usePatients();

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-select first doctor if available
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId, setSelectedDoctorId]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isBreakDropdownOpen, setIsBreakDropdownOpen] = useState(false);
  const breakButtonRef = useRef<HTMLDivElement>(null);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const quickActions: QuickAction[] = [
    {
      label: 'Call Next Patient',
      onClick: async () => {
        setActionLoading(true);
        const success = await callNextPatient();
        setActionLoading(false);
        if (success) {
          setSuccessMessage('Next patient called successfully');
        } else {
          setSuccessMessage('Failed to call next patient');
        }
      }
    },
    {
      label: 'Refresh Queue',
      onClick: async () => {
        setActionLoading(true);
        // Refresh logic would go here
        setActionLoading(false);
        setSuccessMessage('Queue refreshed');
      }
    },
    {
      label: 'End Session',
      onClick: () => console.log('End session'),
      variant: 'danger'
    }
  ];

  const handleComplete = async () => {
    if (!currentPatient) return;
    
    setActionLoading(true);
    const success = await completePatient(currentPatient.id);
    setActionLoading(false);
    
    if (success) {
      setSuccessMessage('Patient consultation completed');
    } else {
      setSuccessMessage('Failed to complete consultation');
    }
  };

  const handleSkip = async (queueItemId: string) => {
    setActionLoading(true);
    const success = await skipPatient(queueItemId, 'Skipped by assistant');
    setActionLoading(false);
    
    if (success) {
      setSuccessMessage('Patient skipped successfully');
    } else {
      setSuccessMessage('Failed to skip patient');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null) return;

    const draggedItem = waitingQueue[draggedIndex];
    if (!draggedItem) return;

    setActionLoading(true);
    const success = await updateQueuePosition(draggedItem.id, dropIndex + 1);
    setActionLoading(false);

    if (success) {
      setSuccessMessage('Queue position updated successfully');
    } else {
      setSuccessMessage('Failed to update queue position');
    }

    setDraggedIndex(null);
  };

  const handleBreakSubmit = (fromTime: string, toTime: string) => {
    console.log('Doctor break set from', fromTime, 'to', toTime);
    // Add your break logic here
  };

  if (loading && !currentPatient && waitingQueue.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading queue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time token board for {selectedDoctor?.user.name || 'Select a doctor'}
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name} - {doctor.specialty}
                </option>
              ))}
            </select>
            <Button variant="secondary" icon={<UserPlus className="w-4 h-4" />}>
              Add Walk-in
            </Button>
            <div ref={breakButtonRef}>
              <Button 
                variant="primary"
                onClick={() => setIsBreakDropdownOpen(!isBreakDropdownOpen)}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Doctor Break'}
              </Button>
            </div>
          </div>
        </div>

        {/* Doctor Break Dropdown */}
        <DoctorBreakDropdown
          isOpen={isBreakDropdownOpen}
          onClose={() => setIsBreakDropdownOpen(false)}
          onSubmit={handleBreakSubmit}
          buttonRef={breakButtonRef}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Queue Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Patient */}
            {currentPatient ? (
              <CurrentPatientCard 
                patient={{
                  tokenNumber: currentPatient.tokenNumber,
                  name: patients.find(p => p.id === currentPatient.patientId)?.name || 'Loading...',
                  status: currentPatient.status === 'current' ? 'Arrived' : currentPatient.status
                }}
                onComplete={handleComplete}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No current patient</p>
              </div>
            )}

            {/* Waiting Queue */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Waiting Queue ({waitingQueue.length})
              </h2>
              <div className="space-y-3">
                {waitingQueue.length > 0 ? (
                  waitingQueue.map((queueItem, index) => {
                    const patient = patients.find(p => p.id === queueItem.patientId);
                    return (
                      <QueueItem
                        key={queueItem.id}
                        patient={{
                          id: queueItem.id,
                          tokenNumber: queueItem.tokenNumber,
                          name: patient?.name || 'Loading...',
                          category: patient?.familyId ? 'Family' : undefined,
                          waitingTime: queueItem.waitingTime ? `${queueItem.waitingTime} min` : '0 min',
                          status: queueItem.status === 'waiting' ? 'Arrived' : 
                                  queueItem.status === 'skipped' ? 'Late' : 
                                  queueItem.status
                        }}
                        index={index + 1}
                        onSkip={() => handleSkip(queueItem.id)}
                        isSelected={index === 0}
                        onDragStart={() => handleDragStart(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        isDragging={draggedIndex === index}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No patients in waiting queue
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor Status */}
            <DoctorStatusCard doctorStatus={{
              status: selectedDoctor?.status === 'active' ? 'Active' : 
                      selectedDoctor?.status === 'break' ? 'Break' : 'Offline',
              avgConsultTime: selectedDoctor?.consultationDuration ? `${selectedDoctor.consultationDuration} min` : 'N/A',
              patientsServed: queueStats?.averageWaitTime ? Math.round(queueStats.averageWaitTime) : 0,
              estimatedComplete: selectedDoctor?.estimatedLastPatient || 'N/A'
            }} />

            {/* Quick Actions */}
            <QuickActionsCard actions={quickActions} />

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}