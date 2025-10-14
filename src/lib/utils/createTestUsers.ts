// Utility function to create test users for the admin portal
// This can be used to quickly create doctors and assistants for testing

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'doctor' | 'assistant';
}

export const createTestUser = async (userData: CreateUserData) => {
  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone,
      avatar: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
    return { success: true, user };
  } catch (error) {
    console.error(`❌ Error creating ${userData.role}:`, error);
    return { success: false, error };
  }
};

// Predefined test users
export const testUsers: CreateUserData[] = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'doctor1@clinic.com',
    password: 'doctor123',
    phone: '+1234567890',
    role: 'doctor'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'doctor2@clinic.com',
    password: 'doctor123',
    phone: '+1234567891',
    role: 'doctor'
  },
  {
    name: 'Emily Rodriguez',
    email: 'assistant1@clinic.com',
    password: 'assistant123',
    phone: '+1234567892',
    role: 'assistant'
  },
  {
    name: 'James Wilson',
    email: 'assistant2@clinic.com',
    password: 'assistant123',
    phone: '+1234567893',
    role: 'assistant'
  },
  {
    name: 'Admin User',
    email: 'admin@clinic.com',
    password: 'admin123',
    phone: '+1234567894',
    role: 'admin'
  }
];

// Function to create all test users
export const createAllTestUsers = async () => {
  console.log('🚀 Creating test users...');
  
  for (const userData of testUsers) {
    await createTestUser(userData);
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ All test users created!');
  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
};
