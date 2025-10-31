import React, { useState } from 'react';
import { Users, ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { useRouter } from 'next/navigation';

export default function PatientLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [role, setRole] = useState('patient');
  
  const { loginWithEmailPassword, signup } = usePatientAuth();
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone number input with +91 prefix and 10 digit limit
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Always ensure +91 prefix
    if (!value.startsWith('+91 ')) {
      value = '+91 ';
    }
    
    // Extract only the number part after +91 
    const numberPart = value.slice(4).replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedNumber = numberPart.slice(0, 10);
    
    // Format as +91 XXXXXXXXXX
    const formattedValue = '+91 ' + limitedNumber;
    
    setPhoneNumber(formattedValue);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !isValidEmail(loginEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!loginPassword) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await loginWithEmailPassword(loginEmail, loginPassword);
      
      if (result.success && result.patient && result.token) {
        console.log('✅ Patient logged in successfully');
        // Wait a bit to ensure token is stored
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/Patient/dashboard');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.log('❌ Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !isValidEmail(signupEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!fullName || fullName.trim() === '') {
      setError('Please enter your full name');
      return;
    }

    // Validate phone number has exactly 10 digits after +91
    const phoneDigits = phoneNumber.replace('+91 ', '').replace(/\D/g, '');
    if (!phoneNumber || phoneNumber.trim() === '' || phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signup(signupEmail, signupPassword, fullName, phoneNumber, role);
      
      if (result.success && result.patient) {
        console.log('✅ Patient registered successfully');
        // Wait a bit to ensure token is stored
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/Patient/dashboard');
      } else {
        // Error is already handled with user-friendly message in the context
        setError(result.message || 'Registration failed');
      }
    } catch (error: any) {
      console.log('❌ Signup error:', error);
      // Fallback error handling if something unexpected happens
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">Back to Home</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-teal-500 rounded-2xl p-4">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {isSignup ? 'Patient Sign Up' : 'Patient Login'}
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-500 text-center mb-8">
            {isSignup ? 'Create your account to get started' : 'Enter your credentials to login'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Login Form */}
          {!isSignup && (
            <form onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-medium py-3 rounded-lg transition-colors mb-6 ${
                  isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {isSignup && (
            <form onSubmit={handleSignup}>
              {/* Full Name Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="+91 9876543210"
                    maxLength={14}
                    className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Role Input - Read Only */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value="Patient"
                    readOnly
                    className="w-full pl-12 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Enter your password (min 6 characters)"
                    className="w-full pl-12 pr-12 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-medium py-3 rounded-lg transition-colors mb-6 ${
                  isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Toggle between Login and Signup */}
          <div className="text-center">
            {!isSignup ? (
              <p className="text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignup(true);
                    setError('');
                    setPhoneNumber('+91 ');
                  }}
                  className="text-teal-500 hover:text-teal-600 font-medium"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignup(false);
                    setError('');
                  }}
                  className="text-teal-500 hover:text-teal-600 font-medium"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
