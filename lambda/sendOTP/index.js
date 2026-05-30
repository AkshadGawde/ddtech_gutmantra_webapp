'use strict';

const admin = require('firebase-admin');
const { SdkManager } = require('@zavudev/sdk');

// ── Firebase singleton ────────────────────────────────────────────────────────

let firebaseApp;
function getFirebase() {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  return firebaseApp;
}

// ── Zavu SMS singleton ────────────────────────────────────────────────────────

let smsClient;
async function getSmsClient() {
  if (!smsClient) {
    const manager = new SdkManager({ apiKey: process.env.ZAVUDEV_API_KEY });
    smsClient = await manager.initialize();
  }
  return smsClient;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cors(res) {
  res.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const res = { statusCode: 200 };
  cors(res);

  if (event.httpMethod === 'OPTIONS') {
    return { ...res, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return { ...res, statusCode: 400, body: JSON.stringify({ success: false, error: 'Phone number is required' }) };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { ...res, statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid phone number. Enter a valid 10-digit Indian mobile number.' }) };
    }

    const app = getFirebase();
    const db = admin.firestore(app);

    // Check rate limit: max 5 OTPs per phone per hour
    const otpDocId = `otp_${normalizedPhone.replace(/\D/g, '')}`;
    const existing = await db.collection('otp_requests').doc(otpDocId).get();
    if (existing.exists) {
      const data = existing.data();
      const createdAt = data?.createdAt?.toDate?.() || new Date(0);
      const secondsAgo = (Date.now() - createdAt.getTime()) / 1000;
      if (secondsAgo < 30) {
        return { ...res, statusCode: 429, body: JSON.stringify({ success: false, error: 'Please wait before requesting another OTP.', retryAfter: Math.ceil(30 - secondsAgo) }) };
      }
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.collection('otp_requests').doc(otpDocId).set({
      phone: normalizedPhone,
      code: otpCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      verified: false,
      attempts: 0,
    });

    // Send SMS via Zavu
    const client = await getSmsClient();
    const message = `Your GutMantra verification code is: ${otpCode}. Valid for 5 minutes. Do not share with anyone.`;
    const smsResult = await client.sms.send({ to: normalizedPhone, message });

    if (!smsResult?.success) {
      await db.collection('otp_requests').doc(otpDocId).delete();
      return { ...res, statusCode: 500, body: JSON.stringify({ success: false, error: 'Failed to send OTP via SMS' }) };
    }

    return {
      ...res,
      body: JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300,
        phone: normalizedPhone,
      }),
    };
  } catch (error) {
    console.error('sendOTP error:', error);
    return { ...res, statusCode: 500, body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
