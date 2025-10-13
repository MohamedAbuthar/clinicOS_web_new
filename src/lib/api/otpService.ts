// OTP Service - Handles OTP email sending and verification via backend API

// Backend API base URL (without /api suffix since endpoints already include it)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  attemptsLeft?: number;
  email?: string;
}

/**
 * Send OTP to the provided email address
 */
export async function sendOTPEmail(email: string): Promise<OTPResponse> {
  try {
    const url = `${API_BASE_URL}/api/otp/send`;
    console.log('Sending OTP to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log('OTP send response:', data);
    return data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please check your connection and try again.',
    };
  }
}

/**
 * Verify the OTP for the given email
 */
export async function verifyOTPEmail(email: string, otp: string): Promise<OTPResponse> {
  try {
    const url = `${API_BASE_URL}/api/otp/verify`;
    console.log('Verifying OTP at:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    console.log('OTP verify response:', data);
    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please check your connection and try again.',
    };
  }
}

/**
 * Resend OTP to the provided email address
 */
export async function resendOTPEmail(email: string): Promise<OTPResponse> {
  try {
    const url = `${API_BASE_URL}/api/otp/resend`;
    console.log('Resending OTP to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log('OTP resend response:', data);
    return data;
  } catch (error) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      message: 'Failed to resend OTP. Please check your connection and try again.',
    };
  }
}

