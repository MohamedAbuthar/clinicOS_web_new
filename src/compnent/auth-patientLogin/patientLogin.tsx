import React, { useState } from 'react';
import { Users, ArrowLeft, Smartphone, Lock } from 'lucide-react';

export default function PatientLogin() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleBackToHome = () => {
    console.log('Navigate back to home');
  };

  const handleSendOTP = () => {
    if (mobileNumber.length === 10) {
      console.log('Sending OTP to:', mobileNumber);
      setIsOtpSent(true);
    } else {
      alert('Please enter a valid 10-digit mobile number');
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length === 6) {
      console.log('Verifying OTP:', otp);
      alert('OTP Verified Successfully!');
      // Navigate to patient dashboard
      window.location.href = '/Patient/dashboard';
    } else {
      alert('Please enter a valid 6-digit OTP');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileNumber(value);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
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
            Patient Login
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-500 text-center mb-8">
            Enter your mobile number to receive OTP
          </p>

          {/* Mobile Number Input */}
          <div className="mb-6">
            <label className="block text-gray-900 font-medium mb-3">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={handleInputChange}
                placeholder="Enter your 10-digit mobile number"
                className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                disabled={isOtpSent}
              />
            </div>
          </div>

          {/* Send OTP Button */}
          {!isOtpSent && (
            <button
              onClick={handleSendOTP}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 rounded-lg transition-colors mb-6"
            >
              Send OTP
            </button>
          )}

          {/* OTP Input - Show only after OTP is sent */}
          {isOtpSent && (
            <>
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Enter OTP
                </label>
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
                  />
                </div>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOTP}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 rounded-lg transition-colors mb-6"
              >
                Verify OTP
              </button>

              {/* Resend OTP */}
              <div className="text-center mb-6">
                <button
                  onClick={() => {
                    setOtp('');
                    console.log('Resending OTP');
                  }}
                  className="text-teal-500 hover:text-teal-600 font-medium text-sm"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}