// API Service for ClinicOS Backend Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types from backend
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

// Patient Authentication Types
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
  recentVisits: PatientRecentVisit[];
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

// Patient Medical Records Types
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

// Patient Notification Types
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

// Patient Request Types
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

// Additional types from backend
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

// Extended appointment interface with populated data
export interface AppointmentWithDetails extends Appointment {
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  room?: string;
  token?: string;
  cancellationReason?: string;
  reason?: string;
}

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

export interface AppointmentStats {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  rescheduled: number;
  averageWaitTime: number;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  patientsServed: number;
  averageConsultTime: number;
  totalHours: number;
  efficiency: number;
}

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

export interface QueueAnalytics {
  averageWaitTime: number;
  busiestHours: { hour: number; count: number }[];
  delayPatterns: { day: string; averageDelay: number }[];
  skipRate: number;
}

// API Error class
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

// API call function for patient endpoints without authentication
async function patientApiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return patientApiCall<T>(endpoint, options, retryCount + 1);
      }
      
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
}

// Generic API call function with retry logic for rate limiting
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage (check both admin and patient tokens)
  let adminToken = null;
  let patientToken = null;
  let token = null;
  
  if (typeof window !== 'undefined') {
    adminToken = localStorage.getItem('token');
    patientToken = localStorage.getItem('patientToken');
    token = patientToken || adminToken; // Prioritize patient token for patient endpoints
    
    // Debug logging
    console.log('API Call Debug:', {
      endpoint,
      adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : null,
      patientToken: patientToken ? `${patientToken.substring(0, 20)}...` : null,
      selectedToken: token ? `${token.substring(0, 20)}...` : null,
      tokenType: patientToken ? 'patient' : adminToken ? 'admin' : 'none',
      localStorageKeys: Object.keys(localStorage),
      willSendAuthHeader: !!token
    });
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Only add Authorization header if we have a token
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiCall<T>(endpoint, options, retryCount + 1);
      }
      
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        // Clear invalid tokens and redirect to appropriate login
        if (typeof window !== 'undefined') {
          if (adminToken) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // window.location.href = '/auth-login';
          }
          if (patientToken) {
            localStorage.removeItem('patientToken');
            localStorage.removeItem('patientData');
            // window.location.href = '/Auth-patientLogin';
          }
        }
        throw new ApiError(
          'Authentication required. Please log in again.',
          response.status,
          errorData
        );
      }
      
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
}

// Assistant API functions
export const assistantApi = {
  // Get all assistants
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Assistant>> => {
    return apiCall<PaginatedResponse<Assistant>>(`/users/assistants?page=${page}&limit=${limit}`);
  },

  // Get assistant by ID
  getById: async (id: string): Promise<ApiResponse<Assistant>> => {
    return apiCall<ApiResponse<Assistant>>(`/users/assistants/${id}`);
  },

  // Create new assistant
  create: async (assistantData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    assignedDoctors?: string[];
  }): Promise<ApiResponse<Assistant>> => {
    return apiCall<ApiResponse<Assistant>>('/users/assistants', {
      method: 'POST',
      body: JSON.stringify(assistantData),
    });
  },

  // Update assistant
  update: async (id: string, updates: Partial<{
    assignedDoctors: string[];
    isActive: boolean;
    user?: {
      name: string;
      email: string;
      phone: string;
    };
  }>): Promise<ApiResponse<Assistant>> => {
    return apiCall<ApiResponse<Assistant>>(`/users/assistants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete assistant
  delete: async (id: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/users/assistants/${id}`, {
      method: 'DELETE',
    });
  },
};

