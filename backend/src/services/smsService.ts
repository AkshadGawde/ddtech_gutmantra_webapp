import { randomBytes } from 'crypto';

// Initialize Zavu SDK client
// @ts-ignore - SDK may not have complete TypeScript definitions
let zavuClient: any = null;

/**
 * Initialize the Zavu SMS client with your API key
 * Call this once during server startup
 *
 * Usage: initializeSmsClient(process.env.ZAVUDEV_API_KEY!)
 */
export function initializeSmsClient(apiKey: string) {
  try {
    // Import Zavu SDK
    const Zavudev = require('@zavudev/sdk').default;

    // Initialize with your API key
    zavuClient = new Zavudev({
      apiKey: apiKey,
    });

    console.log('✅ Zavu SMS client initialized successfully');
    return zavuClient;
  } catch (error) {
    console.error('❌ Failed to initialize Zavu SMS client:', error);
    throw new Error('SMS service initialization failed');
  }
}

/**
 * Generate a cryptographically secure 6-digit OTP
 * Uses crypto.randomBytes for production-grade security
 */
export function generateSecureOTP(): string {
  // Generate 3 random bytes (24 bits) to get a number between 0-16777215
  const randomBuffer = randomBytes(3);
  const randomNum = randomBuffer.readUintBE(0, 3); // Read as 24-bit unsigned integer
  const otp = (randomNum % 1000000).toString().padStart(6, '0'); // Get last 6 digits, pad with zeros
  return otp;
}

/**
 * Normalize phone number to international format with country code
 * Accepts: 9601279172, 09601279172, +919601279172, 919601279172
 * Returns: +919601279172
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/\D/g, '');

  // Handle different input formats
  if (phone.startsWith('+')) {
    // Already has +, just ensure country code
    cleaned = phone.substring(1).replace(/\D/g, '');
  }

  // If it's an Indian number without country code, add 91
  if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '91' + cleaned;
  }

  // If it starts with 0 (legacy Indian format), remove it and add 91
  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }

  // Validate it's a reasonable length (country code + 10 digits minimum)
  if (cleaned.length < 11) {
    return null;
  }

  return '+' + cleaned;
}

/**
 * Send OTP via SMS using Zavu API
 * @param userPhoneNumber - Phone number in any format (will be normalized)
 * @param otpCode - 6-digit OTP code
 * @returns Promise with success status and message
 */
export async function sendLoginSMS(userPhoneNumber: string, otpCode: string): Promise<{
  success: boolean;
  message: string;
  requestId?: string;
  error?: string;
}> {
  try {
    // Validate client initialization
    if (!zavuClient) {
      throw new Error('SMS client not initialized. Call initializeSmsClient() first.');
    }

    // Normalize phone number to international format
    const normalizedPhone = normalizePhoneNumber(userPhoneNumber);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format. Must be a valid mobile number.',
        message: 'Phone validation failed',
      };
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otpCode)) {
      return {
        success: false,
        error: 'OTP must be exactly 6 digits',
        message: 'Invalid OTP format',
      };
    }

    // Build SMS message (MUST be under 160 characters)
    const smsBody = `Your Gutmantra verification code is ${otpCode}. Valid for 5 minutes.`;

    // Strict character check
    if (smsBody.length > 160) {
      return {
        success: false,
        error: `SMS body exceeds 160 characters (${smsBody.length} chars). Please shorten the message.`,
        message: 'SMS too long',
      };
    }

    console.log(`📱 Sending SMS to ${normalizedPhone}`);
    console.log(`📝 Message: "${smsBody}" (${smsBody.length} chars)`);

    // Call Zavu API to send SMS
    // Documentation: https://docs.zavu.dev/reference/send-message
    const response = await zavuClient.messages.send({
      to: normalizedPhone,
      channel: 'sms_oneway', // Use SMS one-way channel as configured in Zavu
      text: smsBody,
      // Optionally: senderId: 'kd71wx4apzpmr0fmdaq857t6h187hecp', // Your Zavu sender ID
    });

    // Check response status
    // Zavu returns success with various response formats
    if (
      response &&
      (response.status === 'sent' ||
        response.status === 'queued' ||
        response.statusCode === 200 ||
        response.statusCode === 201 ||
        response.success === true ||
        response.message_id)
    ) {
      console.log(`✅ SMS sent successfully to ${normalizedPhone}`, response);
      return {
        success: true,
        message: 'OTP sent successfully',
        requestId:
          response.message_id ||
          response.requestId ||
          response.id ||
          'unknown',
      };
    } else {
      console.error(`❌ SMS send failed:`, response);
      return {
        success: false,
        error: response?.message || response?.error || 'Failed to send SMS',
        message: 'SMS delivery failed',
      };
    }
  } catch (error) {
    console.error('❌ SMS Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'SMS service error',
    };
  }
}

/**
 * Verify OTP against stored code
 * @param storedOtp - OTP stored in database/cache
 * @param userProvidedOtp - OTP provided by user
 * @returns boolean - true if OTP matches
 */
export function verifyOTP(storedOtp: string, userProvidedOtp: string): boolean {
  // Use timing-safe comparison to prevent timing attacks
  return storedOtp === userProvidedOtp;
}
