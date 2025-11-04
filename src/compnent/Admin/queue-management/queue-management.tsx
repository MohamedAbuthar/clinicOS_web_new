'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserPlus, GripVertical, Clock, X, AlertCircle, Loader2, CheckCircle, UserCheck, Calendar, Phone, XCircle, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueue } from '@/lib/hooks/useQueue';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { usePatients } from '@/lib/hooks/usePatients';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { apiUtils, Appointment as BaseAppointment, Patient as ApiPatient, Doctor } from '@/lib/api';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// Extended Appointment interface for queue management
interface Appointment extends BaseAppointment {
  checkedInAt?: string | Date | { toDate(): Date };
  acceptanceStatus?: 'accepted' | 'rejected' | 'pending';
  patientName?: string;
  patientPhone?: string;
  queueOrder?: number;
}

// Types
interface Patient {
  id: string;
  tokenNumber: string;
  name: string;
  phone?: string;
  category?: string;
  waitingTime: string;
  status: 'Arrived' | 'Late' | 'Walk-in' | 'Scheduled';
  appointmentDate?: string;
  appointmentTime?: string;
  acceptanceStatus?: string;
  checkedInAt?: string;
}

interface AppointmentQueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  tokenNumber: string;
  name: string;
  phone?: string;
  status: string;
  waitingTime: number;
  appointmentDate: string;
  appointmentTime: string;
  acceptanceStatus?: 'accepted' | 'rejected' | 'pending';
  checkedInAt?: unknown;
  queueOrder?: number;
}

interface CurrentPatient {
  tokenNumber: string;
  name: string;
  phone?: string;
  status: string;
  appointmentDate?: string;
  appointmentTime?: string;
  checkedInAt?: string;
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

// Helper Functions
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return 'Today';
  }
  
  return date.toLocaleDateString();
};

const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return '';
  
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as { toDate(): Date }).toDate === 'function') {
    const date = (timestamp as { toDate(): Date }).toDate();
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  try {
    const date = new Date(timestamp as string | number | Date);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return '';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'scheduled':
      return 'bg-green-500 text-white';
    case 'cancelled':
      return 'bg-red-500 text-white';
    case 'completed':
      return 'bg-blue-500 text-white';
    case 'no_show':
      return 'bg-gray-500 text-white';
    case 'rescheduled':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ children, variant = 'primary', icon, onClick, disabled = false }: ButtonProps) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors";
  const variants: Record<'primary' | 'secondary' | 'danger', string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
};

// Current Patient Card
interface CurrentPatientCardProps {
  patient: CurrentPatient;
  onComplete: () => void;
  disabled?: boolean;
}

const CurrentPatientCard = ({ patient, onComplete, disabled }: CurrentPatientCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Current Patient</h2>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {patient.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-3xl font-bold text-gray-900">{patient.tokenNumber}</p>
          <p className="text-lg text-gray-600 mt-1">{patient.name}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {patient.phone && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                {patient.phone}
              </div>
            )}
            {patient.appointmentDate && patient.appointmentTime && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {formatDate(patient.appointmentDate)} • {formatTime(patient.appointmentTime)}
              </div>
            )}
            {patient.checkedInAt && (
              <div className="flex items-center gap-1 text-sm text-teal-600">
                <UserCheck className="w-4 h-4" />
                Checked in: {String(formatTimestamp(patient.checkedInAt))}
              </div>
            )}
          </div>
        </div>
        <Button variant="primary" onClick={onComplete} disabled={disabled}>
          Complete
        </Button>
      </div>
    </div>
  );
};

// Draggable Queue Item
interface QueueItemProps {
  patient: Patient;
  onSkip: () => void;
  onComplete?: (appointmentId: string) => void;
  isSelected: boolean;
  onDragStart: (index: number, itemId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, itemId: string) => void;
  isDragging: boolean;
  index: number;
}

