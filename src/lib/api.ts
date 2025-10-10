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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

// Generic API call function with retry logic for rate limiting
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Debug logging
  console.log('API Call Debug:', {
    endpoint,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
  });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
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
        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth-login';
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
    return apiCall<PaginatedResponse<Doctor>>(`/users/doctors?page=${page}&limit=${limit}`);
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
