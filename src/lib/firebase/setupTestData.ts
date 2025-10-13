/**
 * Firebase Test Data Setup
 * Run this script ONCE to populate your Firebase with test data
 * 
 * Usage:
 * 1. Make sure you're logged into Firebase
 * 2. Run: npx tsx src/lib/firebase/setupTestData.ts
 */

import { db, auth } from './config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const setupTestData = async () => {
  console.log('🔥 Starting Firebase test data setup...\n');

  try {
    // 1. Create Test Patients with Authentication
    console.log('📝 Creating test patients...');
    
    const testPatients = [
      {
        id: 'patient-001',
        email: 'john.doe@example.com',
        password: 'Test@123',
        data: {
          name: 'John Doe',
          phone: '+91 98765 43210',
          email: 'john.doe@example.com',
          dateOfBirth: '1990-05-15',
          gender: 'male',
          address: '123 Main Street, Mumbai, Maharashtra 400001',
          bloodGroup: 'O+',
          height: 175,
          weight: 70,
          allergies: 'Penicillin',
          chronicConditions: 'None',
          emergencyContact: '+91 98765 43211',
          emergencyContactName: 'Jane Doe',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'patient-002',
        email: 'priya.kumar@example.com',
        password: 'Test@123',
        data: {
          name: 'Priya Kumar',
          phone: '+91 98765 43212',
          email: 'priya.kumar@example.com',
          dateOfBirth: '1985-08-22',
          gender: 'female',
          address: '456 Gandhi Road, Delhi 110001',
          bloodGroup: 'A+',
          height: 162,
          weight: 58,
          allergies: 'None',
          chronicConditions: 'Hypertension',
          emergencyContact: '+91 98765 43213',
          emergencyContactName: 'Raj Kumar',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    for (const patient of testPatients) {
      try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          patient.email,
          patient.password
        );
        
        // Store patient data in Firestore with Firebase Auth UID
        await setDoc(doc(db, 'patients', userCredential.user.uid), {
          ...patient.data,
          id: userCredential.user.uid
        });
        
        console.log(`✅ Created patient: ${patient.data.name} (${patient.email})`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  Patient already exists: ${patient.email}`);
        } else {
          console.error(`❌ Error creating patient ${patient.email}:`, error.message);
        }
      }
    }

    // 2. Create Test Users (Admin, Doctors, Assistants)
    console.log('\n👥 Creating test users...');
    
    const testUsers = [
      {
        id: 'user-admin-001',
        email: 'admin@clinic.com',
        password: 'Admin@123',
        data: {
          name: 'Admin User',
          email: 'admin@clinic.com',
          role: 'admin',
          phone: '+91 98765 00001',
          avatar: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'user-doctor-001',
        email: 'dr.sharma@clinic.com',
        password: 'Doctor@123',
        data: {
          name: 'Dr. Priya Sharma',
          email: 'dr.sharma@clinic.com',
          role: 'doctor',
          phone: '+91 98765 00002',
          avatar: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'user-doctor-002',
        email: 'dr.kumar@clinic.com',
        password: 'Doctor@123',
        data: {
          name: 'Dr. Rajesh Kumar',
          email: 'dr.kumar@clinic.com',
          role: 'doctor',
          phone: '+91 98765 00003',
          avatar: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    const userIds: { [key: string]: string } = {};

    for (const user of testUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...user.data,
          id: userCredential.user.uid
        });
        
        userIds[user.id] = userCredential.user.uid;
        console.log(`✅ Created user: ${user.data.name} (${user.data.role})`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User already exists: ${user.email}`);
          // You might want to fetch the existing user ID here
        } else {
          console.error(`❌ Error creating user ${user.email}:`, error.message);
        }
      }
    }

    // 3. Create Test Doctors
    console.log('\n🩺 Creating test doctors...');
    
    const doctorId1 = userIds['user-doctor-001'] || 'doctor-001';
    const doctorId2 = userIds['user-doctor-002'] || 'doctor-002';

    const testDoctors = [
      {
        id: doctorId1,
        userId: doctorId1,
        specialty: 'General Physician',
        licenseNumber: 'GP001',
        consultationDuration: 30,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: doctorId2,
        userId: doctorId2,
        specialty: 'Cardiologist',
        licenseNumber: 'CARD001',
        consultationDuration: 45,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const doctor of testDoctors) {
      await setDoc(doc(db, 'doctors', doctor.id), doctor);
      console.log(`✅ Created doctor profile: ${doctor.specialty}`);
    }

    // 4. Create Test Doctor Schedules
    console.log('\n📅 Creating doctor schedules...');
    
    const schedules = [
      // Dr. Sharma - Mon to Fri, 9 AM - 5 PM
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `schedule-${doctorId1}-${i + 1}`,
        doctorId: doctorId1,
        dayOfWeek: i + 1, // Monday = 1, Friday = 5
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      // Dr. Kumar - Mon, Wed, Fri, 10 AM - 6 PM
      ...[1, 3, 5].map((day, idx) => ({
        id: `schedule-${doctorId2}-${idx + 1}`,
        doctorId: doctorId2,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    ];

    for (const schedule of schedules) {
      await setDoc(doc(db, 'doctorSchedules', schedule.id), schedule);
    }
    console.log(`✅ Created ${schedules.length} schedule entries`);

    // 5. Create Test Appointments
    console.log('\n📋 Creating test appointments...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testAppointments = [
      {
        id: 'apt-001',
        patientId: 'patient-001',
        doctorId: doctorId1,
        appointmentDate: tomorrow.toISOString().split('T')[0],
        appointmentTime: '10:00',
        duration: 30,
        status: 'confirmed',
        source: 'web',
        notes: 'Regular checkup',
        tokenNumber: 'T-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'apt-002',
        patientId: 'patient-002',
        doctorId: doctorId2,
        appointmentDate: tomorrow.toISOString().split('T')[0],
        appointmentTime: '14:30',
        duration: 45,
        status: 'scheduled',
        source: 'web',
        notes: 'Follow-up consultation',
        tokenNumber: 'T-002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const appointment of testAppointments) {
      await setDoc(doc(db, 'appointments', appointment.id), appointment);
      console.log(`✅ Created appointment: ${appointment.tokenNumber}`);
    }

    // 6. Create Audit Logs
    console.log('\n📊 Creating audit logs...');
    
    const auditLogs = [
      {
        id: 'audit-001',
        action: 'Patient Login',
        user: 'John Doe',
        timestamp: new Date().toISOString(),
        entityType: 'patient',
        entityId: 'patient-001',
        details: 'Patient logged in successfully'
      },
      {
        id: 'audit-002',
        action: 'Appointment Created',
        user: 'Admin User',
        timestamp: new Date().toISOString(),
        entityType: 'appointment',
        entityId: 'apt-001',
        details: 'New appointment created'
      }
    ];

    for (const log of auditLogs) {
      await setDoc(doc(db, 'auditLogs', log.id), log);
    }
    console.log(`✅ Created ${auditLogs.length} audit logs`);

    console.log('\n✅ ✅ ✅ Test data setup complete! ✅ ✅ ✅\n');
    console.log('📝 Test Credentials:');
    console.log('───────────────────────────────────────');
    console.log('Patient Login:');
    console.log('  Email: john.doe@example.com');
    console.log('  Password: Test@123');
    console.log('');
    console.log('Admin Login:');
    console.log('  Email: admin@clinic.com');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('Doctor Login:');
    console.log('  Email: dr.sharma@clinic.com');
    console.log('  Password: Doctor@123');
    console.log('───────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
};

// Run the setup
setupTestData()
  .then(() => {
    console.log('🎉 All done! You can now test your application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

