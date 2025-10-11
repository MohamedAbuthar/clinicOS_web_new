'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { patientAuthApi, Patient, PatientAuthResponse } from '../api';

interface PatientAuthContextType {
  patient: Patient | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, otp: string) => Promise<PatientAuthResponse>;
  logout: () => void;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!patient;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('patientToken');
        const storedPatient = localStorage.getItem('patientData');

        if (storedToken && storedPatient) {
          setToken(storedToken);
          setPatient(JSON.parse(storedPatient));
          
          // Verify token is still valid by making an API call
          try {
            const response = await patientAuthApi.getCurrentPatient();
            if (response.success && response.data) {
              // Token is valid, update patient data
              setPatient(response.data);
              localStorage.setItem('patientData', JSON.stringify(response.data));
            } else {
              // Token is invalid, clear storage
              console.log('Token invalid, clearing auth');
              localStorage.removeItem('patientToken');
              localStorage.removeItem('patientData');
              setToken(null);
              setPatient(null);
            }
          } catch (error) {
            // Token is invalid or API call failed, clear storage
            console.log('Token verification failed, clearing auth');
            localStorage.removeItem('patientToken');
            localStorage.removeItem('patientData');
            setToken(null);
            setPatient(null);
          }
        } else {
          // No stored auth, user needs to log in
          console.log('No stored auth, user must log in');
        }
      } catch (error) {
        console.error('Error initializing patient auth:', error);
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientData');
        setToken(null);
        setPatient(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const sendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await patientAuthApi.sendOTP(email);
      
      // Log OTP to console for development/testing
      if (response.success && response.data?.otp) {
        console.log('🔐 OTP for testing:', response.data.otp);
        console.log('📧 Email address:', email);
      }
      
      return {
        success: response.success,
        message: response.message || 'OTP sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP'
      };
    }
  };

  const resendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await patientAuthApi.resendOTP(email);
      
      // Log OTP to console for development/testing
      if (response.success && response.data?.otp) {
        console.log('🔄 Resent OTP for testing:', response.data.otp);
        console.log('📧 Email address:', email);
      }
      
      return {
        success: response.success,
        message: response.message || 'OTP resent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to resend OTP'
      };
    }
  };

  const login = async (email: string, otp: string): Promise<PatientAuthResponse> => {
    try {
      console.log('Verifying OTP for email:', email); // Debug log
      const response = await patientAuthApi.verifyOTP(email, otp);
      console.log('API response:', response); // Debug log
      
      if (response.success && response.token && response.patient) {
        console.log('Setting patient data:', response.patient); // Debug log
        console.log('Storing patient token:', response.token.substring(0, 20) + '...'); // Debug log
        setToken(response.token);
        setPatient(response.patient);
        
        // Store in localStorage
        localStorage.setItem('patientToken', response.token);
        localStorage.setItem('patientData', JSON.stringify(response.patient));
        console.log('Token stored in localStorage:', localStorage.getItem('patientToken') ? 'Yes' : 'No'); // Debug log
      }
      
      return response;
    } catch (error: any) {
      console.log('Login error in context:', error); // Debug log
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await patientAuthApi.logout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setPatient(null);
      setToken(null);
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientData');
    }
  };

  const refreshPatient = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await patientAuthApi.getCurrentPatient();
      if (response.success && response.data) {
        setPatient(response.data);
        localStorage.setItem('patientData', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      // If refresh fails, logout the user
      logout();
    }
  };

  const value: PatientAuthContextType = {
    patient,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    sendOTP,
    resendOTP,
    refreshPatient,
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};
