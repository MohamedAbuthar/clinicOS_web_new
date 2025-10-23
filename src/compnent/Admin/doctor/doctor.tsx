"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, Users, Eye, Edit, UserPlus, X, Phone, Mail, Calendar, MapPin, Save, User, AlertCircle, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useAssistants } from '@/lib/hooks/useAssistants';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiUtils, Doctor as ApiDoctor } from '@/lib/api';
import { generateTimeSlots, formatScheduleDisplay } from '@/lib/utils/timeSlotGenerator';

// TypeScript Interfaces
interface Patient {
  id: number;
  token: string;
  name: string;
  age: number;
  type: string;
  status: string;
  time: string;
}

interface Stats {
  total: number;
  done: number;
  waiting: number;
}

interface DoctorDisplay {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  bgColor: string;
  status: string;
  statusColor: string;
  stats: Stats;
  slotDuration: string;
  assistants: string;
  online: boolean;
  phone: string;
  email: string;
  schedule: string;
  room: string;
  queue: Patient[];
}

interface NewDoctorForm {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  password: string;
  schedule: string;
  startTime: string;
  endTime: string;
  room: string;
  slotDuration: string;
  assistants: string[];
  status: string;
}

export default function DoctorDashboard() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDisplay | null>(null);
  const [showQueueDialog, setShowQueueDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorDisplay[]>([]);
  const [newDoctor, setNewDoctor] = useState<NewDoctorForm>({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    password: '',
    schedule: '',
    startTime: '09:00',
    endTime: '17:00',
    room: '',
    slotDuration: '20',
    assistants: [],
    status: 'In'
  });
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [showAssistantsDropdown, setShowAssistantsDropdown] = useState(false);
  const [editAssistants, setEditAssistants] = useState<string[]>([]);
  const [showEditAssistantsDropdown, setShowEditAssistantsDropdown] = useState(false);

  const {
    doctors,
    loading,
    error,
    setError,
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor,
    testFirestorePermissions,
  } = useDoctors();

  const { appointments } = useAppointments();
  
  const { assistants, loading: assistantsLoading } = useAssistants();

  // Make test function available globally for debugging
  React.useEffect(() => {
    (window as any).testFirestorePermissions = testFirestorePermissions;
    (window as any).testDoctorEdit = async (doctorId: string) => {
      console.log('Testing doctor edit for ID:', doctorId);
      const testData = {
        name: 'Test Doctor',
        email: 'test@example.com',
        phone: '+1234567890',
        specialty: 'General Medicine',
        consultationDuration: 20,
        schedule: 'Mon-Fri, 9:00 AM - 5:00 PM',
        startTime: '09:00',
        endTime: '17:00',
        availableSlots: ['09:00', '09:20', '09:40'],
        assignedAssistants: []
      };
      return await updateDoctor(doctorId, testData);
    };
    (window as any).testDoctorEditOnly = async (doctorId: string) => {
      console.log('Testing doctor edit (doctor fields only) for ID:', doctorId);
      const testData = {
        specialty: 'General Medicine',
        consultationDuration: 20,
        schedule: 'Mon-Fri, 9:00 AM - 5:00 PM',
        startTime: '09:00',
        endTime: '17:00',
        availableSlots: ['09:00', '09:20', '09:40'],
        assignedAssistants: []
      };
      return await updateDoctor(doctorId, testData);
    };
    (window as any).checkUserRole = async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.log('No user logged in');
          return null;
        }
        
        console.log('Current user:', currentUser.uid, currentUser.email);
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User role:', userData.role);
          console.log('User data:', userData);
          return userData;
        } else {
          console.log('User document not found');
          return null;
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        return null;
      }
    };
    console.log('Test functions available: window.testFirestorePermissions(), window.testDoctorEdit(doctorId), window.testDoctorEditOnly(doctorId), and window.checkUserRole()');
  }, [testFirestorePermissions, updateDoctor]);

  // Show success message and hide after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-generate slot preview when schedule changes
  useEffect(() => {
    if (newDoctor.startTime && newDoctor.endTime && newDoctor.slotDuration) {
      const slots = generateTimeSlots({
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        slotDuration: parseInt(newDoctor.slotDuration)
      });
      setPreviewSlots(slots.map(slot => slot.time));
    } else {
      setPreviewSlots([]);
    }
  }, [newDoctor.startTime, newDoctor.endTime, newDoctor.slotDuration]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAssistantsDropdown && !target.closest('.relative')) {
        setShowAssistantsDropdown(false);
      }
      if (showEditAssistantsDropdown && !target.closest('.relative')) {
        setShowEditAssistantsDropdown(false);
      }
    };

    if (showAssistantsDropdown || showEditAssistantsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssistantsDropdown, showEditAssistantsDropdown]);

  // Transform API doctors to display format
  const transformedDoctors: DoctorDisplay[] = useMemo(() => {
    return doctors.map((doctor, index) => {
    const doctorAppointments = appointments.filter(apt => apt.doctorId === doctor.id);
    const todayAppointments = doctorAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    });

    const completed = todayAppointments.filter(apt => apt.status === 'completed').length;
    const waiting = todayAppointments.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'approved'
    ).length;

    // Create queue from today's appointments
    const queue: Patient[] = todayAppointments
      .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
      .sort((a, b) => {
        // Sort by queueOrder if available, otherwise by appointment time
        const aOrder = a.queueOrder ?? null;
        const bOrder = b.queueOrder ?? null;
        
        if (aOrder !== null && bOrder !== null) {
          return aOrder - bOrder;
        }
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
      })
      .map((apt, idx) => ({
        id: parseInt(apt.id) || idx + 1,
        token: apt.tokenNumber || `T${idx + 1}`,
        name: apt.patientName || 'Unknown Patient',
        age: 0, // Age not available in appointment data
        type: apt.checkedInAt ? 'Checked In' : 'Scheduled',
        status: apt.checkedInAt ? 'waiting' : apt.status,
        time: apt.appointmentTime ? new Date(apt.appointmentTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : 'N/A'
      }));

    return {
      id: doctor.id, // Keep as string (UUID)
      name: doctor.user?.name || 'Loading...',
      specialty: doctor.specialty,
      initials: doctor.user?.name ? doctor.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '...',
      bgColor: index % 2 === 0 ? 'bg-teal-600' : 'bg-teal-700',
      status: doctor.status === 'In' ? 'In' : 
              doctor.status === 'Break' ? 'Break' : 'Out',
      statusColor: doctor.status === 'In' ? 'bg-emerald-500' : 
                   doctor.status === 'Break' ? 'bg-amber-500' : 'bg-gray-400',
      stats: { 
        total: todayAppointments.length, 
        done: completed, 
        waiting: waiting 
      },
      slotDuration: `${doctor.consultationDuration} min slots`,
      assistants: 'No assistants assigned', // TODO: Fetch from assistant assignments
      online: doctor.isActive,
      phone: doctor.user?.phone || 'N/A',
      email: doctor.user?.email || 'N/A',
      schedule: 'Mon-Fri, 9:00 AM - 5:00 PM', // This would come from schedule API
      room: 'Room 101', // This would come from doctor profile
      queue: queue // Populate with actual appointments
    };
  });
  }, [doctors, appointments]);

  // Filter doctors based on user role and search query
  useEffect(() => {
    if (!transformedDoctors.length) {
      setFilteredDoctors([]);
      return;
    }

    let roleFiltered = [...transformedDoctors];

    // If no user is authenticated, show all doctors (shouldn't happen in admin portal)
    if (!isAuthenticated || !currentUser) {
      setFilteredDoctors(roleFiltered);
      return;
    }

    // If doctor is authenticated, show only their own profile
    if (currentUser.role === 'doctor') {
      console.log('Doctor filtering - currentUser:', currentUser);
      console.log('Available doctors:', transformedDoctors);
      
      roleFiltered = transformedDoctors.filter(doctor => {
        // Find the original doctor data to match by userId
        const originalDoctor = doctors.find(d => d.id === doctor.id);
        const isOwnProfile = originalDoctor?.userId === currentUser.id;
        console.log(`Doctor ${doctor.name}: userId=${originalDoctor?.userId}, currentUser.id=${currentUser.id}, isOwnProfile=${isOwnProfile}`);
        return isOwnProfile;
      });
      
      console.log('Filtered doctors for doctor:', roleFiltered.map(d => ({ name: d.name, id: d.id })));
    }
    
    // If assistant is authenticated, show only doctors assigned to them
    else if (currentUser.role === 'assistant') {
      console.log('Assistant filtering doctors - currentUser:', currentUser);
      console.log('Available assistants:', assistants);
      
      const assistant = assistants.find(a => a.userId === currentUser.id);
      console.log('Found assistant:', assistant);
      
      if (assistant && assistant.assignedDoctors && assistant.assignedDoctors.length > 0) {
        console.log('Assistant assigned doctors:', assistant.assignedDoctors);
        
        roleFiltered = transformedDoctors.filter(doctor => {
          const isAssigned = assistant.assignedDoctors.includes(doctor.id);
          console.log(`Doctor ${doctor.name}: id=${doctor.id}, isAssigned=${isAssigned}`);
          return isAssigned;
        });
        
        console.log('Filtered doctors for assistant:', roleFiltered.map(d => ({ name: d.name, id: d.id })));
      } else {
        console.log('No assigned doctors found, showing empty list for assistant');
        roleFiltered = [];
      }
    }
    
    // If admin is authenticated, show all doctors
    else if (currentUser.role === 'admin') {
      roleFiltered = transformedDoctors;
    }

    setFilteredDoctors(roleFiltered);
  }, [transformedDoctors, currentUser, isAuthenticated, assistants]);

  // Apply search filter to role-filtered doctors
  const searchFilteredDoctors = filteredDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openQueueDialog = (doctor: DoctorDisplay) => {
    setSelectedDoctor(doctor);
    setShowQueueDialog(true);
  };

  const openEditDialog = async (doctor: DoctorDisplay) => {
    setSelectedDoctor(doctor);
    
    // Fetch doctor data from Firestore to get assignedAssistants
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const doctorDoc = await getDoc(doc(db, 'doctors', doctor.id));
      
      if (doctorDoc.exists()) {
        const doctorData = doctorDoc.data();
        // Load existing assistants if available
        if (doctorData.assignedAssistants && Array.isArray(doctorData.assignedAssistants)) {
          setEditAssistants(doctorData.assignedAssistants);
        } else {
          setEditAssistants([]);
        }
      } else {
        setEditAssistants([]);
      }
    } catch (error) {
      console.error('Error loading doctor assistants:', error);
      setEditAssistants([]);
    }
    
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const closeDialogs = () => {
    setShowQueueDialog(false);
    setShowEditDialog(false);
    setShowAddDialog(false);
    setSelectedDoctor(null);
    setNewDoctor({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      password: '',
      schedule: '',
      startTime: '09:00',
      endTime: '17:00',
      room: '',
      slotDuration: '20',
      assistants: [],
      status: 'In'
    });
    setPreviewSlots([]);
    setShowAssistantsDropdown(false);
    setEditAssistants([]);
    setShowEditAssistantsDropdown(false);
  };

  const handleAddDoctorChange = (field: keyof NewDoctorForm, value: string) => {
    setNewDoctor(prev => ({ ...prev, [field]: value }));
  };

  const toggleAssistant = (assistantId: string) => {
    setNewDoctor(prev => ({
      ...prev,
      assistants: prev.assistants.includes(assistantId)
        ? prev.assistants.filter(id => id !== assistantId)
        : [...prev.assistants, assistantId]
    }));
  };

  const getSelectedAssistantNames = () => {
    return assistants
      .filter(a => newDoctor.assistants.includes(a.id))
      .map(a => a.user.name)
      .join(', ') || 'Select assistants';
  };

  const toggleEditAssistant = (assistantId: string) => {
    setEditAssistants(prev =>
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  const getEditSelectedAssistantNames = () => {
    return assistants
      .filter(a => editAssistants.includes(a.id))
      .map(a => a.user.name)
      .join(', ') || 'Select assistants';
  };

  const handleAddDoctorSubmit = async () => {
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email || !newDoctor.password) {
      setSuccessMessage('Please fill in all required fields');
      return;
    }

    if (!newDoctor.startTime || !newDoctor.endTime) {
      setSuccessMessage('Please set schedule start and end times');
      return;
    }

    setActionLoading(true);
    try {
      // Generate schedule string
      const scheduleString = formatScheduleDisplay(newDoctor.startTime, newDoctor.endTime);
      
      // Generate time slots
      const slots = generateTimeSlots({
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        slotDuration: parseInt(newDoctor.slotDuration)
      });

      const success = await createDoctor({
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        password: newDoctor.password,
        specialty: newDoctor.specialty,
        licenseNumber: 'LIC' + Date.now(), // Generate a temporary license number
        consultationDuration: parseInt(newDoctor.slotDuration),
        schedule: scheduleString,
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        availableSlots: slots.map(slot => slot.time), // Store available slots
        assignedAssistants: newDoctor.assistants, // Include selected assistants
        status: newDoctor.status, // Include the initial status
      } as any);

      if (success) {
        setSuccessMessage(`Doctor created successfully with ${slots.length} time slots!`);
        closeDialogs();
      } else {
        setSuccessMessage('Failed to create doctor');
      }
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDoctorSubmit = async () => {
    if (!selectedDoctor) return;

    // Clear any previous errors
    setError(null);
    setActionLoading(true);
    
    try {
      console.log('Starting doctor edit for ID:', selectedDoctor.id);
      
      // Get form values from the edit dialog
      const form = document.querySelector('#edit-doctor-form') as HTMLFormElement;
      if (!form) {
        setError('Form not found. Please try again.');
        setActionLoading(false);
        return;
      }

      const formData = new FormData(form);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const specialty = formData.get('specialty') as string;
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const room = formData.get('room') as string;
      const consultationDurationStr = formData.get('consultationDuration') as string;
      const newStatus = formData.get('status') as string;

      // Validate form data
      if (!name || !email || !phone || !specialty || !startTime || !endTime || !consultationDurationStr) {
        setError('Please fill in all required fields.');
        setActionLoading(false);
        return;
      }

      const slotDuration = parseInt(consultationDurationStr);
      if (isNaN(slotDuration) || slotDuration <= 0) {
        setError('Invalid slot duration. Please select a valid duration.');
        setActionLoading(false);
        return;
      }

      // Generate schedule string
      const scheduleString = formatScheduleDisplay(startTime, endTime);
      
      // Generate time slots
      const slots = generateTimeSlots({
        startTime,
        endTime,
        slotDuration
      });

      const updates = {
        // User fields (will be updated in users collection)
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        // Doctor fields (will be updated in doctors collection)
        specialty: specialty.trim(),
        consultationDuration: slotDuration,
        schedule: scheduleString,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        room: room?.trim() || 'Room 101',
        availableSlots: slots.map(slot => slot.time),
        assignedAssistants: editAssistants, // Include selected assistants
      };

      console.log('Doctor update data:', updates);

      // Handle status change separately if status has changed
      if (newStatus && newStatus !== selectedDoctor.status) {
        const statusMap: { [key: string]: 'active' | 'break' | 'offline' } = {
          'In': 'active',
          'Break': 'break',
          'Out': 'offline'
        };
        
        console.log('Updating doctor status:', newStatus, 'to', statusMap[newStatus]);
        const statusSuccess = await updateDoctorStatus(selectedDoctor.id, statusMap[newStatus]);
        if (!statusSuccess) {
          console.error('Status update failed, but continuing with profile update');
          // Don't return here, continue with the main update
        }
      }

      console.log('Calling updateDoctor with:', selectedDoctor.id, updates);
      const success = await updateDoctor(selectedDoctor.id, updates as any);

      if (success) {
        setSuccessMessage(`Doctor updated successfully with ${slots.length} time slots!`);
        closeDialogs();
      } else {
        setError('Failed to update doctor. Please check your permissions and try again.');
      }
    } catch (err: any) {
      console.error('Error updating doctor:', err);
      setError(err.message || 'Failed to update doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      setActionLoading(true);
      try {
        const success = await deleteDoctor(doctorId);
        
        if (success) {
          setSuccessMessage('Doctor deleted successfully');
        } else {
          setSuccessMessage('Failed to delete doctor');
        }
      } catch (err) {
        setSuccessMessage(apiUtils.handleError(err));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleStatusChange = async (doctorId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const statusMap: { [key: string]: 'active' | 'break' | 'offline' } = {
        'In': 'active',
        'Break': 'break',
        'Out': 'offline'
      };

      const success = await updateDoctorStatus(doctorId, statusMap[newStatus]);
      
      if (success) {
        setSuccessMessage('Doctor status updated successfully');
      } else {
        setSuccessMessage('Failed to update doctor status');
      }
    } catch (err) {
      setSuccessMessage(apiUtils.handleError(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {currentUser?.role === 'doctor' 
                ? 'Your Profile' 
                : currentUser?.role === 'assistant'
                ? 'Your Assigned Doctors'
                : 'Doctors'
              }
            </h1>
            <p className="text-gray-500">
              {currentUser?.role === 'doctor' 
                ? 'Your professional profile and information' 
                : currentUser?.role === 'assistant'
                ? 'Doctors assigned to you for patient management'
                : 'Manage doctor profiles and schedules'
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
          <button 
            onClick={openAddDialog}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            Add Doctor
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-0 focus:outline-none focus:ring-0 text-gray-700"
            />
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchFilteredDoctors.length > 0 ? (
            searchFilteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              {/* Doctor Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`${doctor.bgColor} w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg`}>
                      {doctor.initials}
                    </div>
                    {doctor.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{doctor.name}</h3>
                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
                <span className={`${doctor.statusColor} text-white text-xs font-medium px-3 py-1 rounded-full`}>
                  {doctor.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{doctor.stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{doctor.stats.done}</div>
                  <div className="text-xs text-gray-500 mt-1">Done</div>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-600">{doctor.stats.waiting}</div>
                  <div className="text-xs text-gray-500 mt-1">Waiting</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span>{doctor.slotDuration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>{doctor.assistants}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => openQueueDialog(doctor)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={16} />
                  View Queue
                </button>
                <button 
                  onClick={() => openEditDialog(doctor)}
                  disabled={actionLoading}
                  className="p-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  disabled={actionLoading}
                  className="p-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">
                {searchQuery ? 'No doctors match your search.' : 
                 currentUser?.role === 'doctor' ? 'Your profile is not available.' :
                 currentUser?.role === 'assistant' ? 'No doctors are assigned to you.' :
                 'No doctors found.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Doctor Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Doctor</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the doctor information</p>
              </div>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Add Form */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDoctor.name}
                    onChange={(e) => handleAddDoctorChange('name', e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDoctor.specialty}
                    onChange={(e) => handleAddDoctorChange('specialty', e.target.value)}
                    placeholder="General Physician, Cardiologist, etc."
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newDoctor.phone}
                      onChange={(e) => handleAddDoctorChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) => handleAddDoctorChange('email', e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newDoctor.password}
                    onChange={(e) => handleAddDoctorChange('password', e.target.value)}
                    placeholder="Enter password for doctor login"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This password will be used for doctor to login to the admin portal
                  </p>
                </div>

                {/* Schedule Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newDoctor.startTime}
                      onChange={(e) => handleAddDoctorChange('startTime', e.target.value)}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newDoctor.endTime}
                      onChange={(e) => handleAddDoctorChange('endTime', e.target.value)}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Room <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDoctor.room}
                    onChange={(e) => handleAddDoctorChange('room', e.target.value)}
                    placeholder="Room 101"
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Slot Duration <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={newDoctor.slotDuration}
                    onChange={(e) => handleAddDoctorChange('slotDuration', e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                {/* Auto-Generated Slots Preview */}
                {previewSlots.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={18} className="text-teal-600" />
                      <h4 className="text-sm font-semibold text-gray-900">
                        Auto-Generated Time Slots ({previewSlots.length} slots)
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Schedule: {newDoctor.startTime} - {newDoctor.endTime} | Duration: {newDoctor.slotDuration} min
                    </p>
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                      {previewSlots.map((slot, idx) => (
                        <div 
                          key={idx}
                          className="bg-white px-2 py-1.5 rounded text-center text-xs font-medium text-gray-700 border border-gray-200 shadow-sm"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistants - Multi-select Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Assistants {assistantsLoading && <span className="text-xs text-gray-500">(Loading...)</span>}
                  </label>
                  
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setShowAssistantsDropdown(!showAssistantsDropdown)}
                    className="w-full px-4 py-2.5 text-left text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white flex items-center justify-between"
                  >
                    <span className={newDoctor.assistants.length === 0 ? 'text-gray-400' : ''}>
                      {getSelectedAssistantNames()}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${showAssistantsDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showAssistantsDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {assistants.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {assistantsLoading ? 'Loading assistants...' : 'No assistants available'}
                        </div>
                      ) : (
                        assistants.map((assistant) => (
                          <div
                            key={assistant.id}
                            onClick={() => toggleAssistant(assistant.id)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={newDoctor.assistants.includes(assistant.id)}
                              onChange={() => {}} // Handled by parent onClick
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{assistant.user.name}</div>
                              <div className="text-xs text-gray-500">{assistant.user.email}</div>
                            </div>
                            {!assistant.isActive && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Inactive</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Count */}
                  {newDoctor.assistants.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {newDoctor.assistants.length} assistant{newDoctor.assistants.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select 
                    value={newDoctor.status}
                    onChange={(e) => handleAddDoctorChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="In">Available (In)</option>
                    <option value="Break">On Break</option>
                    <option value="Out">Not Available (Out)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddDoctorSubmit}
                disabled={!newDoctor.name || !newDoctor.specialty || !newDoctor.phone || !newDoctor.email || !newDoctor.password || actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Doctor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Queue Dialog */}
      {showQueueDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.name} - Queue</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDoctor.specialty}</p>
              </div>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedDoctor.stats.total}</div>
                <div className="text-sm text-gray-500 mt-1">Total Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{selectedDoctor.stats.done}</div>
                <div className="text-sm text-gray-500 mt-1">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{selectedDoctor.stats.waiting}</div>
                <div className="text-sm text-gray-500 mt-1">In Queue</div>
              </div>
            </div>

            {/* Queue List */}
            <div className="overflow-y-auto max-h-96">
              {selectedDoctor.queue.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {selectedDoctor.queue.map((patient: Patient, index: number) => (
                    <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Position Badge */}
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          {/* Token Badge */}
                          <div className="bg-teal-100 text-teal-700 font-bold px-3 py-2 rounded-lg text-sm">
                            {patient.token}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                              {patient.age > 0 && (
                                <span className="text-sm text-gray-500">({patient.age} yrs)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.type === 'Checked In' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {patient.type}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.status === 'waiting' 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : patient.status === 'confirmed' || patient.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1).replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{patient.time}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Appointment Time</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                              Call
                            </button>
                            <button className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                              Check In
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No patients in queue</p>
                  <p className="text-sm mt-1">All appointments for today are completed or no appointments scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Dialog */}
      {showEditDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Doctor Profile</h2>
              <button 
                onClick={closeDialogs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Edit Form */}
            <form id="edit-doctor-form" className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedDoctor.name}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    defaultValue={selectedDoctor.specialty}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={selectedDoctor.phone}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={selectedDoctor.email}
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Schedule Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      defaultValue="09:00"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      defaultValue="17:00"
                      className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    defaultValue={selectedDoctor.room}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Slot Duration
                  </label>
                  <select 
                    name="consultationDuration"
                    defaultValue={selectedDoctor.slotDuration.includes('20') ? '20' : 
                                  selectedDoctor.slotDuration.includes('15') ? '15' : 
                                  selectedDoctor.slotDuration.includes('30') ? '30' : '10'}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                {/* Assistants - Multi-select Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Assistants {assistantsLoading && <span className="text-xs text-gray-500">(Loading...)</span>}
                  </label>
                  
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setShowEditAssistantsDropdown(!showEditAssistantsDropdown)}
                    className="w-full px-4 py-2.5 text-left text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white flex items-center justify-between"
                  >
                    <span className={editAssistants.length === 0 ? 'text-gray-400' : ''}>
                      {getEditSelectedAssistantNames()}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${showEditAssistantsDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showEditAssistantsDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {assistants.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {assistantsLoading ? 'Loading assistants...' : 'No assistants available'}
                        </div>
                      ) : (
                        assistants.map((assistant) => (
                          <div
                            key={assistant.id}
                            onClick={() => toggleEditAssistant(assistant.id)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={editAssistants.includes(assistant.id)}
                              onChange={() => {}} // Handled by parent onClick
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{assistant.user.name}</div>
                              <div className="text-xs text-gray-500">{assistant.user.email}</div>
                            </div>
                            {!assistant.isActive && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Inactive</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Count */}
                  {editAssistants.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {editAssistants.length} assistant{editAssistants.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <select 
                    name="status"
                    defaultValue={selectedDoctor.status}
                    className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="In">Available (In)</option>
                    <option value="Break">On Break</option>
                    <option value="Out">Not Available (Out)</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeDialogs}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditDoctorSubmit}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}