// Doctor API functions
export const doctorApi = {
  // Get all doctors
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Doctor>> => {
    // Always try to fetch from backend first for admin pages
    try {
      const response = await apiCall<PaginatedResponse<Doctor>>(`/users/doctors?page=${page}&limit=${limit}`);
      if (response.success && response.data) {
        console.log('Successfully fetched real doctors from backend:', response.data);
        return response;
      }
    } catch (error) {
      console.log('Backend API failed for doctors, using mock data:', error);
    }

    // Fallback to mock data
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        userId: '1',
        specialty: 'General Physician',
        licenseNumber: 'GP001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-001',
        queueLength: 3,
        estimatedLastPatient: '11:30 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '1',
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@clinic.com',
          phone: '+91 98765 43210',
          isActive: true
        }
      },
      {
        id: '2',
        userId: '2',
        specialty: 'Cardiologist',
        licenseNumber: 'CARD001',
        consultationDuration: 45,
        isActive: true,
        currentToken: 'T-002',
        queueLength: 2,
        estimatedLastPatient: '3:15 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '2',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@clinic.com',
          phone: '+91 98765 43211',
          isActive: true
        }
      },
      {
        id: '3',
        userId: '3',
        specialty: 'Dermatologist',
        licenseNumber: 'DERM001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-003',
        queueLength: 1,
        estimatedLastPatient: '12:00 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '3',
          name: 'Dr. Siva Raman',
          email: 'siva.raman@clinic.com',
          phone: '+91 98765 43212',
          isActive: true
        }
      },
      {
        id: '4',
        userId: '4',
        specialty: 'Pediatrician',
        licenseNumber: 'PED001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-004',
        queueLength: 0,
        estimatedLastPatient: '10:00 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '4',
          name: 'Dr. Meena Lakshmi',
          email: 'meena.lakshmi@clinic.com',
          phone: '+91 98765 43213',
          isActive: true
        }
      },
      {
        id: '5',
        userId: '5',
        specialty: 'Orthopedist',
        licenseNumber: 'ORTH001',
        consultationDuration: 45,
        isActive: true,
        currentToken: 'T-005',
        queueLength: 1,
        estimatedLastPatient: '2:30 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '5',
          name: 'Dr. Anil Gupta',
          email: 'anil.gupta@clinic.com',
          phone: '+91 98765 43214',
          isActive: true
        }
      }
    ];

    const mockPagination = {
      page: 1,
      limit: limit,
      total: mockDoctors.length,
      totalPages: 1
    };

    return Promise.resolve({
      success: true,
      data: mockDoctors,
      pagination: mockPagination,
      message: 'Doctors retrieved successfully (mock data)'
    });
  },

  // Get doctor by ID
  getById: async (id: string): Promise<ApiResponse<Doctor>> => {
    return apiCall<ApiResponse<Doctor>>(`/users/doctors/${id}`);
  },

  // Create new doctor
  create: async (doctorData: {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
  }): Promise<ApiResponse<Doctor>> => {
    // First create a user
    const userResponse = await apiCall<ApiResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: doctorData.name,
        email: doctorData.email,
        phone: doctorData.phone,
        role: 'doctor'
      }),
    });

    if (!userResponse.success || !userResponse.data) {
      throw new Error(userResponse.message || 'Failed to create user');
    }

    // Then create a doctor profile
    return apiCall<ApiResponse<Doctor>>('/users/doctors', {
      method: 'POST',
      body: JSON.stringify({
        userId: userResponse.data.id,
        specialty: doctorData.specialty,
        licenseNumber: doctorData.licenseNumber,
        consultationDuration: doctorData.consultationDuration,
      }),
    });
  },

  // Update doctor
  update: async (id: string, updates: Partial<{
    name: string;
    email: string;
    phone: string;
    specialty: string;
    licenseNumber: string;
    consultationDuration: number;
    isActive: boolean;
  }>): Promise<ApiResponse<Doctor>> => {
    return apiCall<ApiResponse<Doctor>>(`/users/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Update doctor status
  updateStatus: async (id: string, status: 'active' | 'break' | 'offline'): Promise<ApiResponse<Doctor>> => {
    return apiCall<ApiResponse<Doctor>>(`/users/doctors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete doctor
  delete: async (id: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/users/doctors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Patient API functions
export const patientApi = {
  // Get all patients
  getAll: async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Patient>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return apiCall<PaginatedResponse<Patient>>(`/patients?page=${page}&limit=${limit}${searchParam}`);
  },

  // Get patient by ID
  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>(`/patients/${id}`);
  },

  // Create new patient
  create: async (patientData: {
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
  }): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  // Update patient
  update: async (id: string, updates: Partial<{
    name: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    bloodGroup: string;
    height: number;
    weight: number;
    allergies: string;
    chronicConditions: string;
    familyId: string;
    isActive: boolean;
  }>): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete patient
  delete: async (id: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // Get patients by family
  getByFamily: async (familyId: string): Promise<ApiResponse<Patient[]>> => {
    return apiCall<ApiResponse<Patient[]>>(`/patients/family/${familyId}`);
  },
};

// Appointment API functions
export const appointmentApi = {
  // Create appointment
  create: async (appointmentData: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    notes?: string;
    source?: 'web' | 'assistant' | 'walk_in' | 'phone';
  }): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  // Get appointment by ID
  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}`);
  },

  // Update appointment
  update: async (id: string, updates: Partial<{
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    notes: string;
    source: 'web' | 'assistant' | 'walk_in' | 'phone';
  }>): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Cancel appointment
  cancel: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, {
      method: 'PUT',
    });
  },

  // Reschedule appointment
  reschedule: async (id: string, newDate: string, newTime: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ appointmentDate: newDate, appointmentTime: newTime }),
    });
  },

  // Mark as completed
  complete: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}/complete`, {
      method: 'PUT',
    });
  },

  // Mark as no-show
  noShow: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/appointments/${id}/no-show`, {
      method: 'PUT',
    });
  },

  // Get appointments by doctor
  getByDoctor: async (doctorId: string, page = 1, limit = 10): Promise<PaginatedResponse<Appointment>> => {
    return apiCall<PaginatedResponse<Appointment>>(`/appointments/doctor/${doctorId}?page=${page}&limit=${limit}`);
  },

  // Get appointment stats
  getStats: async (): Promise<ApiResponse<AppointmentStats>> => {
    return apiCall<ApiResponse<AppointmentStats>>('/appointments/stats/overview');
  },

  // Get today's appointments
  getToday: async (): Promise<ApiResponse<Appointment[]>> => {
    return apiCall<ApiResponse<Appointment[]>>('/appointments/today/list');
  },

  // Get appointments by date range
  getByDateRange: async (startDate: string, endDate: string, page = 1, limit = 10): Promise<PaginatedResponse<Appointment>> => {
    return apiCall<PaginatedResponse<Appointment>>(`/appointments/range/list?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`);
  },

  // Get available slots for doctor
  getAvailableSlots: async (doctorId: string, date: string): Promise<ApiResponse<string[]>> => {
    return apiCall<ApiResponse<string[]>>(`/appointments/doctors/${doctorId}/slots?date=${date}`);
  },
};

// Queue API functions
export const queueApi = {
  // Add to queue
  addToQueue: async (data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    tokenNumber: string;
  }): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>('/queue/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get queue by doctor
  getByDoctor: async (doctorId: string): Promise<ApiResponse<QueueItem[]>> => {
    return apiCall<ApiResponse<QueueItem[]>>(`/queue/doctor/${doctorId}`);
  },

  // Get current patient
  getCurrentPatient: async (doctorId: string): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>(`/queue/doctor/${doctorId}/current`);
  },

  // Get waiting queue
  getWaitingQueue: async (doctorId: string): Promise<ApiResponse<QueueItem[]>> => {
    return apiCall<ApiResponse<QueueItem[]>>(`/queue/doctor/${doctorId}/waiting`);
  },

  // Update queue position
  updatePosition: async (data: {
    queueItemId: string;
    newPosition: number;
  }): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>('/queue/position', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Call next patient
  callNext: async (doctorId: string): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>(`/queue/doctor/${doctorId}/call-next`, {
      method: 'POST',
    });
  },

  // Skip patient
  skip: async (queueItemId: string, reason?: string): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>(`/queue/${queueItemId}/skip`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Reinsert patient
  reinsert: async (queueItemId: string): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>(`/queue/${queueItemId}/reinsert`, {
      method: 'PUT',
    });
  },

  // Complete patient
  complete: async (queueItemId: string): Promise<ApiResponse<QueueItem>> => {
    return apiCall<ApiResponse<QueueItem>>(`/queue/${queueItemId}/complete`, {
      method: 'PUT',
    });
  },

  // Get queue activities
  getActivities: async (queueItemId: string): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>(`/queue/${queueItemId}/activities`);
  },

  // Get queue stats
  getStats: async (doctorId: string): Promise<ApiResponse<QueueAnalytics>> => {
    return apiCall<ApiResponse<QueueAnalytics>>(`/queue/doctor/${doctorId}/stats`);
  },

  // Get dashboard data
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/queue/dashboard/data');
  },

  // Clear queue
  clear: async (doctorId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/queue/doctor/${doctorId}/clear`, {
      method: 'DELETE',
    });
  },
};

