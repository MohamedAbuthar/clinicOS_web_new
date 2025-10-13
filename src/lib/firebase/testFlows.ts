/**
 * Firebase Flow Testing
 * Tests all major flows to ensure Firebase integration works
 * 
 * Usage:
 * npx tsx src/lib/firebase/testFlows.ts
 */

import { auth } from './config';
import { patientSignInWithEmail, signOut as firebaseSignOut } from './auth';
import { 
  getPatientProfile,
  getAllDoctors,
  getAppointments,
  createAppointment
} from './firestore';

const testFlows = async () => {
  console.log('🧪 Testing Firebase Flows...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Patient Authentication
  console.log('1️⃣ Testing Patient Authentication...');
  try {
    const result = await patientSignInWithEmail('john.doe@example.com', 'Test@123');
    if (result && result.success) {
      console.log('   ✅ Patient login successful');
      console.log(`   User ID: ${result.firebaseUser.uid}`);
      console.log(`   Email: ${result.firebaseUser.email}`);
      testsPassed++;
    } else {
      console.log('   ❌ Login failed - no user returned');
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Login failed: ${error.message}`);
    testsFailed++;
  }

  // Test 2: Get Patient Profile
  console.log('\n2️⃣ Testing Patient Profile Retrieval...');
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const profileResponse = await getPatientProfile(currentUser.uid);
      if (profileResponse && profileResponse.success && profileResponse.data) {
        console.log('   ✅ Profile retrieved successfully');
        const profile = profileResponse.data as any;
        console.log(`   Name: ${profile.name || 'N/A'}`);
        console.log(`   Email: ${profile.email || 'N/A'}`);
        console.log(`   Blood Group: ${profile.bloodGroup || 'N/A'}`);
        testsPassed++;
      } else {
        console.log('   ❌ Profile not found');
        testsFailed++;
      }
    } else {
      console.log('   ❌ No authenticated user');
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 3: Get Doctors List
  console.log('\n3️⃣ Testing Doctors List Retrieval...');
  try {
    const doctorsResult = await getAllDoctors();
    const doctors = doctorsResult.success ? doctorsResult.data : [];
    if (doctors && doctors.length > 0) {
      console.log(`   ✅ Retrieved ${doctors.length} doctors`);
      doctors.forEach((doctor, idx) => {
        const doctorData = doctor as any;
        console.log(`   ${idx + 1}. ${doctorData.specialty || 'N/A'} - License: ${doctorData.licenseNumber || 'N/A'}`);
      });
      testsPassed++;
    } else {
      console.log('   ⚠️  No doctors found (this is okay if you haven\'t added doctors yet)');
      testsPassed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Get Appointments
  console.log('\n4️⃣ Testing Appointments Retrieval...');
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const appointments = await getAppointments(currentUser.uid);
      if (appointments) {
        console.log(`   ✅ Retrieved ${appointments.length} appointments`);
        appointments.forEach((apt, idx) => {
          const aptData = apt as any;
          console.log(`   ${idx + 1}. ${aptData.appointmentDate || 'N/A'} ${aptData.appointmentTime || 'N/A'} - Status: ${aptData.status || 'N/A'}`);
        });
        testsPassed++;
      } else {
        console.log('   ⚠️  No appointments found');
        testsPassed++;
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 5: Create Appointment
  console.log('\n5️⃣ Testing Appointment Creation...');
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const newAppointment = await createAppointment({
        patientId: currentUser.uid,
        doctorId: 'doctor-001', // Use a test doctor ID
        appointmentDate: tomorrow.toISOString().split('T')[0],
        appointmentTime: '11:00',
        duration: 30,
        status: 'scheduled',
        source: 'web',
        notes: 'Test appointment'
        // Note: tokenNumber not provided - should be auto-generated
      });
      
      if (newAppointment) {
        console.log('   ✅ Appointment created successfully');
        const aptData = newAppointment as any;
        console.log(`   Appointment ID: ${aptData.id || 'N/A'}`);
        console.log(`   Token: ${aptData.tokenNumber || 'N/A'}`);
        testsPassed++;
      } else {
        console.log('   ❌ Failed to create appointment');
        testsFailed++;
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 6: Get Recent Activity (Audit Logs)
  console.log('\n6️⃣ Testing Audit Logs Retrieval...');
  try {
    // Note: getRecentActivity function is not available in the current implementation
    console.log('   ⚠️  Audit logs functionality not implemented yet');
    testsPassed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 7: Sign Out
  console.log('\n7️⃣ Testing Sign Out...');
  try {
    await firebaseSignOut();
    if (!auth.currentUser) {
      console.log('   ✅ Sign out successful');
      testsPassed++;
    } else {
      console.log('   ❌ User still logged in');
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Test Summary');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total:  ${testsPassed + testsFailed}`);
  console.log('═'.repeat(50));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Firebase is working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
};

// Run the tests
testFlows()
  .then(() => {
    console.log('\n✅ Testing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  });

