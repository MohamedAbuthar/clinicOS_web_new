'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, signOut } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'doctor' | 'assistant'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { login: contextLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (activeTab === 'signup') {
        // Handle signup logic with Firebase
        const user = await signUpWithEmail(email, password);
        
        if (user) {
          // Create user profile in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            name: fullName,
            email: email,
            role: role,
            phone: phone,
            avatar: '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Sign out after signup so user can log in fresh
          await signOut();

          setSuccessMessage('Account created successfully! Please sign in.');
          // Clear form and switch to login
          setActiveTab('login');
          setFullName('');
          setEmail('');
          setPassword('');
          setPhone('');
          setRole('admin');
        } else {
          setError('Failed to create account');
        }
      } else {
        // Handle login logic using AuthContext
        const result = await contextLogin(email, password);

        if (result.success) {
          setSuccessMessage('Login successful! Redirecting...');
          
          // Wait a bit for auth state to propagate, then redirect
          console.log('Redirecting to dashboard...');
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/Admin/dashboard');
        } else {
          setError(result.message || 'Invalid email or password');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
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

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg 
              className="w-8 h-8" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M3 12C3 12 5.5 6 12 6C18.5 6 21 12 21 12M12 12V20M12 12L8 8M12 12L16 8" 
                stroke="#0D9488" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-2xl font-semibold text-gray-900">
              ClinicFlow
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-500">
            Sign in to your staff account or create a new one
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name Field - Only for Sign Up */}
          {activeTab === 'signup' && (
            <div className="mb-4">
              <label 
                htmlFor="fullName" 
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                required
              />
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Phone Field - Only for Sign Up */}
          {activeTab === 'signup' && (
            <div className="mb-4">
              <label 
                htmlFor="phone" 
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                required
              />
            </div>
          )}

          {/* Role Field - Only for Sign Up */}
          {activeTab === 'signup' && (
            <div className="mb-4">
              <label 
                htmlFor="role" 
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'doctor' | 'assistant')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                required
              >
                <option value="admin">Administrator</option>
                <option value="doctor">Doctor</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>
          )}

          {/* Password Field */}
          <div className="mb-6">
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              activeTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* No "Forgot password?" link */}
      </div>
    </div>
  );
};

export default Auth;