// Frontend Email OTP Service
// Uses Next.js API Route that sends emails via Gmail SMTP (nodemailer)
// No external services needed - everything runs in your Next.js app!

// In-memory OTP storage (stores in browser memory)
interface OTPRecord {
  otp: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

// Use localStorage for persistence across page reloads
const OTP_STORAGE_KEY = 'clinic_otp_records';

function getOTPRecords(): Record<string, OTPRecord> {
  const stored = localStorage.getItem(OTP_STORAGE_KEY);
  if (!stored) return {};
  
  try {
    const records = JSON.parse(stored);
    // Clean up expired OTPs
    const now = new Date();
    Object.keys(records).forEach(email => {
      if (new Date(records[email].expiresAt) < now) {
        delete records[email];
      }
    });
    return records;
  } catch {
    return {};
  }
}

function saveOTPRecords(records: Record<string, OTPRecord>) {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(records));
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email via Next.js API Route (Uses Gmail SMTP with nodemailer)
 */
export async function sendOTPEmail(email: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }

    // Check rate limiting (prevent sending OTP too frequently)
    const records = getOTPRecords();
    const existingOTP = records[email.toLowerCase()];
    
    if (existingOTP && new Date(existingOTP.expiresAt) > new Date()) {
      const timeDiff = new Date(existingOTP.expiresAt).getTime() - Date.now();
      if (timeDiff > 8 * 60 * 1000) { // If less than 2 minutes since last send
        return {
          success: false,
          message: 'Please wait before requesting another OTP'
        };
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in localStorage
    records[email.toLowerCase()] = {
      otp,
      email: email.toLowerCase(),
      expiresAt,
      attempts: 0
    };
    saveOTPRecords(records);

    // Send email via Next.js API route (Gmail SMTP)
    console.log('📧 Sending OTP via Gmail SMTP...');
    
    const response = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!data.success) {
      // If email fails, remove from storage
      delete records[email.toLowerCase()];
      saveOTPRecords(records);
      return {
        success: false,
        message: data.message || 'Failed to send email. Please try again.'
      };
    }

    console.log(`✅ OTP sent to ${email}: ${otp}`); // For testing only

    return {
      success: true,
      message: 'OTP sent successfully! Check your email.',
      expiresIn: 600 // 10 minutes in seconds
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Remove from storage if email failed
    const records = getOTPRecords();
    delete records[email.toLowerCase()];
    saveOTPRecords(records);
    
    return {
      success: false,
      message: error.text || 'Failed to send OTP. Please try again.'
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string; attemptsLeft?: number }> {
  try {
    if (!email || !otp) {
      return {
        success: false,
        message: 'Email and OTP are required'
      };
    }

    // Get stored OTP
    const records = getOTPRecords();
    const record = records[email.toLowerCase()];

    if (!record) {
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new one.'
      };
    }

    // Check if expired
    if (new Date(record.expiresAt) < new Date()) {
      delete records[email.toLowerCase()];
      saveOTPRecords(records);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Check attempts (max 3 attempts)
    if (record.attempts >= 3) {
      delete records[email.toLowerCase()];
      saveOTPRecords(records);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (record.otp !== otp) {
      record.attempts++;
      saveOTPRecords(records);
      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
        attemptsLeft: 3 - record.attempts
      };
    }

    // OTP verified successfully
    delete records[email.toLowerCase()];
    saveOTPRecords(records);

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    };
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
  try {
    // Delete existing OTP
    const records = getOTPRecords();
    delete records[email.toLowerCase()];
    saveOTPRecords(records);

    // Send new OTP
    return sendOTPEmail(email);
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      message: 'Failed to resend OTP. Please try again.'
    };
  }
}

/*
==================================================================================
📧 GMAIL SMTP SETUP (1 minute - NO external services needed!)
==================================================================================

✅ Already Done:
- nodemailer installed
- API route created at src/app/api/otp/send/route.ts
- Frontend service updated to use the API route

ONLY STEP: Add Gmail credentials to .env.local
--------------------------------------------------
Create/edit .env.local in your project root:

SMTP_EMAIL=abutharskt@gmail.com
SMTP_APP_PASSWORD=osrb bxqc cvln onya

That's it! Now test:
--------------------------------------------------
1. Restart dev server (npm run dev)
2. Go to: http://localhost:3000/Auth-patientLogin
3. Enter any email and click "Send OTP"
4. Check email inbox for OTP - sent from abutharskt@gmail.com
5. Done! 🎉

==================================================================================
Your app now sends OTP emails via Gmail SMTP - 100% within your Next.js app!
No external services, no signups, just your Gmail credentials!
==================================================================================
*/