const QueueItem = ({ patient, onSkip, onComplete, isSelected, onDragStart, onDragEnd, onDragOver, onDrop, isDragging, index }: QueueItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(index, patient.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, patient.id);
  };

  const statusColors: Record<Patient['status'], string> = {
    Arrived: 'bg-green-100 text-green-700',
    Late: 'bg-yellow-100 text-yellow-700',
    'Walk-in': 'bg-blue-100 text-blue-700',
    'Scheduled': 'bg-purple-100 text-purple-700'
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={handleDrop}
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
        <div className="flex items-center gap-4 flex-1">
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-gray-900">{patient.tokenNumber}</p>
            <p className="text-xs text-gray-500">Token</p>
          </div>
          
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{patient.name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {patient.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  {patient.phone}
                </div>
              )}
              {patient.appointmentDate && patient.appointmentTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDate(patient.appointmentDate)} • {formatTime(patient.appointmentTime)}
                </div>
              )}
              {patient.category && (
                <span className="text-xs text-gray-500">{patient.category}</span>
              )}
              <span className="text-xs text-gray-500">• Waiting: {patient.waitingTime}</span>
              {patient.checkedInAt && (
                <span className="text-xs text-teal-600">
                  ✓ Checked in: {String(formatTimestamp(patient.checkedInAt))}
                </span>
              )}
            </div>
            {patient.acceptanceStatus && (
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    patient.acceptanceStatus === 'accepted' 
                      ? 'bg-teal-100 text-teal-700' 
                      : patient.acceptanceStatus === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {patient.acceptanceStatus === 'accepted' ? '✓ Accepted' : 
                   patient.acceptanceStatus === 'rejected' ? '✕ Rejected' : 
                   '⏳ Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[patient.status]}`}>
            {patient.status}
          </span>
          {patient.status === 'Arrived' && onComplete && (
            <button
              onClick={() => {
                console.log('Complete checked-in patient:', patient.id);
                const appointmentId = patient.id.replace('apt-', '');
                onComplete(appointmentId);
              }}
              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              Completed
            </button>
          )}
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
  onEndBreak: () => void;
  isOnBreak: boolean;
  breakEndTime: string;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}

const DoctorBreakDropdown = ({ isOpen, onClose, onSubmit, onEndBreak, isOnBreak, breakEndTime, buttonRef }: DoctorBreakDropdownProps) => {
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' as string | number });

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = buttonRect.bottom + 8;
      let left = buttonRect.left;
      let right: string | number = 'auto';
      
      if (left + dropdownWidth > viewportWidth) {
        right = 16;
        left = viewportWidth - dropdownWidth - 16;
      }
      
      const dropdownHeight = 280;
      if (top + dropdownHeight > viewportHeight) {
        top = buttonRect.top - dropdownHeight - 8;
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
        <h3 className="text-lg font-semibold text-gray-900">
          {isOnBreak ? 'Break Status' : 'Set Break Time'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {isOnBreak ? (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Currently on Break</span>
            </div>
            <p className="text-sm text-yellow-700">
              Break ends at: <span className="font-semibold">{breakEndTime}</span>
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEndBreak();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              End Break Now
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

// Pending Check-in Card Component
interface PendingCheckInCardProps {
  appointment: Appointment;
  patient: ApiPatient;
  onCheckIn: () => void;
  isLoading: boolean;
}

const PendingCheckInCard = ({ appointment, patient, onCheckIn, isLoading }: PendingCheckInCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-center min-w-[60px]">
          <p className="text-xl font-bold text-gray-900">{appointment.tokenNumber}</p>
          <p className="text-xs text-gray-500">Token</p>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{patient?.name || 'Loading...'}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {patient?.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                {patient.phone}
              </div>
            )}
            {appointment.appointmentDate && appointment.appointmentTime && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="w-3 h-3" />
                {formatDate(appointment.appointmentDate)} • {formatTime(appointment.appointmentTime)}
              </div>
            )}
            <div className="text-xs text-teal-600">
              ✓ Checked in: {String(formatTimestamp(appointment.checkedInAt))}
            </div>
          </div>
          {appointment.acceptanceStatus && (
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  appointment.acceptanceStatus === 'accepted' 
                    ? 'bg-teal-100 text-teal-700' 
                    : appointment.acceptanceStatus === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {appointment.acceptanceStatus === 'accepted' ? '✓ Accepted' : 
                 appointment.acceptanceStatus === 'rejected' ? '✕ Rejected' : 
                 '⏳ Pending'}
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onCheckIn}
        disabled={isLoading}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserCheck className="w-4 h-4" />
        )}
        Add to Queue
      </button>
    </div>
  );
};

// All Appointments Table Component
interface AllAppointmentsTableProps {
  appointments: Appointment[];
  patients: ApiPatient[];
  doctors: Doctor[];
  onAppointmentAction: (appointmentId: string, action: string) => void;
  actionLoading: boolean;
}

const AllAppointmentsTable = ({ 
  appointments, 
  patients, 
  doctors, 
  onAppointmentAction, 
  actionLoading 
}: AllAppointmentsTableProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        All Appointments ({appointments.length})
      </h2>
      
      <div className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-11 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <div className="col-span-1 text-sm font-semibold text-gray-600">Token</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Patient</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Doctor</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Date & Time</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Status</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Actions</div>
        </div>

        {/* Table Body */}
        {appointments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {appointments.map((appointment) => {
              const patient = patients.find(p => p.id === appointment.patientId);
              const doctor = doctors.find(d => d.id === appointment.doctorId);
              
              return (
                <div
                  key={appointment.id}
                  className="grid grid-cols-11 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  {/* Token */}
                  <div className="col-span-1">
                    <span className="text-xl font-bold text-teal-500">
                      {appointment.tokenNumber || 'N/A'}
                    </span>
                  </div>

                  {/* Patient */}
                  <div className="col-span-2">
                    <div className="font-semibold text-gray-900">
                      {appointment.patientName || patient?.name || 'Unknown Patient'}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Phone className="w-3 h-3" />
                      {appointment.patientPhone || patient?.phone || 'N/A'}
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="col-span-2">
                    <span className="text-gray-900 font-medium">
                      {doctor?.user?.name || 'Loading...'}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(appointment.appointmentTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                      </span>
                      {appointment.acceptanceStatus && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            appointment.acceptanceStatus === 'accepted' 
                              ? 'bg-teal-100 text-teal-700' 
                              : appointment.acceptanceStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {appointment.acceptanceStatus === 'accepted' ? '✓ Accepted' : 
                           appointment.acceptanceStatus === 'rejected' ? '✕ Rejected' : 
                           '⏳ Pending'}
                        </span>
                      )}
                      {appointment.checkedInAt && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Checked in: {String(formatTimestamp(appointment.checkedInAt) || 'Unknown time')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2 flex-wrap">
                    {appointment.status === 'completed' && 
                     !appointment.checkedInAt && (
                      <button 
                        onClick={() => onAppointmentAction(appointment.id, 'check-in')}
                        disabled={actionLoading}
                        className="text-teal-600 hover:text-teal-800 font-medium transition-colors disabled:opacity-50"
                        title="Check In"
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                    )}
                    
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') ? (
                      <>
                        <button 
                          onClick={() => onAppointmentAction(appointment.id, 'complete')}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-50"
                          title="Mark as Complete"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onAppointmentAction(appointment.id, 'cancel')}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onAppointmentAction(appointment.id, 'no-show')}
                          disabled={actionLoading}
                          className="text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                          title="Mark as No Show"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    ) : appointment.status === 'completed' || appointment.status === 'cancelled' ? (
                      <span className="text-gray-400 text-sm">No actions</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No appointments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function QueueManagementPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingCheckIns, setPendingCheckIns] = useState<Appointment[]>([]);
  const [showCheckInSection, setShowCheckInSection] = useState(true);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [skippedItems, setSkippedItems] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isManualReorder, setIsManualReorder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isBreakDropdownOpen, setIsBreakDropdownOpen] = useState(false);
  const [reorderedQueueItems, setReorderedQueueItems] = useState<AppointmentQueueItem[]>([]);
  const [doctorBreakStatus, setDoctorBreakStatus] = useState<{
    isOnBreak: boolean;
    breakStartTime: string;
    breakEndTime: string;
  }>({
    isOnBreak: false,
    breakStartTime: '',
    breakEndTime: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const breakButtonRef = useRef<HTMLDivElement>(null);
  const lastManualChangeTime = useRef<number>(0);

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
    completePatient,
    checkInPatient,
    getPendingCheckIns,
    refreshQueue,
  } = useQueue();

  const { doctors } = useDoctors();
  const { patients } = usePatients();
  const { assistants } = useAssistants();
  const { 
    appointments, 
    cancelAppointment, 
    completeAppointment,
    markNoShow,
    checkInAppointment 
  } = useAppointments();

  // Filter doctors based on user role
  const getFilteredDoctors = () => {
    if (!isAuthenticated || !currentUser) return doctors;
    
    if (currentUser.role === 'doctor') {
      return doctors.filter(doctor => doctor.userId === currentUser.id);
    } else if (currentUser.role === 'assistant') {
      const assistant = assistants.find(a => a.userId === currentUser.id);
      if (assistant && assistant.assignedDoctors) {
        return doctors.filter(doctor => assistant.assignedDoctors.includes(doctor.id));
      }
      return [];
    }
    
    return doctors;
  };

  // Show error message from hook as toast
  useEffect(() => {
    if (error) {
      toast.error(`❌ ${error}`);
    }
  }, [error]);

  // Update current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Check break status and auto-return from break
  useEffect(() => {
    const checkBreakStatus = () => {
      if (doctorBreakStatus.isOnBreak && doctorBreakStatus.breakEndTime) {
        const now = new Date();
        const currentTimeStr = now.toTimeString().slice(0, 5);
        
        if (currentTimeStr >= doctorBreakStatus.breakEndTime) {
          setDoctorBreakStatus({
            isOnBreak: false,
            breakStartTime: '',
            breakEndTime: ''
          });
          toast.success('✅ Break time ended - Doctor is now active');
        }
      }
    };

    const interval = setInterval(checkBreakStatus, 60000);
    checkBreakStatus();

    return () => clearInterval(interval);
  }, [doctorBreakStatus]);

  // Auto-select doctor for logged-in users (only for doctors and assistants)
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId && currentUser) {
      if (currentUser.role === 'doctor') {
        // For doctors, find the doctor that matches the logged-in user's ID
        const loggedInDoctor = doctors.find(doctor => doctor.userId === currentUser.id);
        if (loggedInDoctor) {
          console.log('Auto-selecting logged-in doctor:', loggedInDoctor);
          setSelectedDoctorId(loggedInDoctor.id);
        } else if (doctors.length > 0) {
          // Fallback to first doctor if exact match not found
          console.log('Auto-selecting first doctor:', doctors[0]);
          setSelectedDoctorId(doctors[0].id);
        }
      } else if (currentUser.role === 'assistant') {
        // For assistants, select first assigned doctor
        const assistant = assistants.find(a => a.userId === currentUser.id);
        if (assistant && assistant.assignedDoctors && assistant.assignedDoctors.length > 0) {
          const filteredDoctors = doctors.filter(doctor => assistant.assignedDoctors.includes(doctor.id));
          if (filteredDoctors.length > 0) {
            console.log('Auto-selecting first assigned doctor:', filteredDoctors[0]);
            setSelectedDoctorId(filteredDoctors[0].id);
          }
        }
      }
    }
  }, [doctors, selectedDoctorId, setSelectedDoctorId, currentUser, assistants]);

  // Filter appointments for selected doctor
  const doctorAppointments = selectedDoctorId 
    ? appointments.filter(apt => apt.doctorId === selectedDoctorId)
    : appointments;

  // Get today's appointments for the selected doctor
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = doctorAppointments.filter(apt => 
    apt.appointmentDate === today && 
    (apt.status === 'scheduled' || apt.status === 'confirmed')
  );

  // Create queue items from today's appointments
  const appointmentQueueItems: AppointmentQueueItem[] = useMemo(() => {
    return todayAppointments
      .filter(appointment => !skippedItems.has(`apt-${appointment.id}`))
      .map((appointment, index) => {
      const patient = patients.find(p => p.id === appointment.patientId);
      let waitingTime = 0;
      
      if (appointment.checkedInAt) {
        try {
          if (typeof appointment.checkedInAt === 'object' && appointment.checkedInAt !== null && 'toDate' in appointment.checkedInAt && typeof (appointment.checkedInAt as { toDate(): Date }).toDate === 'function') {
            const checkedInDate = (appointment.checkedInAt as { toDate(): Date }).toDate();
            waitingTime = Math.floor((currentTime - checkedInDate.getTime()) / (1000 * 60));
          } else {
            const checkedInDate = new Date(appointment.checkedInAt as string | number | Date);
            if (!isNaN(checkedInDate.getTime())) {
              waitingTime = Math.floor((currentTime - checkedInDate.getTime()) / (1000 * 60));
            }
          }
        } catch {
          waitingTime = 0;
        }
      }
      
      return {
        id: `apt-${appointment.id}`,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        tokenNumber: appointment.tokenNumber || `#${index + 1}`,
        name: (appointment as Appointment).patientName || patient?.name || 'Unknown Patient',
        phone: (appointment as Appointment).patientPhone || patient?.phone,
        status: appointment.checkedInAt ? 'checked_in' : 'waiting',
        waitingTime,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        acceptanceStatus: (appointment as Appointment).acceptanceStatus,
        checkedInAt: appointment.checkedInAt,
        queueOrder: (appointment as Appointment).queueOrder,
      };
    });
  }, [todayAppointments, skippedItems, patients, currentTime]);

  appointmentQueueItems.sort((a, b) => {
    if (a.queueOrder !== undefined && b.queueOrder !== undefined) {
      return a.queueOrder - b.queueOrder;
    }
    if (a.queueOrder !== undefined && b.queueOrder === undefined) {
      return -1;
    }
    if (a.queueOrder === undefined && b.queueOrder !== undefined) {
      return 1;
    }
    if (a.appointmentTime && b.appointmentTime) {
      return a.appointmentTime.localeCompare(b.appointmentTime);
    }
    return 0;
  });

  // Debug: Log data when it changes
  useEffect(() => {
    console.log('=== QUEUE DATA UPDATE ===');
    console.log('Current Patient:', currentPatient);
    console.log('Waiting Queue Length:', waitingQueue.length);
    console.log('Waiting Queue:', waitingQueue);
    console.log('Appointment Queue Items Length:', appointmentQueueItems.length);
    console.log('Appointment Queue Items:', appointmentQueueItems);
    console.log('Today Appointments:', todayAppointments.length);
    console.log('Queue Stats:', queueStats);
    console.log('Pending Check-ins:', pendingCheckIns.length);
    console.log('All Appointments:', appointments.length);
  }, [currentPatient, waitingQueue, queueStats, pendingCheckIns, appointments, appointmentQueueItems, todayAppointments]);

  // Fetch pending check-ins when doctor is selected
  useEffect(() => {
    const fetchPendingCheckIns = async () => {
      if (selectedDoctorId) {
        const today = new Date().toISOString().split('T')[0];
        console.log('=== FETCHING PENDING CHECK-INS ===');
        console.log('Selected Doctor ID:', selectedDoctorId);
        console.log('Today\'s Date:', today);
        
        const pending = await getPendingCheckIns(selectedDoctorId, today);
        console.log('Pending Check-ins Found:', pending.length);
        console.log('Pending Check-ins Data:', pending);
        
        setPendingCheckIns(pending);
      }
    };
    
    fetchPendingCheckIns();
  }, [selectedDoctorId, getPendingCheckIns]);

  // Load saved queue order from database when appointments are loaded for selected doctor
  useEffect(() => {
    if (isManualReorder) {
      console.log('⏸️ Skipping queue order loading - manual reorder in progress');
      return;
    }

    const timeSinceLastChange = Date.now() - lastManualChangeTime.current;
    if (timeSinceLastChange < 10000) {
      console.log(`⏸️ Skipping queue order loading - manual change was ${timeSinceLastChange}ms ago`);
      return;
    }

    console.log('=== QUEUE ORDER LOADING ===');
    console.log('Selected Doctor ID:', selectedDoctorId);
    console.log('Appointment Queue Items Length:', appointmentQueueItems.length);
    
    if (appointmentQueueItems.length > 0 && selectedDoctorId) {
      const hasQueueOrder = appointmentQueueItems.some(item => item.queueOrder !== undefined && item.queueOrder !== null);
      console.log('Has Queue Order:', hasQueueOrder);
      
      if (hasQueueOrder) {
        if (reorderedQueueItems.length === 0) {
          setReorderedQueueItems([...appointmentQueueItems]);
          console.log('✅ Loaded saved queue order from database');
        } else {
          console.log('⏸️ Skipping queue order loading - reordered items already exist');
        }
      } else {
        console.log('❌ No saved queue order found, using default order (by appointment time)');
        if (reorderedQueueItems.length > 0) {
          setReorderedQueueItems([]);
        }
      }
    } else if (selectedDoctorId && appointmentQueueItems.length === 0) {
      console.log('❌ No appointments for selected doctor');
      if (reorderedQueueItems.length > 0) {
        setReorderedQueueItems([]);
      }
    }
    console.log('========================');
  }, [appointmentQueueItems, selectedDoctorId, isManualReorder]);

  // Reset skipped items, reordered queue, and manual reorder flag when doctor changes
  useEffect(() => {
    setSkippedItems(new Set());
    setReorderedQueueItems([]);
    setIsManualReorder(false);
    setCurrentPage(1); // Reset pagination when doctor changes
    console.log('Doctor changed - reset queue state');
  }, [selectedDoctorId]);

  // Debug: Log when reorderedQueueItems changes
  useEffect(() => {
    console.log('🔄 reorderedQueueItems changed:', reorderedQueueItems.map(item => ({ name: item.name, id: item.id, queueOrder: item.queueOrder })));
  }, [reorderedQueueItems]);

  // Debug: Log when appointmentQueueItems change
  useEffect(() => {
    console.log('📋 appointmentQueueItems changed:', appointmentQueueItems.map(item => ({ name: item.name, id: item.id, queueOrder: item.queueOrder })));
  }, [appointmentQueueItems]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const quickActions: QuickAction[] = [
    {
      label: 'Call Next Patient',
      onClick: async () => {
        setActionLoading(true);
        const success = await callNextPatient();
        setActionLoading(false);
        if (success) {
          toast.success('✅ Next patient called successfully');
        } else {
          toast.error('❌ Failed to call next patient');
        }
      }
    },
    {
      label: 'Refresh Queue',
      onClick: async () => {
        setActionLoading(true);
        await refreshQueue();
        if (selectedDoctorId) {
          const today = new Date().toISOString().split('T')[0];
          const pending = await getPendingCheckIns(selectedDoctorId, today);
          setPendingCheckIns(pending);
        }
        setActionLoading(false);
        toast.success('✅ Queue refreshed');
      }
    },
    {
      label: showAllAppointments ? 'Hide All Appointments' : 'Show All Appointments',
      onClick: () => setShowAllAppointments(!showAllAppointments)
    },
    {
      label: 'Reset Queue Order',
      onClick: async () => {
        try {
          const updates = appointmentQueueItems.map(item => {
            const appointmentId = item.id.replace('apt-', '');
            console.log(`Clearing queue order for appointment ${appointmentId}`);
            return updateDoc(doc(db, 'appointments', appointmentId), {
              queueOrder: null
            });
          });
          
          await Promise.all(updates);
          console.log('✅ Queue orders cleared from database');
        } catch (error) {
          console.error('❌ Error clearing queue orders:', error);
        }
        
        setReorderedQueueItems([]);
        setIsManualReorder(false);
        toast.success('✅ Queue order reset to original (by appointment time)');
      }
    },
    {
      label: `Restore Skipped (${skippedItems.size})`,
      onClick: () => {
        setSkippedItems(new Set());
        toast.success('✅ Skipped items restored');
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
      toast.success('✅ Patient consultation completed');
    } else {
      toast.error('❌ Failed to complete consultation');
    }
  };

  const handleSkip = async (queueItemId: string) => {
    setActionLoading(true);
    
    try {
      if (queueItemId.startsWith('apt-')) {
        setSkippedItems(prev => new Set([...prev, queueItemId]));
        
        if (reorderedQueueItems.length > 0) {
          const newReorderedItems = reorderedQueueItems.filter(item => item.id !== queueItemId);
          setReorderedQueueItems(newReorderedItems);
        }
        
        const skippedItem = appointmentQueueItems.find(item => item.id === queueItemId);
        if (skippedItem) {
          console.log('Skipped appointment:', skippedItem);
          toast.success(`✅ Token ${skippedItem.tokenNumber} skipped successfully`);
        }
      } else {
        const success = await skipPatient(queueItemId, 'Skipped by assistant');
        if (success) {
          toast.success('✅ Patient skipped successfully');
        } else {
          toast.error('❌ Failed to skip patient');
        }
      }
    } catch (error) {
      console.error('Skip error:', error);
      toast.error('❌ Failed to skip patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragStart = (index: number, itemId: string) => {
    console.log(`🟡 Drag started for index: ${index}, itemId: ${itemId}`);
    setDraggedIndex(index);
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    console.log(`🟡 Drag ended`);
    setDraggedIndex(null);
    setDraggedItemId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent, dropItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItemId === null || draggedItemId === dropItemId) {
      setDraggedIndex(null);
      setDraggedItemId(null);
      return;
    }

    console.log(`=== DRAG AND DROP ===`);
    console.log(`Dragged item ID: ${draggedItemId}, Dropped on item ID: ${dropItemId}`);

    setIsManualReorder(true);
    lastManualChangeTime.current = Date.now();

    const currentItems = reorderedQueueItems.length > 0 ? reorderedQueueItems : appointmentQueueItems;
    console.log('Current items before reorder:', currentItems.map(item => ({ name: item.name, id: item.id })));
    
    const draggedIndex = currentItems.findIndex(item => item.id === draggedItemId);
    const dropIndex = currentItems.findIndex(item => item.id === dropItemId);
    
    if (draggedIndex === -1 || dropIndex === -1) {
      console.error('Could not find dragged or drop item');
      setDraggedIndex(null);
      setDraggedItemId(null);
      return;
    }
    
    console.log(`Found dragged item at index: ${draggedIndex}, drop item at index: ${dropIndex}`);
    
    const newItems = [...currentItems];
    const draggedItem = newItems[draggedIndex];
    
    newItems.splice(draggedIndex, 1);
    
    const newDropIndex = newItems.findIndex(item => item.id === dropItemId);
    
    newItems.splice(newDropIndex, 0, draggedItem);
    
    console.log('New items after reorder:', newItems.map(item => ({ name: item.name, id: item.id })));
    
    setReorderedQueueItems(newItems);
    
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      queueOrder: index + 1
    }));
    
    setReorderedQueueItems(updatedItems);
    
    try {
      const updates = updatedItems.map((item, index) => {
        const appointmentId = item.id.replace('apt-', '');
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
          console.log(`Saving queue order for appointment ${appointmentId}: position ${index + 1}`);
          return updateDoc(doc(db, 'appointments', appointmentId), {
            queueOrder: index + 1
          });
        }
        console.log(`Could not find appointment for ID: ${appointmentId}`);
        return Promise.resolve();
      });
      
      await Promise.all(updates);
      console.log('✅ Queue order saved to database');
      toast.success('✅ Queue order saved successfully');
      
      setTimeout(() => {
        setIsManualReorder(false);
        console.log('Manual reorder flag reset - database should now have correct order');
      }, 15000);
    } catch (error) {
      console.error('❌ Error saving queue order:', error);
      toast.error('❌ Failed to save queue order');
    }
    
    console.log(`✅ Moved item ${draggedItemId} to position of ${dropItemId}`);
    setDraggedIndex(null);
    setDraggedItemId(null);
  };

  const handleBreakSubmit = async (fromTime: string, toTime: string) => {
    console.log('Doctor break set from', fromTime, 'to', toTime);
    
    if (fromTime >= toTime) {
      toast.error('❌ End time must be after start time');
      return;
    }

    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    
    if (fromTime <= currentTimeStr && toTime > currentTimeStr) {
      setDoctorBreakStatus({
        isOnBreak: true,
        breakStartTime: fromTime,
        breakEndTime: toTime
      });
      toast.success(`✅ Doctor is now on break until ${toTime}`);
    } else if (fromTime > currentTimeStr) {
      toast.success(`✅ Break scheduled from ${fromTime} to ${toTime}`);
    } else {
      toast.warning('⚠️ Break time has already passed');
    }

    if (selectedDoctorId) {
      try {
        await updateDoc(doc(db, 'doctors', selectedDoctorId), {
          status: fromTime <= currentTimeStr && toTime > currentTimeStr ? 'Break' : 'In',
          breakStartTime: fromTime,
          breakEndTime: toTime
        });
        console.log('Doctor break status updated in database');
      } catch (error) {
        console.error('Error updating doctor break status:', error);
      }
    }
  };

  const handleEndBreak = async () => {
    setDoctorBreakStatus({
      isOnBreak: false,
      breakStartTime: '',
      breakEndTime: ''
    });
    toast.success('✅ Break ended - Doctor is now active');

    if (selectedDoctorId) {
      try {
        await updateDoc(doc(db, 'doctors', selectedDoctorId), {
          status: 'In',
          breakStartTime: null,
          breakEndTime: null
        });
        console.log('Doctor break ended in database');
      } catch (error) {
        console.error('Error ending doctor break:', error);
      }
    }
  };

  const handleCheckIn = async (appointment: Appointment) => {
    if (!selectedDoctorId) return;
    
    setActionLoading(true);
    const success = await checkInPatient(
      appointment.id,
      appointment.patientId,
      selectedDoctorId,
      appointment.tokenNumber || ''
    );
    setActionLoading(false);
    
    if (success) {
      toast.success(`✅ Patient ${appointment.tokenNumber} added to queue successfully`);
      const today = new Date().toISOString().split('T')[0];
      const pending = await getPendingCheckIns(selectedDoctorId, today);
      setPendingCheckIns(pending);
    } else {
      toast.error('❌ Failed to add patient to queue');
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    try {
      console.log('=== APPOINTMENT ACTION ===');
      console.log('Appointment ID:', appointmentId);
      console.log('Action:', action);
      
      let success = false;
      
      switch (action) {
        case 'cancel':
          success = await cancelAppointment(appointmentId, 'Cancelled by admin');
          break;
        case 'complete':
          success = await completeAppointment(appointmentId);
          break;
        case 'no-show':
          success = await markNoShow(appointmentId);
          break;
        case 'check-in':
          console.log('Executing check-in...');
          success = await checkInAppointment(appointmentId);
          console.log('Check-in result:', success);
          break;
        default:
          success = false;
      }

      if (success) {
        const actionMessages: Record<string, string> = {
          'check-in': 'checked in successfully',
          'cancel': 'cancelled',
          'complete': 'completed',
          'no-show': 'marked as no-show'
        };
        toast.success(`✅ Appointment ${actionMessages[action] || action + 'ed'} successfully`);
        
        await refreshQueue();
        if (selectedDoctorId) {
          const today = new Date().toISOString().split('T')[0];
          const pending = await getPendingCheckIns(selectedDoctorId, today);
          setPendingCheckIns(pending);
        }
      } else {
        toast.error(`❌ Failed to ${action} appointment`);
      }
    } catch (err) {
      console.error('Appointment action error:', err);
      toast.error(`❌ ${apiUtils.handleError(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    setActionLoading(true);
    try {
      console.log('=== COMPLETING APPOINTMENT ===');
      console.log('Appointment ID:', appointmentId);
      
      const success = await completeAppointment(appointmentId);
      
      if (success) {
        toast.success('✅ Appointment completed successfully and removed from queue');
        
        await refreshQueue();
        if (selectedDoctorId) {
          const today = new Date().toISOString().split('T')[0];
          const pending = await getPendingCheckIns(selectedDoctorId, today);
          setPendingCheckIns(pending);
        }
      } else {
        toast.error('❌ Failed to complete appointment');
      }
    } catch (err) {
      console.error('Complete appointment error:', err);
      toast.error('❌ Failed to complete appointment');
    } finally {
      setActionLoading(false);
    }
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

  // Only show "Select a Doctor" screen for admin when no doctor is selected
  // Doctors and assistants always have a doctor auto-selected
  if (!selectedDoctorId && currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time token board for selected doctor
              </p>
              {currentUser && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
                  👨‍💼 Admin View
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Doctor</option>
                {getFilteredDoctors().map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Doctor</h2>
            <p className="text-gray-600 mb-6">
              Please select a doctor from the dropdown above to view their queue and appointments.
            </p>
            <div className="text-sm text-gray-500">
              Available doctors: {getFilteredDoctors().length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const queueToDisplay = reorderedQueueItems.length > 0 ? reorderedQueueItems : appointmentQueueItems;
  const totalPages = Math.ceil(queueToDisplay.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = queueToDisplay.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser?.role === 'doctor' 
                ? 'Your Queue Management' 
                : currentUser?.role === 'assistant'
                ? 'Assigned Doctors Queue Management'
                : 'Queue Management'
              }
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentUser?.role === 'doctor' 
                ? `Real-time token board for ${selectedDoctor?.user?.name || 'your patients'}`
                : currentUser?.role === 'assistant'
                ? `Real-time token board for ${selectedDoctor?.user?.name || 'assigned doctors'}`
                : `Real-time token board for ${selectedDoctor?.user?.name || 'Select a doctor'}`
              }
            </p>
            {currentUser && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
                {currentUser.role === 'doctor' && '👨‍⚕️ Doctor View'}
                {currentUser.role === 'assistant' && '👩‍💼 Assistant View'}
                {currentUser.role === 'admin' && '👨‍💼 Admin View'}
              </div>
            )}
          </div>
          {/* Show doctor selector only for admin */}
          {currentUser?.role === 'admin' && (
            <div className="flex gap-3">
              <select
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Doctor</option>
                {getFilteredDoctors().map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user?.name || 'Unknown'} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Doctor Break Dropdown */}
        <DoctorBreakDropdown
          isOpen={isBreakDropdownOpen}
          onClose={() => setIsBreakDropdownOpen(false)}
          onSubmit={handleBreakSubmit}
          onEndBreak={handleEndBreak}
          isOnBreak={doctorBreakStatus.isOnBreak}
          breakEndTime={doctorBreakStatus.breakEndTime}
          buttonRef={breakButtonRef}
        />

        {/* Appointment Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Appointments Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayAppointments.length}</div>
              <div className="text-sm text-blue-700">Total Appointments</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {todayAppointments.filter(apt => apt.checkedInAt).length}
              </div>
              <div className="text-sm text-green-700">Checked In</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {todayAppointments.filter(apt => !apt.checkedInAt && (apt.status === 'scheduled' || apt.status === 'confirmed')).length}
              </div>
              <div className="text-sm text-yellow-700">Waiting to Check In</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {todayAppointments.filter(apt => apt.status === 'completed').length}
              </div>
              <div className="text-sm text-purple-700">Completed</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Queue Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Checked-in Patients Section */}
            {showCheckInSection && pendingCheckIns.length > 0 && (
              <div className="bg-white rounded-lg border border-teal-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Checked-in Patients ({pendingCheckIns.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowCheckInSection(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Patients are ordered by check-in time
                </p>
                <div className="space-y-3">
                  {pendingCheckIns.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    return (
                      <PendingCheckInCard
                        key={appointment.id}
                        appointment={appointment}
                        patient={patient || { id: '', name: 'Unknown', email: '', phone: '', dateOfBirth: '', gender: 'other', isActive: true, createdAt: '', updatedAt: '' }}
                        onCheckIn={() => handleCheckIn(appointment)}
                        isLoading={actionLoading}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show/Hide Check-in Section Button */}
            {!showCheckInSection && pendingCheckIns.length > 0 && (
              <button
                onClick={() => setShowCheckInSection(true)}
                className="w-full p-4 bg-teal-100 border border-teal-300 rounded-lg text-teal-700 font-medium hover:bg-teal-200 transition-colors flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                Show {pendingCheckIns.length} Checked-in Patient{pendingCheckIns.length !== 1 ? 's' : ''}
              </button>
            )}

            {/* Current Patient */}
            {currentPatient ? (
              <CurrentPatientCard 
                patient={{
                  tokenNumber: currentPatient.tokenNumber,
                  name: patients.find(p => p.id === currentPatient.patientId)?.name || 'Loading...',
                  phone: patients.find(p => p.id === currentPatient.patientId)?.phone,
                  status: 'Arrived' as const,
                  appointmentDate: appointments.find(apt => apt.id === currentPatient.appointmentId)?.appointmentDate,
                  appointmentTime: appointments.find(apt => apt.id === currentPatient.appointmentId)?.appointmentTime,
                  checkedInAt: appointments.find(apt => apt.id === currentPatient.appointmentId)?.checkedInAt,
                }}
                onComplete={handleComplete}
                disabled={actionLoading}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No current patient</p>
              </div>
            )}

            {/* Waiting Queue with Pagination */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Waiting Queue ({queueToDisplay.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Queue Order:</span>
                  {reorderedQueueItems.length > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Saved Order
                    </span>
                  )}
                  {queueToDisplay.length > 0 && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                      {queueToDisplay.map((item, idx) => (
                        <span key={item.id}>
                          {item.tokenNumber || idx + 1}
                          {idx < queueToDisplay.length - 1 && ' → '}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {/* Pagination Info */}
              {queueToDisplay.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, queueToDisplay.length)} of {queueToDisplay.length} patients
                </div>
              )}
              
              <div className="space-y-3">
                {queueToDisplay.length > 0 ? (
                  <>
                    {/* Paginated Queue Items */}
                    {paginatedItems.map((queueItem, index) => {
                      const actualIndex = startIndex + index;
                      return (
                        <div key={queueItem.id} className="relative">
                          {/* Position Badge */}
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                              {actualIndex + 1}
                            </div>
                          </div>
                          
                          <QueueItem
                            patient={{
                              id: queueItem.id,
                              tokenNumber: queueItem.tokenNumber,
                              name: queueItem.name,
                              phone: queueItem.phone,
                              category: queueItem.status === 'checked_in' ? 'Checked In' : 'Scheduled',
                              waitingTime: queueItem.waitingTime ? `${queueItem.waitingTime} min` : '0 min',
                              status: (queueItem.status === 'checked_in' ? 'Arrived' : 
                                      queueItem.status === 'waiting' ? 'Scheduled' : 
                                      'Walk-in') as 'Arrived' | 'Late' | 'Walk-in' | 'Scheduled',
                              appointmentDate: queueItem.appointmentDate,
                              appointmentTime: queueItem.appointmentTime,
                              acceptanceStatus: queueItem.acceptanceStatus,
                              checkedInAt: queueItem.checkedInAt ? formatTimestamp(queueItem.checkedInAt) : undefined,
                            }}
                            onSkip={() => handleSkip(queueItem.id)}
                            onComplete={handleCompleteAppointment}
                            isSelected={actualIndex === 0}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            isDragging={draggedIndex === actualIndex}
                            index={actualIndex}
                          />
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-200 mt-6">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                                currentPage === pageNum
                                  ? 'bg-teal-600 text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No appointments for today
                  </div>
                )}
              </div>
            </div>

            {/* All Appointments Table - Only show when showAllAppointments is true */}
            {showAllAppointments && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Appointments ({doctorAppointments.length})
                  </h2>
                  <button
                    onClick={() => setShowAllAppointments(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Hide All Appointments
                  </button>
                </div>
              
                <AllAppointmentsTable
                  appointments={doctorAppointments as Appointment[]}
                  patients={patients}
                  doctors={doctors as unknown as Doctor[]}
                  onAppointmentAction={handleAppointmentAction}
                  actionLoading={actionLoading}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor Status */}
            <DoctorStatusCard doctorStatus={{
              status: doctorBreakStatus.isOnBreak ? 'On Break' : 
                      selectedDoctor?.status === 'In' ? 'Active' : 
                      selectedDoctor?.status === 'Break' ? 'Break' : 'Offline',
              avgConsultTime: selectedDoctor?.consultationDuration ? `${selectedDoctor.consultationDuration} min` : 'N/A',
              patientsServed: queueStats?.completed || 0,
              estimatedComplete: doctorBreakStatus.isOnBreak ? `Until ${doctorBreakStatus.breakEndTime}` : 'N/A'
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