// Auth API functions
export const authApi = {
  // Login
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiCall<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Register
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'admin' | 'doctor' | 'assistant';
  }): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiCall<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiCall<ApiResponse<User>>('/auth/me');
  },
};

// Utility functions
export const apiUtils = {
  // Handle API errors in components
  handleError: (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  // Set token
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  // Remove token
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
};

// Schedule API functions
export const scheduleApi = {
  // Get doctor schedule
  getDoctorSchedule: async (doctorId: string): Promise<ApiResponse<DoctorSchedule[]>> => {
    return apiCall<ApiResponse<DoctorSchedule[]>>(`/users/doctors/${doctorId}/schedule`);
  },

  // Create doctor schedule
  createSchedule: async (doctorId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<DoctorSchedule>> => {
    return apiCall<ApiResponse<DoctorSchedule>>(`/users/doctors/${doctorId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update doctor schedule
  updateSchedule: async (doctorId: string, scheduleId: string, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<DoctorSchedule>> => {
    return apiCall<ApiResponse<DoctorSchedule>>(`/users/doctors/${doctorId}/schedule/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete doctor schedule
  deleteSchedule: async (doctorId: string, scheduleId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/users/doctors/${doctorId}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  },
};

// Schedule Override API functions
export const scheduleOverrideApi = {
  // Get doctor schedule overrides
  getDoctorOverrides: async (doctorId: string): Promise<ApiResponse<ScheduleOverride[]>> => {
    return apiCall<ApiResponse<ScheduleOverride[]>>(`/users/doctors/${doctorId}/overrides`);
  },

  // Create schedule override
  createOverride: async (doctorId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }): Promise<ApiResponse<ScheduleOverride>> => {
    return apiCall<ApiResponse<ScheduleOverride>>(`/users/doctors/${doctorId}/overrides`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update schedule override
  updateOverride: async (doctorId: string, overrideId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'holiday' | 'extended_hours' | 'reduced_hours';
  }): Promise<ApiResponse<ScheduleOverride>> => {
    return apiCall<ApiResponse<ScheduleOverride>>(`/users/doctors/${doctorId}/overrides/${overrideId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete schedule override
  deleteOverride: async (doctorId: string, overrideId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/users/doctors/${doctorId}/overrides/${overrideId}`, {
      method: 'DELETE',
    });
  },
};

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

// Audit Log API functions
export const auditApi = {
  // Get recent activity
  getRecentActivity: async (limit?: number, offset?: number): Promise<RecentActivityResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `/audit/recent-activity${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<RecentActivityResponse>(url);
  },

  // Get audit logs with filters
  getAuditLogs: async (filters?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<RecentActivityResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const url = `/audit/logs${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<RecentActivityResponse>(url);
  },
};

// Patient Authentication API functions
export const patientAuthApi = {
  // Send OTP to patient's email
  sendOTP: async (email: string): Promise<ApiResponse<{ email: string; otpSent: boolean; otp?: string }>> => {
    return apiCall<ApiResponse<{ email: string; otpSent: boolean; otp?: string }>>('/patient/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP and authenticate patient
  verifyOTP: async (email: string, otp: string): Promise<PatientAuthResponse> => {
    return apiCall<PatientAuthResponse>('/patient/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<ApiResponse<{ email: string; otpSent: boolean; otp?: string }>> => {
    return apiCall<ApiResponse<{ email: string; otpSent: boolean; otp?: string }>>('/patient/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Get current patient profile
  getCurrentPatient: async (): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>('/patient/auth/me');
  },

  // Logout patient
  logout: async (): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/patient/auth/logout', {
      method: 'POST',
    });
  },
};

// Patient Dashboard API functions
export const patientDashboardApi = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<ApiResponse<PatientDashboardStats>> => {
    // Mock data for development
    const mockStats: PatientDashboardStats = {
      totalAppointments: 12,
      upcomingAppointments: 2,
      completedAppointments: 8,
      cancelledAppointments: 2,
      nextAppointment: {
        id: '1',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialty: 'General Physician',
        appointmentDate: '2025-01-15',
        appointmentTime: '10:00',
        room: 'Room 201',
        token: 'T-001'
      },
      recentVisits: [
        {
          id: '3',
          doctorName: 'Dr. Siva Raman',
          doctorSpecialty: 'Dermatologist',
          appointmentDate: '2024-12-28',
          appointmentTime: '11:00',
          diagnosis: 'Routine checkup',
          status: 'completed'
        }
      ]
    };

    return Promise.resolve({
      success: true,
      data: mockStats,
      message: 'Dashboard stats retrieved successfully'
    });
  },

  // Get patient profile
  getPatientProfile: async (): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>('/patient/dashboard/profile');
  },

  // Update patient profile
  updatePatientProfile: async (updates: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>('/patient/dashboard/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (limit?: number): Promise<ApiResponse<Appointment[]>> => {
    // Mock data for development
    const mockUpcomingAppointments: Appointment[] = [
      {
        id: '1',
        patientId: '1',
        doctorId: '1',
        appointmentDate: '2025-01-15',
        appointmentTime: '10:00',
        duration: 30,
        status: 'confirmed',
        source: 'web',
        notes: 'Regular checkup',
        tokenNumber: 'T-001',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z'
      },
      {
        id: '2',
        patientId: '1',
        doctorId: '2',
        appointmentDate: '2025-01-20',
        appointmentTime: '14:30',
        duration: 45,
        status: 'scheduled',
        source: 'web',
        notes: 'Follow-up consultation',
        tokenNumber: 'T-002',
        createdAt: '2025-01-12T00:00:00Z',
        updatedAt: '2025-01-12T00:00:00Z'
      }
    ];

    const limitedAppointments = limit ? mockUpcomingAppointments.slice(0, limit) : mockUpcomingAppointments;

    return Promise.resolve({
      success: true,
      data: limitedAppointments,
      message: 'Upcoming appointments retrieved successfully'
    });
  },

  // Get recent visits
  getRecentVisits: async (limit?: number): Promise<ApiResponse<PatientRecentVisit[]>> => {
    // Mock data for development
    const mockRecentVisits: PatientRecentVisit[] = [
      {
        id: '3',
        doctorName: 'Dr. Siva Raman',
        doctorSpecialty: 'Dermatologist',
        appointmentDate: '2024-12-28',
        appointmentTime: '11:00',
        diagnosis: 'Routine checkup',
        status: 'completed'
      },
      {
        id: '4',
        doctorName: 'Dr. Rajesh Kumar',
        doctorSpecialty: 'Cardiologist',
        appointmentDate: '2024-11-22',
        appointmentTime: '15:00',
        diagnosis: 'Hypertension check',
        status: 'completed'
      },
      {
        id: '5',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialty: 'General Physician',
        appointmentDate: '2024-10-15',
        appointmentTime: '09:30',
        diagnosis: 'Common cold',
        status: 'completed'
      }
    ];

    const limitedVisits = limit ? mockRecentVisits.slice(0, limit) : mockRecentVisits;

    return Promise.resolve({
      success: true,
      data: limitedVisits,
      message: 'Recent visits retrieved successfully'
    });
  },

  // Get available doctors
  getAvailableDoctors: async (): Promise<ApiResponse<Doctor[]>> => {
    return apiCall<ApiResponse<Doctor[]>>('/patient/dashboard/doctors');
  },

  // Get available slots for a doctor
  getAvailableSlots: async (doctorId: string, date: string): Promise<ApiResponse<string[]>> => {
    return apiCall<ApiResponse<string[]>>(`/patient/dashboard/doctors/${doctorId}/slots?date=${date}`);
  },
};

// Patient Registration API functions
export const patientRegistrationApi = {
  // Register a new patient
  registerPatient: async (patientData: {
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
  }): Promise<ApiResponse<{ patient: Patient; token: string }>> => {
    return apiCall<ApiResponse<{ patient: Patient; token: string }>>('/patient/register/register', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  // Check if phone number is available
  checkPhoneAvailability: async (phone: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiCall<ApiResponse<{ available: boolean }>>(`/patient/register/check-phone?phone=${phone}`);
  },

  // Check if email is available
  checkEmailAvailability: async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiCall<ApiResponse<{ available: boolean }>>(`/patient/register/check-email?email=${email}`);
  },

  // Validate registration step
  validateRegistrationStep: async (step: number, data: any): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> => {
    return apiCall<ApiResponse<{ valid: boolean; errors: string[] }>>('/patient/register/validate-step', {
      method: 'POST',
      body: JSON.stringify({ step, data }),
    });
  },

  // Get registration options
  getRegistrationOptions: async (): Promise<ApiResponse<{
    bloodGroups: string[];
    genders: { value: string; label: string }[];
  }>> => {
    return apiCall<ApiResponse<{
      bloodGroups: string[];
      genders: { value: string; label: string }[];
    }>>('/patient/register/options');
  },
};

// Patient Appointment API functions
export const patientAppointmentApi = {
  // Book appointment
  bookAppointment: async (appointmentData: BookAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>('/patient/appointments/book', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  // Get patient's appointments
  getPatientAppointments: async (status?: string, page?: number, limit?: number): Promise<ApiResponse<AppointmentWithDetails[]>> => {
    // Mock data for development
    const mockAppointments: AppointmentWithDetails[] = [
      {
        id: '1',
        patientId: '1',
        doctorId: '1',
        appointmentDate: '2025-01-15',
        appointmentTime: '10:00',
        duration: 30,
        status: 'confirmed',
        source: 'web',
        notes: 'Regular checkup',
        tokenNumber: 'T-001',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialty: 'General Physician',
        doctorPhone: '+91 98765 43210',
        room: 'Room 201',
        token: 'T-001'
      },
      {
        id: '2',
        patientId: '1',
        doctorId: '2',
        appointmentDate: '2025-01-20',
        appointmentTime: '14:30',
        duration: 45,
        status: 'scheduled',
        source: 'web',
        notes: 'Follow-up consultation',
        tokenNumber: 'T-002',
        createdAt: '2025-01-12T00:00:00Z',
        updatedAt: '2025-01-12T00:00:00Z',
        doctorName: 'Dr. Rajesh Kumar',
        doctorSpecialty: 'Cardiologist',
        doctorPhone: '+91 98765 43211',
        room: 'Room 305',
        token: 'T-002'
      },
      {
        id: '3',
        patientId: '1',
        doctorId: '3',
        appointmentDate: '2024-12-28',
        appointmentTime: '11:00',
        duration: 30,
        status: 'completed',
        source: 'web',
        notes: 'Routine checkup completed',
        tokenNumber: 'T-003',
        createdAt: '2024-12-25T00:00:00Z',
        updatedAt: '2024-12-28T00:00:00Z',
        doctorName: 'Dr. Siva Raman',
        doctorSpecialty: 'Dermatologist',
        doctorPhone: '+91 98765 43212',
        room: 'Room 102',
        token: 'T-003'
      }
    ];

    // Filter by status if provided
    let filteredAppointments = mockAppointments;
    if (status) {
      filteredAppointments = mockAppointments.filter(apt => apt.status === status);
    }

    return Promise.resolve({
      success: true,
      data: filteredAppointments,
      message: 'Appointments retrieved successfully'
    });
  },

  // Get specific appointment details
  getAppointmentDetails: async (appointmentId: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/patient/appointments/${appointmentId}`);
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string, reason: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/patient/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId: string, newDate: string, newTime: string, reason?: string): Promise<ApiResponse<Appointment>> => {
    return apiCall<ApiResponse<Appointment>>(`/patient/appointments/${appointmentId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ newDate, newTime, reason }),
    });
  },

  // Get available doctors for booking
  getAvailableDoctors: async (): Promise<ApiResponse<Doctor[]>> => {
    // Try to fetch from backend first, fallback to mock data if it fails
    try {
      const response = await patientApiCall<ApiResponse<Doctor[]>>('/patient/appointments/doctors');
      if (response.success && response.data) {
        return response;
      }
    } catch (error) {
      console.log('Backend API failed, using mock data:', error);
    }

    // Fallback to mock data
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        userId: '1',
        specialty: 'General Physician',
        licenseNumber: 'GP001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-001',
        queueLength: 3,
        estimatedLastPatient: '11:30 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '1',
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@clinic.com',
          phone: '+91 98765 43210',
          isActive: true
        }
      },
      {
        id: '2',
        userId: '2',
        specialty: 'Cardiologist',
        licenseNumber: 'CARD001',
        consultationDuration: 45,
        isActive: true,
        currentToken: 'T-002',
        queueLength: 2,
        estimatedLastPatient: '3:15 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '2',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@clinic.com',
          phone: '+91 98765 43211',
          isActive: true
        }
      },
      {
        id: '3',
        userId: '3',
        specialty: 'Dermatologist',
        licenseNumber: 'DERM001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-003',
        queueLength: 1,
        estimatedLastPatient: '12:00 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '3',
          name: 'Dr. Siva Raman',
          email: 'siva.raman@clinic.com',
          phone: '+91 98765 43212',
          isActive: true
        }
      },
      {
        id: '4',
        userId: '4',
        specialty: 'Pediatrician',
        licenseNumber: 'PED001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-004',
        queueLength: 0,
        estimatedLastPatient: '10:00 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '4',
          name: 'Dr. Meena Lakshmi',
          email: 'meena.lakshmi@clinic.com',
          phone: '+91 98765 43213',
          isActive: true
        }
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockDoctors,
      message: 'Doctors retrieved successfully (mock data)'
    });
  },

  // Get available slots for a doctor
  getAvailableSlots: async (doctorId: string, date: string): Promise<ApiResponse<TimeSlot[]>> => {
    // Try to fetch from backend first, fallback to mock data if it fails
    try {
      const response = await patientApiCall<ApiResponse<TimeSlot[]>>(`/patient/appointments/doctors/${doctorId}/slots?date=${date}`);
      if (response.success && response.data) {
        return response;
      }
    } catch (error) {
      console.log('Backend API failed for time slots, using mock data:', error);
    }

    // Fallback to mock data
    const mockTimeSlots: TimeSlot[] = [
      { time: '09:00', isBooked: false },
      { time: '09:30', isBooked: true },
      { time: '10:00', isBooked: false },
      { time: '10:30', isBooked: true },
      { time: '11:00', isBooked: false },
      { time: '11:30', isBooked: false },
      { time: '14:00', isBooked: true },
      { time: '14:30', isBooked: false },
      { time: '15:00', isBooked: false },
      { time: '15:30', isBooked: true },
      { time: '16:00', isBooked: true },
      { time: '16:30', isBooked: false }
    ];

    return Promise.resolve({
      success: true,
      data: mockTimeSlots,
      message: 'Available slots retrieved successfully (mock data)'
    });
  },
};

