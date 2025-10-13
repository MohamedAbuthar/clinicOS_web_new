// Firebase Authentication Service
// Replaces backend authentication with Firebase Auth
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Types matching your backend structure
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant' | 'patient';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
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

// Admin/Staff Authentication
export const adminSignIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    const userData = userDoc.data() as UserProfile;
    
    // Check if user is admin, doctor, or assistant
    if (!['admin', 'doctor', 'assistant'].includes(userData.role)) {
      throw new Error('Unauthorized: This login is for staff only');
    }
    
    return {
      success: true,
      user: userData,
      firebaseUser: user
    };
  } catch (error: any) {
    console.error('Admin sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Generic sign in (used by login component)
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Generic sign up (used by login component)
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Patient Phone Authentication (OTP)
let confirmationResult: ConfirmationResult | null = null;

export const sendOTPToPhone = async (phoneNumber: string, recaptchaContainer: string) => {
  try {
    // Check if patient exists in Firestore
    const patientDoc = await getDoc(doc(db, 'patients', phoneNumber));
    if (!patientDoc.exists()) {
      throw new Error('Patient not found. Please register first.');
    }
    
    // Set up reCAPTCHA
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
      size: 'invisible',
    });
    
    // Send OTP
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    throw new Error(error.message || 'Failed to send OTP');
  }
};

export const verifyOTP = async (otp: string) => {
  try {
    if (!confirmationResult) {
      throw new Error('Please request OTP first');
    }
    
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;
    
    // Get patient profile from Firestore
    const patientDoc = await getDoc(doc(db, 'patients', user.phoneNumber || ''));
    if (!patientDoc.exists()) {
      throw new Error('Patient profile not found');
    }
    
    const patientData = patientDoc.data() as PatientProfile;
    
    return {
      success: true,
      patient: patientData,
      firebaseUser: user
    };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    throw new Error(error.message || 'Invalid OTP');
  }
};

// Patient Email Authentication (Alternative)
export const patientSignInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get patient profile from Firestore
    const patientDoc = await getDoc(doc(db, 'patients', user.uid));
    if (!patientDoc.exists()) {
      throw new Error('Patient profile not found');
    }
    
    const patientData = patientDoc.data() as PatientProfile;
    
    return {
      success: true,
      patient: patientData,
      firebaseUser: user
    };
  } catch (error: any) {
    console.error('Patient sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Patient Registration
export const registerPatient = async (
  email: string,
  password: string,
  patientData: Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, {
      displayName: patientData.name
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Create patient profile in Firestore
    const newPatient: PatientProfile = {
      ...patientData,
      id: user.uid,
      email: email,
      familyId: user.uid, // Use patient's own ID as initial familyId
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'patients', user.uid), newPatient);
    
    return {
      success: true,
      patient: newPatient,
      message: 'Registration successful. Please verify your email.'
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register');
  }
};

// Sign Out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    confirmationResult = null; // Clear OTP confirmation
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Password Reset
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent'
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send reset email');
  }
};

// Get current Firebase user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    await updateDoc(doc(db, 'users', user.uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Update patient profile
export const updatePatientProfile = async (updates: Partial<PatientProfile>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    await updateDoc(doc(db, 'patients', user.uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Update patient profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

