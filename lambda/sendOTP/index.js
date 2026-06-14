'use strict';

const admin = require('firebase-admin');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

// ── Firebase singleton ────────────────────────────────────────────────────────

let cachedSecret = null;
async function getFirebaseCredentials() {
  if (cachedSecret) return cachedSecret;
  const result = await secretsClient.send(new GetSecretValueCommand({
    SecretId: process.env.FIREBASE_SECRET_NAME || 'firebase-credentials',
  }));
  let parsed = JSON.parse(result.SecretString);
  if (typeof parsed === 'string') parsed = JSON.parse(parsed);
  if (!parsed.project_id  && parsed.projectId)   parsed.project_id  = parsed.projectId;
  if (!parsed.private_key && parsed.privateKey)   parsed.private_key = parsed.privateKey;
  if (!parsed.client_email && parsed.clientEmail) parsed.client_email = parsed.clientEmail;
  cachedSecret = parsed;
  return cachedSecret;
}

let firebaseApp;
async function getFirebase() {
  if (!firebaseApp) {
    const creds = await getFirebaseCredentials();
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
  return firebaseApp;
}

// ── Zavu SMS singleton ────────────────────────────────────────────────────────
// @zavudev/sdk is ESM-only — use dynamic import() instead of require()

let smsClient;
async function getSmsClient() {
  if (!smsClient) {
    const zavuModule = await import('@zavudev/sdk');
    const Zavudev = zavuModule.default;
    smsClient = new Zavudev({ apiKey: process.env.ZAVUDEV_API_KEY });
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function parseEvent(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
  const body = typeof event.body === 'string'
    ? JSON.parse(event.body || '{}')
    : (event.body || {});
  return { method, body };
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = corsHeaders();
  const { method, body } = parseEvent(event);

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Phone number is required' }) };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid phone number. Enter a valid 10-digit Indian mobile number.' }) };
    }

    const app = await getFirebase();
    const db = admin.firestore(app);

    // Block signup OTP if phone is already verified with a password
    const rawDigits = normalizedPhone.replace(/\D/g, '');
    const tenDigit = rawDigits.length === 12 ? rawDigits.slice(2) : rawDigits;
    const [exactSnap, tenSnap] = await Promise.all([
      db.collection('users').where('phone', '==', normalizedPhone).limit(1).get(),
      db.collection('users').where('phone', '==', tenDigit).limit(1).get(),
    ]);
    const userDoc = !exactSnap.empty ? exactSnap.docs[0] : !tenSnap.empty ? tenSnap.docs[0] : null;
    if (userDoc) {
      const u = userDoc.data();
      if (u.phoneVerified && u.passwordHash) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'This number is already registered. Please login instead.',
            code: 'ALREADY_REGISTERED',
          }),
        };
      }
    }

    // Rate limit: max 1 OTP per 30 seconds per phone
    const otpDocId = `otp_${normalizedPhone.replace(/\D/g, '')}`;
    const existing = await db.collection('otp_requests').doc(otpDocId).get();
    if (existing.exists) {
      const data = existing.data();
      const createdAt = data?.createdAt?.toDate?.() || new Date(0);
      const secondsAgo = (Date.now() - createdAt.getTime()) / 1000;
      if (secondsAgo < 30) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ success: false, error: 'Please wait before requesting another OTP.', retryAfter: Math.ceil(30 - secondsAgo) }),
        };
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
    const text = `Your GutMantra verification code is ${otpCode}. Valid for 5 minutes.`;

    console.log(`📱 Sending OTP to ${normalizedPhone.slice(0, 6)}****`);
    const response = await client.messages.send({
      to: normalizedPhone,
      channel: 'sms_oneway',
      text,
    });

    // Unwrap response — Zavu wraps it as { message: {...} }
    const resData = response?.message ?? response?.data ?? response;
    console.log('Zavu response status:', resData?.status, '| id:', resData?.id);

    const isSuccess = resData && (resData.id || resData.status === 'sent' || resData.status === 'queued' || resData.status === 'pending');

    if (!isSuccess) {
      // Clean up OTP doc so user can retry
      await db.collection('otp_requests').doc(otpDocId).delete().catch(() => {});
      console.error('Zavu SMS failed:', resData);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Failed to send OTP via SMS' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300,
        phone: normalizedPhone,
      }),
    };
  } catch (error) {
    console.error('sendOTP error:', error);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
