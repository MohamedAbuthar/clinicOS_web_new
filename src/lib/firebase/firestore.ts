// Firestore Database Service
// Replaces all backend API calls with Firebase Firestore operations
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  addDoc,
  Query,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from './config';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  ASSISTANTS: 'assistants',
  APPOINTMENTS: 'appointments',
  QUEUE: 'queue',
  MEDICAL_RECORDS: 'medicalRecords',
  PRESCRIPTIONS: 'prescriptions',
  VACCINATIONS: 'vaccinations',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  DOCTOR_SCHEDULES: 'doctorSchedules',
  SCHEDULE_OVERRIDES: 'scheduleOverrides',
};

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

// ============================================
// PATIENT OPERATIONS
// ============================================

export const getPatientProfile = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const patientDoc = await getDoc(doc(db, COLLECTIONS.PATIENTS, id));
    
    if (!patientDoc.exists()) {
      // Don't throw error, return gracefully with success: false
      console.warn('⚠️ Patient profile not found for ID:', id);
      return {
        success: false,
        error: 'Patient profile not found. Please complete registration.'
      };
    }
    
    return {
      success: true,
      data: { id: patientDoc.id, ...patientDoc.data() }
    };
  } catch (error: any) {
    console.error('❌ Get patient profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const updatePatientProfile = async (patientId: string, updates: any) => {
  try {
    const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
    await updateDoc(patientRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Update patient error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getAllPatients = async (searchTerm = '', limitCount = 50) => {
  try {
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    let q: Query<DocumentData> = query(patientsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const patients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side filtering if search term provided
    const filtered = searchTerm 
      ? patients.filter((p: any) => 
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.phone?.includes(searchTerm)
        )
      : patients;
    
    return {
      success: true,
      data: filtered
    };
  } catch (error: any) {
    console.error('Get patients error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// APPOINTMENT OPERATIONS
// ============================================

export const createAppointment = async (appointmentData: any) => {
  try {
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const newAppointment = {
      ...appointmentData,
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(appointmentsRef, newAppointment);
    
    // Create audit log
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      action: 'appointment_created',
      userId: getCurrentUserId(),
      entityType: 'appointment',
      entityId: docRef.id,
      timestamp: Timestamp.now(),
      details: `Appointment created for patient ${appointmentData.patientId}`
    });
    
    return {
      success: true,
      data: { id: docRef.id, ...newAppointment }
    };
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Batch create appointments (for family bookings)
export const createMultipleAppointments = async (appointmentsData: any[]) => {
  try {
    console.log(`📝 Creating ${appointmentsData.length} appointments in batch...`);
    
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const createdAppointments: any[] = [];
    
    // Create appointments sequentially to maintain token order
    for (const appointmentData of appointmentsData) {
      const newAppointment = {
        ...appointmentData,
        status: 'scheduled',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(appointmentsRef, newAppointment);
      
      // Create audit log
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        action: 'appointment_created',
        userId: getCurrentUserId(),
        entityType: 'appointment',
        entityId: docRef.id,
        timestamp: Timestamp.now(),
        details: `Appointment created for patient ${appointmentData.patientId} (Token: ${appointmentData.tokenNumber})`
      });
      
      createdAppointments.push({ id: docRef.id, ...newAppointment });
      console.log(`✅ Created appointment ${createdAppointments.length}/${appointmentsData.length}: Token ${appointmentData.tokenNumber}`);
    }
    
    return {
      success: true,
      data: createdAppointments
    };
  } catch (error: any) {
    console.error('❌ Batch create appointments error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getPatientAppointments = async (patientId?: string, status?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    
    const constraints: QueryConstraint[] = [
      where('patientId', '==', id),
      orderBy('appointmentDate', 'desc')
    ];
    
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    const q = query(appointmentsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return appointments;
  } catch (error: any) {
    // Check if it's an index error
    if (error.message?.includes('index')) {
      console.warn('⚠️ Firestore Index Required for Appointments');
      console.warn('📋 Click this link to create the index:');
      console.warn('   https://console.firebase.google.com/project/areal-59464/firestore/indexes');
      console.warn('   Create composite index: appointments > patientId (Ascending) + appointmentDate (Descending)');
      return []; // Return empty array instead of null
    }
    console.error('❌ Get patient appointments error:', error);
    return null;
  }
};

// Alias for convenience
export const getAppointments = getPatientAppointments;

export const getDoctorAppointments = async (doctorId: string, date?: string) => {
  try {
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    
    const constraints: QueryConstraint[] = [
      where('doctorId', '==', doctorId),
      orderBy('appointmentDate', 'desc')
    ];
    
    if (date) {
      constraints.push(where('appointmentDate', '==', date));
    }
    
    const q = query(appointmentsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: appointments
    };
  } catch (error: any) {
    // Check if it's an index error
    if (error.message?.includes('index')) {
      console.warn('⚠️ Firestore Index Required for Doctor Appointments');
      console.warn('📋 Click this link to create the index:');
      console.warn('   https://console.firebase.google.com/project/areal-59464/firestore/indexes');
      console.warn('   Create composite index: appointments > doctorId (Ascending) + appointmentDate (Descending)');
      return {
        success: true,
        data: [] // Return empty array instead of error
      };
    }
    console.error('❌ Get doctor appointments error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all appointments for a doctor on a specific date (for token generation)
export const getDoctorAppointmentsByDate = async (doctorId: string, appointmentDate: string) => {
  try {
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      appointmentsRef, 
      where('doctorId', '==', doctorId),
      where('appointmentDate', '==', appointmentDate)
    );
    
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📅 Found ${appointments.length} appointments for doctor ${doctorId} on ${appointmentDate}`);
    
    return {
      success: true,
      data: appointments
    };
  } catch (error: any) {
    console.error('❌ Get doctor appointments by date error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export const cancelAppointment = async (appointmentId: string, reason: string) => {
  try {
    const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: Timestamp.now()
    });
    
    // Create audit log
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      action: 'appointment_cancelled',
      userId: getCurrentUserId(),
      entityType: 'appointment',
      entityId: appointmentId,
      timestamp: Timestamp.now(),
      details: `Appointment cancelled: ${reason}`
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Cancel appointment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: string,
  newTime: string
) => {
  try {
    const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await updateDoc(appointmentRef, {
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'rescheduled',
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Reschedule appointment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// DOCTOR OPERATIONS
// ============================================

export const getAllDoctors = async () => {
  try {
    console.log('getAllDoctors: Starting fetch...');
    const doctorsRef = collection(db, COLLECTIONS.DOCTORS);
    // Temporarily removing the where clause to see all doctors
    // const q = query(doctorsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(doctorsRef);
    
    console.log(`getAllDoctors: Found ${querySnapshot.docs.length} doctor documents (all, not filtered)`);
    
    // Fetch user data for each doctor
    const doctors = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const doctorData = docSnapshot.data();
        console.log(`Doctor ${docSnapshot.id}:`, doctorData);
        
        // Fetch associated user profile using userId as document ID
        let userData = null;
        if (doctorData.userId) {
          try {
            console.log(`Fetching user for doctor ${docSnapshot.id}, userId: ${doctorData.userId}`);
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, doctorData.userId));
            if (userDoc.exists()) {
              userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
              console.log(`Found user directly:`, userData);
            } else {
              console.log(`User not found by doc ID, trying query...`);
              // Fallback: try querying by id field for old documents
              const usersRef = collection(db, COLLECTIONS.USERS);
              const userQuery = query(usersRef, where('id', '==', doctorData.userId));
              const userSnapshot = await getDocs(userQuery);
              
              if (!userSnapshot.empty) {
                const oldUserDoc = userSnapshot.docs[0];
                userData = {
                  id: oldUserDoc.id,
                  ...oldUserDoc.data()
                };
                console.log(`Found user via query:`, userData);
              } else {
                console.warn(`No user found for userId: ${doctorData.userId}`);
              }
            }
          } catch (userError) {
            console.warn(`Failed to fetch user for doctor ${docSnapshot.id}:`, userError);
          }
        } else {
          console.warn(`Doctor ${docSnapshot.id} has no userId!`);
        }
        
        return {
          id: docSnapshot.id,
          ...doctorData,
          user: userData
        };
      })
    );
    
    console.log('getAllDoctors: Returning doctors:', doctors);
    
    return {
      success: true,
      data: doctors
    };
  } catch (error: any) {
    console.error('Get doctors error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getDoctorById = async (doctorId: string) => {
  try {
    const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, doctorId));
    
    if (!doctorDoc.exists()) {
      throw new Error('Doctor not found');
    }
    
    return {
      success: true,
      data: { id: doctorDoc.id, ...doctorDoc.data() }
    };
  } catch (error: any) {
    console.error('Get doctor error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getDoctorSchedule = async (doctorId: string) => {
  try {
    const scheduleRef = collection(db, COLLECTIONS.DOCTOR_SCHEDULES);
    const q = query(
      scheduleRef,
      where('doctorId', '==', doctorId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const schedule = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: schedule
    };
  } catch (error: any) {
    console.error('Get doctor schedule error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// MEDICAL RECORDS OPERATIONS
// ============================================

export const getPatientMedicalRecords = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const recordsRef = collection(db, COLLECTIONS.MEDICAL_RECORDS);
    const q = query(
      recordsRef,
      where('patientId', '==', id),
      orderBy('reportDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: records
    };
  } catch (error: any) {
    console.error('Get medical records error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getPatientPrescriptions = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const prescriptionsRef = collection(db, COLLECTIONS.PRESCRIPTIONS);
    const q = query(
      prescriptionsRef,
      where('patientId', '==', id),
      orderBy('prescriptionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const prescriptions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: prescriptions
    };
  } catch (error: any) {
    console.error('Get prescriptions error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getPatientVaccinations = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const vaccinationsRef = collection(db, COLLECTIONS.VACCINATIONS);
    const q = query(
      vaccinationsRef,
      where('patientId', '==', id),
      orderBy('vaccinationDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const vaccinations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: vaccinations
    };
  } catch (error: any) {
    console.error('Get vaccinations error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// NOTIFICATIONS OPERATIONS
// ============================================

export const getPatientNotifications = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsRef,
      where('patientId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: notifications
    };
  } catch (error: any) {
    // Check if it's an index error
    if (error.message?.includes('index')) {
      console.warn('⚠️ Firestore Index Required for Notifications');
      console.warn('📋 Click this link to create the index:');
      console.warn('   https://console.firebase.google.com/project/areal-59464/firestore/indexes');
      console.warn('   Create composite index: notifications > patientId (Ascending) + createdAt (Descending)');
      return {
        success: true,
        data: [] // Return empty array instead of error
      };
    }
    console.error('❌ Get notifications error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Mark notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// FAMILY MANAGEMENT OPERATIONS
// ============================================

export const getFamilyMembers = async (familyId: string) => {
  try {
    console.log('🔍 getFamilyMembers called with familyId:', familyId);
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const q = query(patientsRef, where('familyId', '==', familyId));
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Found', querySnapshot.docs.length, 'patients with familyId:', familyId);
    
    const members = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('👤 Family member:', doc.id, '| Name:', data.name, '| FamilyId:', data.familyId);
      return {
        id: doc.id,
        ...data
      };
    });
    
    return {
      success: true,
      data: members
    };
  } catch (error: any) {
    console.error('❌ Get family members error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const addFamilyMember = async (familyId: string, memberData: any) => {
  try {
    console.log('➕ addFamilyMember called');
    console.log('   FamilyId:', familyId);
    console.log('   Member data:', { name: memberData.name, dateOfBirth: memberData.dateOfBirth, gender: memberData.gender });
    
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const newMember = {
      ...memberData,
      familyId,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(patientsRef, newMember);
    console.log('✅ Family member created with ID:', docRef.id);
    console.log('   Assigned familyId:', familyId);
    
    return {
      success: true,
      data: { id: docRef.id, ...newMember }
    };
  } catch (error: any) {
    console.error('❌ Add family member error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// QUEUE OPERATIONS
// ============================================

export const getDoctorQueue = async (doctorId: string) => {
  try {
    const queueRef = collection(db, COLLECTIONS.QUEUE);
    const q = query(
      queueRef,
      where('doctorId', '==', doctorId),
      where('status', 'in', ['waiting', 'current']),
      orderBy('position', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const queue = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: queue
    };
  } catch (error: any) {
    console.error('Get queue error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const getPatientDashboardStats = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    
    // Get all appointments
    const appointments = await getPatientAppointments(id) || [];
    
    // Calculate stats
    const now = new Date();
    const upcomingAppointments = appointments.filter((apt: any) => 
      new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
    );
    
    const stats = {
      totalAppointments: appointments.length,
      upcomingAppointments: upcomingAppointments.length,
      completedAppointments: appointments.filter((apt: any) => apt.status === 'completed').length,
      cancelledAppointments: appointments.filter((apt: any) => apt.status === 'cancelled').length,
      nextAppointment: upcomingAppointments[0] || null,
      recentVisits: appointments.filter((apt: any) => apt.status === 'completed').slice(0, 3)
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// NOTIFICATIONS
// ============================================

export const getNotifications = async (patientId?: string) => {
  try {
    const id = patientId || getCurrentUserId();
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsRef,
      where('patientId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return notifications;
  } catch (error: any) {
    // Check if it's an index error
    if (error.message?.includes('index')) {
      console.warn('⚠️ Firestore Index Required for Notifications');
      console.warn('📋 Click this link to create the index:');
      console.warn('   https://console.firebase.google.com/project/areal-59464/firestore/indexes');
      console.warn('   Create composite index: notifications > patientId (Ascending) + createdAt (Descending)');
      return []; // Return empty array instead of null
    }
    console.error('❌ Get notifications error:', error);
    return null;
  }
};

// ============================================
// TIME SLOTS
// ============================================

export const getAvailableSlots = async (doctorId: string, date: string) => {
  try {
    // Get doctor's schedule for the day of the week
    const dayOfWeek = new Date(date).getDay();
    const schedulesRef = collection(db, COLLECTIONS.DOCTOR_SCHEDULES);
    const scheduleQuery = query(
      schedulesRef,
      where('doctorId', '==', doctorId),
      where('dayOfWeek', '==', dayOfWeek),
      where('isActive', '==', true)
    );
    
    const scheduleSnapshot = await getDocs(scheduleQuery);
    if (scheduleSnapshot.empty) {
      return []; // No schedule for this day
    }
    
    const schedule = scheduleSnapshot.docs[0].data();
    const { startTime, endTime } = schedule;
    
    // Get existing appointments for this date
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const appointmentsQuery = query(
      appointmentsRef,
      where('doctorId', '==', doctorId),
      where('appointmentDate', '==', date)
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const bookedTimes = appointmentsSnapshot.docs
      .map(doc => doc.data().appointmentTime)
      .filter(time => time); // Filter out any undefined times
    
    // Generate time slots
    const slots = [];
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    
    for (let hour = start; hour < end; hour++) {
      for (let minutes of ['00', '30']) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minutes}`;
        slots.push({
          time: timeSlot,
          isBooked: bookedTimes.includes(timeSlot)
        });
      }
    }
    
    return slots;
  } catch (error: any) {
    console.error('Get available slots error:', error);
    return [];
  }
};

