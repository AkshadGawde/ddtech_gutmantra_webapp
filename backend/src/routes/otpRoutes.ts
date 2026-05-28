import express, { Request, Response } from 'express';
import { generateSecureOTP, sendLoginSMS, normalizePhoneNumber } from '../services/smsService.js';
import { rateLimitSMS } from '../middleware/rateLimitSMS.js';
import { getFirestoreDb, getAuth } from '../services/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = express.Router();

// Email regex for validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/send-otp
 *
 * Sends a 6-digit OTP via SMS to the user's phone number
 *
 * Request body:
 * {
 *   "phone": "9601279172" or "+919601279172" or "09601279172"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "OTP sent successfully",
 *   "expiresIn": 300 (seconds)
 * }
 */
router.post('/send-otp', rateLimitSMS, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { phone } = req.body;

    console.log('📞 OTP request received for phone:', phone);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Validate phone number format
    // ═══════════════════════════════════════════════════════════════════════════

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required and must be a string',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Please enter a valid 10-digit mobile number.',
      });
    }

    console.log(`✅ Phone validated and normalized: ${phone} → ${normalizedPhone}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Generate secure 6-digit OTP
    // ═══════════════════════════════════════════════════════════════════════════

    const otpCode = generateSecureOTP();
    const expirationMinutes = 5;
    const expirationSeconds = expirationMinutes * 60;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    console.log(`🔐 Generated OTP: ${otpCode} (expires at ${expiresAt.toISOString()})`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Store OTP in Firestore with expiration timestamp
    // ═══════════════════════════════════════════════════════════════════════════

    const otpDocId = `otp_${normalizedPhone.replace(/\D/g, '')}`;
    const otpData = {
      phone: normalizedPhone,
      code: otpCode,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      verified: false,
      attempts: 0,
    };

    await db.collection('otp_requests').doc(otpDocId).set(otpData);
    console.log(`💾 OTP stored in Firestore with ID: ${otpDocId}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Send OTP via SMS using Zavu API
    // ═══════════════════════════════════════════════════════════════════════════

    const smsResult = await sendLoginSMS(normalizedPhone, otpCode);

    if (!smsResult.success) {
      console.error('❌ Failed to send SMS:', smsResult.error);

      // Delete OTP from Firestore if SMS failed
      await db.collection('otp_requests').doc(otpDocId).delete();

      return res.status(500).json({
        success: false,
        error: smsResult.error || 'Failed to send OTP via SMS',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Return success response
    // ═══════════════════════════════════════════════════════════════════════════

    console.log(`✅ OTP sent successfully to ${normalizedPhone}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully to your phone number',
      expiresIn: expirationSeconds,
      phone: normalizedPhone, // Return normalized phone for frontend reference
    });

  } catch (error) {
    console.error('❌ OTP Send Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while sending OTP',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the OTP provided by the user
 *
 * Request body:
 * {
 *   "phone": "+919601279172",
 *   "otp": "123456",
 *   "email": "user@example.com" (optional - for account creation)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "OTP verified successfully",
 *   "authToken": "..." (if user exists or account created)
 * }
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { phone, otp, email } = req.body;

    console.log('🔍 OTP verification request for phone:', phone);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Validate input
    // ═══════════════════════════════════════════════════════════════════════════

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Retrieve OTP from Firestore
    // ═══════════════════════════════════════════════════════════════════════════

    const otpDocId = `otp_${normalizedPhone.replace(/\D/g, '')}`;
    const otpDoc = await db.collection('otp_requests').doc(otpDocId).get();

    if (!otpDoc.exists) {
      console.warn(`⚠️ OTP not found for ${normalizedPhone}`);
      return res.status(404).json({
        success: false,
        error: 'No OTP found for this phone number. Please request a new OTP.',
      });
    }

    const otpData = otpDoc.data();

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Check expiration
    // ═══════════════════════════════════════════════════════════════════════════

    if (otpData?.expiresAt && otpData.expiresAt.toDate() < new Date()) {
      console.warn(`⏰ OTP expired for ${normalizedPhone}`);
      await db.collection('otp_requests').doc(otpDocId).delete();

      return res.status(410).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Verify OTP code
    // ═══════════════════════════════════════════════════════════════════════════

    if (String(otpData?.code) !== String(otp)) {
      console.warn(`❌ Invalid OTP attempt for ${normalizedPhone}`);

      // Increment attempt counter
      const attempts = (otpData?.attempts || 0) + 1;
      const maxAttempts = 3;

      if (attempts >= maxAttempts) {
        // Lock OTP after max attempts
        await db.collection('otp_requests').doc(otpDocId).delete();
        console.warn(`🔒 OTP locked after ${maxAttempts} failed attempts`);

        return res.status(429).json({
          success: false,
          error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        });
      }

      await db.collection('otp_requests').doc(otpDocId).update({
        attempts,
      });

      return res.status(401).json({
        success: false,
        error: `Invalid OTP. ${maxAttempts - attempts} attempts remaining.`,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: OTP verified successfully - Mark as verified
    // ═══════════════════════════════════════════════════════════════════════════

    console.log(`✅ OTP verified for ${normalizedPhone}`);

    await db.collection('otp_requests').doc(otpDocId).update({
      verified: true,
      verifiedAt: FieldValue.serverTimestamp(),
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: Find or create user in auth collection
    // ═══════════════════════════════════════════════════════════════════════════

    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('phone', '==', normalizedPhone).limit(1).get();

    let userId: string;
    let isNewUser = false;

    if (!userQuery.empty) {
      // User exists — update last login and mark phone verified
      userId = userQuery.docs[0].id;
      console.log(`👤 Existing user found: ${userId}`);
      await usersRef.doc(userId).update({
        lastLoginAt: FieldValue.serverTimestamp(),
        phoneVerified: true,
      });
    } else {
      // Create new user
      isNewUser = true;
      const newUserRef = usersRef.doc();
      userId = newUserRef.id;

      await newUserRef.set({
        phone: normalizedPhone,
        email: email && EMAIL_RE.test(email) ? email : null,
        name: '',
        profileImage: '',
        role: 'user',
        authMode: 'phone',
        phoneVerified: true,
        address: {
          firstName: '', lastName: '', streetAddress: '', apartment: '',
          city: '', state: '', pinCode: '', country: 'India', fullAddress: '',
        },
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
      console.log(`👤 New user created: ${userId}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: Generate Firebase Custom Token so client can signInWithCustomToken
    // ═══════════════════════════════════════════════════════════════════════════

    const customToken = await getAuth().createCustomToken(userId, { phone: normalizedPhone });
    console.log(`🔑 Custom token generated for ${userId}`);

    return res.json({
      success: true,
      message: isNewUser ? 'Account created and OTP verified' : 'OTP verified successfully',
      userId,
      isNewUser,
      phone: normalizedPhone,
      customToken,
    });

  } catch (error) {
    console.error('❌ OTP Verification Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during verification',
    });
  }
});

export default router;
