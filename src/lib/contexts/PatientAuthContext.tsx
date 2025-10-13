'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  patientSignInWithEmail,
  signOut as firebaseSignOut,
  PatientProfile 
} from '../firebase/auth';
import { getPatientProfile } from '../firebase/firestore';
import { sendOTPEmail, verifyOTP as verifyOTPEmail, resendOTP as resendOTPEmail } from '../services/emailOTPService';

interface PatientAuthContextType {
  patient: PatientProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (email: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendOTP: (email: string) => Promise<any>;
  login: (email: string, otp: string) => Promise<any>;
  logout: () => void;
  refreshPatient: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};

interface PatientAuthProviderProps {
  children: ReactNode;
}

export const PatientAuthProvider: React.FC<PatientAuthProviderProps> = ({ children }) => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!firebaseUser && !!patient;

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔄 Setting up Firebase auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in, get patient profile from Firestore
        try {
          console.log('📥 Fetching patient profile for:', user.uid);
          const result = await getPatientProfile(user.uid);
          if (result.success && result.data) {
            console.log('✅ Patient profile loaded:', result.data);
            setPatient(result.data as PatientProfile);
          } else {
            console.log('⚠️ Patient profile not found - user may need to complete registration');
            console.log('   Error:', result.error);
            setPatient(null);
            // Note: User has Firebase auth but no Firestore patient profile
            // They should complete registration at /Patient/register
          }
        } catch (error) {
          console.error('❌ Error fetching patient profile:', error);
          setPatient(null);
        }
      } else {
        // User is signed out
        console.log('👤 No authenticated user');
        setPatient(null);
      }
      
      setIsLoading(false);
      console.log('✅ Auth state loading complete');
    });

    // Cleanup subscription
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Send OTP to email
  const sendOTP = async (email: string) => {
    try {
      const result = await sendOTPEmail(email);
      return result;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP'
      };
    }
  };

  // Verify OTP only (used internally)
  const verifyOTP = async (email: string, otp: string) => {
    try {
      const result = await verifyOTPEmail(email, otp);
      return result;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify OTP'
      };
    }
  };

  // Resend OTP to email
  const resendOTP = async (email: string) => {
    try {
      const result = await resendOTPEmail(email);
      return result;
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to resend OTP'
      };
    }
  };

  // Login with email and OTP
  const login = async (email: string, otp: string) => {
    try {
      console.log('Verifying OTP for email:', email);
      
      // Step 1: Verify OTP via backend
      const otpResult = await verifyOTPEmail(email, otp);
      
      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message
        };
      }

      console.log('OTP verified successfully, checking patient profile...');

      // Step 2: Try to sign in with Firebase Auth (use email as password since that's what we set during registration)
      try {
        const result = await patientSignInWithEmail(email, email); // Use email as password
        
        if (result.success && result.patient && result.firebaseUser) {
          console.log('Patient found and signed in successfully');
          setPatient(result.patient);
          setFirebaseUser(result.firebaseUser);
          
          // Store token for protected routes
          localStorage.setItem('patientToken', result.firebaseUser.uid);
          
          return {
            success: true,
            message: 'Login successful',
            patient: result.patient,
            token: result.firebaseUser.uid,
            isNewUser: false // Existing user
          };
        } else {
          // Patient doesn't exist, needs to register
          console.log('Patient not found, needs registration');
          return {
            success: true,
            message: 'OTP verified, please complete registration',
            patient: null,
            token: null,
            isNewUser: true // New user needs registration
          };
        }
      } catch (firebaseError: any) {
        // If Firebase auth fails, patient doesn't exist yet
        console.log('Firebase auth failed, patient needs to register:', firebaseError.message);
        return {
          success: true,
          message: 'OTP verified, please complete registration',
          patient: null,
          token: null,
          isNewUser: true // New user needs registration
        };
      }
    } catch (error: any) {
      console.error('Login error in context:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      setPatient(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshPatient = async (): Promise<void> => {
    if (!firebaseUser) return;

    try {
      const result = await getPatientProfile(firebaseUser.uid);
      if (result.success && result.data) {
        setPatient(result.data as PatientProfile);
      }
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      await logout();
    }
  };

  const value: PatientAuthContextType = {
    patient,
    firebaseUser,
    isLoading,
    isAuthenticated,
    sendOTP,
    verifyOTP,
    resendOTP,
    login,
    logout,
    refreshPatient,
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};