// Patient Doctor API functions (no authentication required)
export const patientDoctorApi = {
  // Get available doctors for patient booking (no auth)
  getAvailableDoctors: async (): Promise<ApiResponse<Doctor[]>> => {
    // Try to fetch from backend first, fallback to mock data if it fails
    try {
      // Use the public patient appointment endpoint for doctors (no auth required)
      const response = await patientApiCall<ApiResponse<Doctor[]>>('/patient/appointments/doctors');
      if (response.success && response.data) {
        console.log('Successfully fetched real doctors for patient booking:', response.data);
        return response;
      }
    } catch (error) {
      console.log('Backend API failed for patient doctors, using mock data:', error);
    }

    // Fallback to mock data
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        userId: '1',
        specialty: 'General Physician',
        licenseNumber: 'GP001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-001',
        queueLength: 3,
        estimatedLastPatient: '11:30 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '1',
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@clinic.com',
          phone: '+91 98765 43210',
          isActive: true
        }
      },
      {
        id: '2',
        userId: '2',
        specialty: 'Cardiologist',
        licenseNumber: 'CARD001',
        consultationDuration: 45,
        isActive: true,
        currentToken: 'T-002',
        queueLength: 2,
        estimatedLastPatient: '3:15 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '2',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@clinic.com',
          phone: '+91 98765 43211',
          isActive: true
        }
      },
      {
        id: '3',
        userId: '3',
        specialty: 'Dermatologist',
        licenseNumber: 'DERM001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-003',
        queueLength: 1,
        estimatedLastPatient: '12:00 PM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '3',
          name: 'Dr. Siva Raman',
          email: 'siva.raman@clinic.com',
          phone: '+91 98765 43212',
          isActive: true
        }
      },
      {
        id: '4',
        userId: '4',
        specialty: 'Pediatrician',
        licenseNumber: 'PED001',
        consultationDuration: 30,
        isActive: true,
        currentToken: 'T-004',
        queueLength: 0,
        estimatedLastPatient: '10:00 AM',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        user: {
          id: '4',
          name: 'Dr. Meena Lakshmi',
          email: 'meena.lakshmi@clinic.com',
          phone: '+91 98765 43213',
          isActive: true
        }
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockDoctors,
      message: 'Doctors retrieved successfully (mock data)'
    });
  },
};

