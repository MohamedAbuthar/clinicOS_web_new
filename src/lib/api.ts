// Type definitions for ClinicOS
// NOTE: All API functions have been moved to Firebase
// Import from '@/lib/firebase/firestore' or '@/lib/firebase/auth' instead

import { RecentVisit } from '@/compnent/reusable/RecentVisitCard';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationDuration: number;
  isActive: boolean;
  currentToken?: string;
  queueLength: number;
  estimatedLastPatient?: string;
  status: 'active' | 'break' | 'offline';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

export interface Assistant {
  id: string;
  userId: string;
  assignedDoctors: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  chronicConditions?: string;
  familyId?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  source: 'web' | 'assistant' | 'walk_in' | 'phone';
  notes?: string;
  tokenNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithDetails extends Appointment {
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  room?: string;
  token?: string;
  cancellationReason?: string;
  reason?: string;
}

export interface AppointmentStats {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  rescheduled: number;
  averageWaitTime: number;
}

// Queue Types
export interface QueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  tokenNumber: string;
  position: number;
  status: 'waiting' | 'current' | 'completed' | 'skipped' | 'cancelled';
  arrivedAt?: string;
  calledAt?: string;
  completedAt?: string;
  skippedAt?: string;
  waitingTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueAnalytics {
  averageWaitTime: number;
  busiestHours: { hour: number; count: number }[];
  delayPatterns: { day: string; averageDelay: number }[];
  skipRate: number;
}

// Schedule Types
export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleOverride {
  id: string;
  doctorId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  type: 'holiday' | 'extended_hours' | 'reduced_hours';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medical Records Types
export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  reportType: string;
  reportDate: string;
  findings: string;
  recommendations: string;
  doctorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  prescriptionDate: string;
  diagnosis: string;
  doctorName: string;
  medications: PrescriptionMedication[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Vaccination {
  id: string;
  patientId: string;
  vaccineName: string;
  vaccineType: string;
  vaccinationDate: string;
  batchNumber?: string;
  administeredBy?: string;
  nextDueDate: string;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface PatientNotification {
  id: string;
  patientId: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'report' | 'prescription' | 'general' | 'appointment_reminder' | 'prescription_ready' | 'test_result';
  isRead: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

// Patient Dashboard Types
export interface PatientDashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  nextAppointment?: {
    id: string;
    doctorName: string;
    doctorSpecialty: string;
    appointmentDate: string;
    appointmentTime: string;
    room?: string;
    token?: string;
  };
  recentVisits: RecentVisit[];
}

export interface PatientRecentVisit {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  appointmentTime: string;
  diagnosis: string;
  status: 'completed' | 'cancelled' | 'no_show';
}

// Request Types
export interface BookAppointmentRequest {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  source?: 'web' | 'phone' | 'walk_in';
}

export interface RescheduleAppointmentRequest {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface TimeSlot {
  time: string;
  isBooked: boolean;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Audit Log Types
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
  entityType?: string;
  entityId?: string;
}

export interface RecentActivityResponse {
  success: boolean;
  data: AuditLog[];
  message?: string;
}

// Auth Types
export interface PatientAuthRequest {
  phone: string;
}

export interface PatientOTPVerification {
  phone: string;
  otp: string;
}

export interface PatientAuthResponse {
  success: boolean;
  patient?: Patient;
  token?: string;
  message: string;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  patientsServed: number;
  averageConsultTime: number;
  totalHours: number;
  efficiency: number;
}

// Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility functions
export const apiUtils = {
  handleError: (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
};
