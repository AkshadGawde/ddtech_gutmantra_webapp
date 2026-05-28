import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { validatePhoneNumber, generateOTP, hashOTP } from '../utils/otpUtils.js';


const router = express.Router();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'gutmantra_otp';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface for OTP request
interface OTPRequest {
  phone: string;
}

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

interface OTPData {
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  hashedOTP?: string;
}

/**
 * POST /api/whatsapp/send-otp
 * Generates OTP and sends it via WhatsApp template message
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as OTPRequest;

    // Validate phone number format
    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Use format: +91XXXXXXXXXX',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const now = Date.now();
    const expiryTime = 10 * 60 * 1000; // 10 minutes

    // Prepare OTP data for Firestore
    const otpData: OTPData = {
      otp,
      createdAt: now,
      expiresAt: now + expiryTime,
      attempts: 0,
      verified: false,
      hashedOTP: hashOTP(otp),
    };

    // Store OTP in Firestore under 'otpVerifications' collection
    const otpDocRef = getFirestoreDb().collection('otpVerifications').doc(phone);
    await otpDocRef.set(otpData, { merge: true });

    // Send OTP via WhatsApp Business API
    try {
      const messagePayload = {
        messaging_product: 'whatsapp',
        to: phone.replace('+', ''), // Remove + prefix for API
        type: 'template',
        template: {
          name: WHATSAPP_TEMPLATE_NAME,
          language: {
            code: 'en_US',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
              ],
            },
          ],
        },
      };

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp OTP sent successfully:', response.data);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your WhatsApp',
        messageId: response.data.messages[0].id,
      });
    } catch (whatsappError: any) {
      console.error('WhatsApp API Error:', whatsappError.response?.data || whatsappError.message);

      // Log error but don't expose sensitive details
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via WhatsApp. Please try again.',
        error: process.env.NODE_ENV === 'development'
          ? whatsappError.response?.data?.error?.message
          : undefined,
      });
    }
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/whatsapp/verify-otp
 * Verifies the OTP and logs user in (creates JWT token)
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body as VerifyOTPRequest;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits',
      });
    }

    // Retrieve OTP data from Firestore
    const otpDocRef = getFirestoreDb().collection('otpVerifications').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this phone number. Please request a new one.',
      });
    }

    const otpData = otpDoc.data() as OTPData;

    // Check if OTP is already verified
    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP already used. Please request a new one.',
      });
    }

    // Check OTP expiry
    if (Date.now() > otpData.expiresAt) {
      // Clean up expired OTP
      await otpDocRef.delete();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    // Check attempt limit (max 5 attempts)
    if (otpData.attempts >= 5) {
      await otpDocRef.delete();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // Verify OTP (compare plaintext - in production, use hashing)
    if (otpData.otp !== otp) {
      // Increment attempt counter
      await otpDocRef.update({
        attempts: otpData.attempts + 1,
      });

      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please try again.',
        attemptsRemaining: 5 - (otpData.attempts + 1),
      });
    }

    // OTP is valid - mark as verified and proceed with login
    await otpDocRef.update({
      verified: true,
      verifiedAt: Date.now(),
    });

    // Check if user exists in Firestore 'users' collection
    const userRef = getFirestoreDb().collection('users');
    const userSnapshot = await userRef.where('phone', '==', phone).get();

    let userId: string;
    let isNewUser = false;

    if (userSnapshot.empty) {
      // New user - create account
      isNewUser = true;
      const newUserRef = userRef.doc();
      userId = newUserRef.id;

      const newUser = {
        id: userId,
        phone,
        email: null,
        firstName: null,
        lastName: null,
        address: {},
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        migrationStatus: 'new_whatsapp_signup',
        wordpressUserId: null,
      };

      await newUserRef.set(newUser);
    } else {
      // Existing user — mark phone as verified
      userId = userSnapshot.docs[0].id;
      await getFirestoreDb().collection('users').doc(userId).update({
        verified: true,
        updatedAt: new Date(),
      });
    }

    // Generate JWT token
    const token = (jwt as any).sign(
      {
        userId,
        phone,
        iat: Date.now(),
      },
      JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || '7d',
      }
    );

    // Get user data to return
    const userDoc = await getFirestoreDb().collection('users').doc(userId).get();
    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      isNewUser,
      token,
      user: {
        id: userId,
        phone,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        email: userData?.email,
        verified: true,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/whatsapp/resend-otp
 * Resends OTP if the user didn't receive it
 */
router.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as OTPRequest;

    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
      });
    }

    // Check if there's a recent OTP (to prevent abuse)
    const otpDocRef = getFirestoreDb().collection('otpVerifications').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (otpDoc.exists) {
      const otpData = otpDoc.data() as OTPData;
      const timeSinceCreation = Date.now() - otpData.createdAt;

      // Only allow resend after 30 seconds
      if (timeSinceCreation < 30 * 1000) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting another OTP',
          retryAfter: Math.ceil((30 * 1000 - timeSinceCreation) / 1000),
        });
      }
    }

    // Delete old OTP and generate new one
    await otpDocRef.delete();

    // Call send-otp logic
    const newOtp = generateOTP();
    const now = Date.now();
    const expiryTime = 10 * 60 * 1000;

    const otpData: OTPData = {
      otp: newOtp,
      createdAt: now,
      expiresAt: now + expiryTime,
      attempts: 0,
      verified: false,
      hashedOTP: hashOTP(newOtp),
    };

    await otpDocRef.set(otpData);

    // Send via WhatsApp
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: WHATSAPP_TEMPLATE_NAME,
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: newOtp,
              },
            ],
          },
        ],
      },
    };

    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'New OTP sent to your WhatsApp',
    });
  } catch (error: any) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