// Patient Medical Records API functions
export const patientMedicalRecordsApi = {
  // Get medical reports
  getMedicalReports: async (type?: string, page?: number, limit?: number): Promise<ApiResponse<MedicalReport[]>> => {
    // Mock data for development
    const mockReports: MedicalReport[] = [
      {
        id: '1',
        patientId: '1',
        doctorId: '1',
        title: 'Blood Test Report',
        reportType: 'Lab Report',
        reportDate: '2024-12-28',
        findings: 'All parameters are within normal range. No abnormalities detected.',
        recommendations: 'Continue with regular health checkups. Maintain a balanced diet and regular exercise.',
        doctorName: 'Dr. Priya Sharma',
        createdAt: '2024-12-28T00:00:00Z',
        updatedAt: '2024-12-28T00:00:00Z'
      },
      {
        id: '2',
        patientId: '1',
        doctorId: '3',
        title: 'X-Ray Chest',
        reportType: 'Imaging',
        reportDate: '2024-12-15',
        findings: 'Clear lung fields. No signs of pneumonia or other abnormalities.',
        recommendations: 'Continue current treatment. Follow up in 2 weeks if symptoms persist.',
        doctorName: 'Dr. Siva Raman',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2024-12-15T00:00:00Z'
      },
      {
        id: '3',
        patientId: '1',
        doctorId: '2',
        title: 'ECG Report',
        reportType: 'Cardiac',
        reportDate: '2024-11-22',
        findings: 'Normal sinus rhythm. No signs of cardiac abnormalities.',
        recommendations: 'Continue regular exercise. Annual cardiac checkup recommended.',
        doctorName: 'Dr. Rajesh Kumar',
        createdAt: '2024-11-22T00:00:00Z',
        updatedAt: '2024-11-22T00:00:00Z'
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockReports,
      message: 'Medical reports retrieved successfully'
    });
  },

  // Get specific medical report
  getMedicalReport: async (reportId: string): Promise<ApiResponse<MedicalReport>> => {
    return apiCall<ApiResponse<MedicalReport>>(`/patient/medical-records/reports/${reportId}`);
  },

  // Get prescriptions
  getPrescriptions: async (page?: number, limit?: number): Promise<ApiResponse<Prescription[]>> => {
    // Mock data for development
    const mockPrescriptions: Prescription[] = [
      {
        id: '1',
        patientId: '1',
        doctorId: '1',
        prescriptionDate: '2024-12-28',
        diagnosis: 'Common cold and mild fever',
        doctorName: 'Dr. Priya Sharma',
        medications: [
          {
            id: '1',
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take after meals'
          },
          {
            id: '2',
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '7 days',
            instructions: 'Take at bedtime'
          }
        ],
        notes: 'Get adequate rest and drink plenty of fluids',
        createdAt: '2024-12-28T00:00:00Z',
        updatedAt: '2024-12-28T00:00:00Z'
      },
      {
        id: '2',
        patientId: '1',
        doctorId: '2',
        prescriptionDate: '2024-11-22',
        diagnosis: 'Hypertension management',
        doctorName: 'Dr. Rajesh Kumar',
        medications: [
          {
            id: '3',
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in the morning'
          }
        ],
        notes: 'Monitor blood pressure regularly. Follow up in 1 month.',
        createdAt: '2024-11-22T00:00:00Z',
        updatedAt: '2024-11-22T00:00:00Z'
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockPrescriptions,
      message: 'Prescriptions retrieved successfully'
    });
  },

  // Get specific prescription
  getPrescription: async (prescriptionId: string): Promise<ApiResponse<Prescription>> => {
    return apiCall<ApiResponse<Prescription>>(`/patient/medical-records/prescriptions/${prescriptionId}`);
  },

  // Get vaccinations
  getVaccinations: async (status?: string, page?: number, limit?: number): Promise<ApiResponse<Vaccination[]>> => {
    // Mock data for development
    const mockVaccinations: Vaccination[] = [
      {
        id: '1',
        patientId: '1',
        vaccineName: 'COVID-19 Vaccine (Covishield)',
        vaccineType: 'COVID-19',
        vaccinationDate: '2024-10-15',
        batchNumber: 'COV-2024-001',
        administeredBy: 'Dr. Priya Sharma',
        nextDueDate: '2025-10-15',
        status: 'completed',
        notes: 'First dose completed. No adverse reactions observed.',
        createdAt: '2024-10-15T00:00:00Z',
        updatedAt: '2024-10-15T00:00:00Z'
      },
      {
        id: '2',
        patientId: '1',
        vaccineName: 'Influenza Vaccine',
        vaccineType: 'Seasonal Flu',
        vaccinationDate: '2024-09-20',
        batchNumber: 'FLU-2024-002',
        administeredBy: 'Dr. Priya Sharma',
        nextDueDate: '2025-09-20',
        status: 'completed',
        notes: 'Annual flu vaccination completed.',
        createdAt: '2024-09-20T00:00:00Z',
        updatedAt: '2024-09-20T00:00:00Z'
      },
      {
        id: '3',
        patientId: '1',
        vaccineName: 'Tetanus Booster',
        vaccineType: 'Tetanus',
        vaccinationDate: '2024-08-10',
        batchNumber: 'TET-2024-003',
        administeredBy: 'Dr. Rajesh Kumar',
        nextDueDate: '2029-08-10',
        status: 'completed',
        notes: 'Tetanus booster administered. Next due in 5 years.',
        createdAt: '2024-08-10T00:00:00Z',
        updatedAt: '2024-08-10T00:00:00Z'
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockVaccinations,
      message: 'Vaccinations retrieved successfully'
    });
  },

  // Get medical history summary
  getMedicalHistory: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/patient/medical-records/history');
  },
};

