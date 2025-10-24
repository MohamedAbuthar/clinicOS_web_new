// Assistant Password Email Service
// Sends login credentials to newly created assistants via email

export interface PasswordEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Send login credentials to assistant's email
 * @param email - Assistant's email address
 * @param password - Assistant's password
 * @param name - Assistant's full name
 * @returns Promise with success status and message
 */
export async function sendPasswordEmail(
  email: string,
  password: string,
  name: string
): Promise<PasswordEmailResponse> {
  try {
    // Validate inputs
    if (!email || !password || !name) {
      return {
        success: false,
        message: 'Email, password, and name are required',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format',
      };
    }

    console.log('📧 Sending login credentials via email...');

    // Send email via Next.js API route
    const response = await fetch('/api/assistant/send-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Failed to send email. Please try again.',
      };
    }

    console.log(`✅ Login credentials sent to ${email}`);

    return {
      success: true,
      message: 'Login credentials sent successfully to assistant\'s email',
    };
  } catch (error: any) {
    console.error('Error sending password email:', error);

    return {
      success: false,
      message: error.message || 'Failed to send email. Please try again.',
    };
  }
}

/**
 * Send login credentials with error handling and retry logic
 * @param email - Assistant's email address
 * @param password - Assistant's password
 * @param name - Assistant's full name
 * @param retries - Number of retry attempts (default: 2)
 * @returns Promise with success status and message
 */
export async function sendPasswordEmailWithRetry(
  email: string,
  password: string,
  name: string,
  retries: number = 2
): Promise<PasswordEmailResponse> {
  let lastError: PasswordEmailResponse = {
    success: false,
    message: 'Failed to send email after multiple attempts',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`Retry attempt ${attempt} for sending email to ${email}`);
      // Wait before retry (exponential backoff: 1s, 2s, 4s, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }

    const result = await sendPasswordEmail(email, password, name);

    if (result.success) {
      return result;
    }

    lastError = result;
  }

  return lastError;
}

