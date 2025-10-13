import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Mail, Lock } from 'lucide-react';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { useRouter } from 'next/navigation';

export default function PatientLogin() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { sendOTP, resendOTP, login } = usePatientAuth();
  const router = useRouter();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleSendOTP = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await sendOTP(email);
      if (result.success) {
        setIsOtpSent(true);
        setTimeLeft(180); // Reset timer to 3 minutes
        setIsTimerActive(true);
        setOtp('');
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, otp);
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        if (result.patient && result.token) {
          // Existing patient - logged in successfully
          console.log('✅ Existing patient logged in successfully');
          console.log('Token stored:', localStorage.getItem('patientToken'));
          
          // Wait a bit to ensure token is stored
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Redirect to dashboard for existing users
          console.log('Redirecting to dashboard...');
          router.push('/Patient/dashboard');
        } else if (result.isNewUser) {
          // New patient - needs to complete registration
          console.log('📝 New patient - redirecting to registration');
          router.push(`/Patient/register?email=${encodeURIComponent(email)}`);
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        console.log('❌ Login failed:', result.message);
        setError(result.message);
      }
    } catch (error: any) {
      console.log('❌ Login error:', error);
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendOTP = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await resendOTP(email);
      if (result.success) {
        setTimeLeft(180);
        setIsTimerActive(true);
        setOtp('');
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const isTimerExpired = isTimerActive && timeLeft === 0;

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
            Patient Login
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-500 text-center mb-8">
            {isOtpSent ? 'Enter the OTP sent to your email' : 'Enter your email address to receive OTP'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

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
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                disabled={isOtpSent}
              />
            </div>
          </div>

          {/* Send OTP Button */}
          {!isOtpSent && (
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className={`w-full font-medium py-3 rounded-lg transition-colors mb-6 ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          )}

          {/* OTP Input - Show only after OTP is sent */}
          {isOtpSent && (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-gray-900 font-medium">
                    Enter OTP
                  </label>
                  <span className={`text-sm font-medium ${isTimerExpired ? 'text-red-500' : 'text-teal-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    disabled={isTimerExpired}
                  />
                </div>
                {isTimerExpired && (
                  <p className="text-xs text-red-500 mt-2">OTP has expired. Please request a new one.</p>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOTP}
                disabled={isTimerExpired || isLoading}
                className={`w-full font-medium py-3 rounded-lg transition-colors mb-6 ${
                  isTimerExpired || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Resend OTP */}
              <div className="text-center mb-6">
                {isTimerExpired ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className={`font-medium text-sm ${
                      isLoading
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-teal-500 hover:text-teal-600'
                    }`}
                  >
                    {isLoading ? 'Resending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Didn&apos;t receive OTP? <span className="text-gray-400 text-xs">({formatTime(timeLeft)})</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}