// Patient Notifications API functions
export const patientNotificationsApi = {
  // Get notifications
  getNotifications: async (type?: string, isRead?: boolean, page?: number, limit?: number): Promise<ApiResponse<PatientNotification[]>> => {
    // Mock data for development
    const mockNotifications: PatientNotification[] = [
      {
        id: '1',
        patientId: '1',
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: 'Your appointment with Dr. Priya Sharma is scheduled for tomorrow at 10:00 AM',
        isRead: false,
        createdAt: '2025-01-14T00:00:00Z',
        updatedAt: '2025-01-14T00:00:00Z'
      },
      {
        id: '2',
        patientId: '1',
        type: 'prescription_ready',
        title: 'Prescription Ready',
        message: 'Your prescription from Dr. Rajesh Kumar is ready for pickup',
        isRead: true,
        createdAt: '2025-01-13T00:00:00Z',
        updatedAt: '2025-01-13T00:00:00Z'
      },
      {
        id: '3',
        patientId: '1',
        type: 'test_result',
        title: 'Test Results Available',
        message: 'Your blood test results from Dr. Priya Sharma are now available',
        isRead: false,
        createdAt: '2025-01-12T00:00:00Z',
        updatedAt: '2025-01-12T00:00:00Z'
      }
    ];

    return Promise.resolve({
      success: true,
      data: mockNotifications,
      message: 'Notifications retrieved successfully'
    });
  },

  // Get notification count
  getNotificationCount: async (): Promise<ApiResponse<{ total: number; unread: number }>> => {
    // Mock data for development
    return Promise.resolve({
      success: true,
      data: { total: 3, unread: 2 },
      message: 'Notification count retrieved successfully'
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/patient/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/patient/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/patient/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// Patient Family Management API functions
export const patientFamilyApi = {
  // Get all family members
  getFamilyMembers: async (): Promise<ApiResponse<Patient[]>> => {
    return apiCall<ApiResponse<Patient[]>>('/patient/family');
  },

  // Get a specific family member
  getFamilyMember: async (memberId: string): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>(`/patient/family/${memberId}`);
  },

  // Add a new family member
  addFamilyMember: async (memberData: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>('/patient/family', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Update a family member
  updateFamilyMember: async (memberId: string, updates: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    return apiCall<ApiResponse<Patient>>(`/patient/family/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a family member
  deleteFamilyMember: async (memberId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/patient/family/${memberId}`, {
      method: 'DELETE',
    });
  },
};
