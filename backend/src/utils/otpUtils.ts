import crypto from 'crypto';

/**
 * Validates phone number format
 * Accepts: +91XXXXXXXXXX or 91XXXXXXXXXX
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;

  // Normalize phone number
  let normalizedPhone = phone.replace(/[^0-9+]/g, '');

  // Ensure it starts with +91
  if (normalizedPhone.startsWith('91')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (normalizedPhone.startsWith('+')) {
    // Already has +
  } else if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+91' + normalizedPhone.slice(1);
  } else {
    normalizedPhone = '+91' + normalizedPhone;
  }

  // Validate the normalized format
  return /^\+91[6-9]\d{9}$/.test(normalizedPhone);
};

/**
 * Normalizes phone number to +91XXXXXXXXXX format
 */
export const normalizePhoneNumber = (phone: string): string => {
  let normalized = phone.replace(/[^0-9+]/g, '');

  if (normalized.startsWith('91')) {
    return '+' + normalized;
  } else if (normalized.startsWith('+')) {
    return normalized;
  } else if (normalized.startsWith('0')) {
    return '+91' + normalized.slice(1);
  } else {
    return '+91' + normalized;
  }
};

/**
 * Generates a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hashes OTP for secure storage (if needed for enhanced security)
 * Currently returns plaintext but can be enhanced
 */
export const hashOTP = (otp: string): string => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
};

/**
 * Verifies hashed OTP (if implementing hash-based verification)
 */
export const verifyHashedOTP = (plainOTP: string, hashedOTP: string): boolean => {
  const hash = hashOTP(plainOTP);
  return hash === hashedOTP;
};

/**
 * Formats phone number for WhatsApp API (removes +)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  return phone.replace('+', '');
};

/**
 * Validates OTP format (6 digits)
 */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
