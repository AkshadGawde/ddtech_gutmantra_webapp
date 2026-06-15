'use strict';

const admin = require('firebase-admin');
const { EC2Client, StartInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
const ec2 = new EC2Client({ region: process.env.EC2_REGION || process.env.AWS_REGION });

// ── Firebase singleton (credentials from Secrets Manager) ─────────────────────

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

// ── EC2 helpers ───────────────────────────────────────────────────────────────

async function startEC2IfStopped(db) {
  try {
    // Skip DescribeInstances — StartInstances is safe to call even if running
    const result = await ec2.send(new StartInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] }));
    const prevState = result.StartingInstances?.[0]?.PreviousState?.Name;
    const wasAlreadyRunning = prevState === 'running';
    console.log(`EC2 previous state at OTP verify: ${prevState}`);

    if (!wasAlreadyRunning) {
      db.collection('system').doc('ec2_activity').set(
        { lastActivityAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      ).catch(err => console.warn('Activity stamp failed:', err.message));
    }

    return !wasAlreadyRunning;
  } catch (err) {
    console.warn('EC2 start at OTP verify failed (non-critical):', err.message);
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

// Handles both REST API v1 and HTTP API v2 event formats
function parseEvent(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
  const body = typeof event.body === 'string'
    ? JSON.parse(event.body || '{}')
    : (event.body || {});
  const getHeader = (name) =>
    event.headers?.[name] || event.headers?.[name.toLowerCase()] || '';
  return { method, body, getHeader };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Warm-up ping — pre-initialize Firebase so real requests are instant
  if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
    await getFirebase().catch(() => {});
    return { statusCode: 200, body: 'warm' };
  }

  const headers = corsHeaders();
  const { method, body } = parseEvent(event);

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { phone, otp, email } = body;

    if (!phone || typeof phone !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Phone number is required' }) };
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid OTP format. Must be 6 digits.' }) };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid phone number format' }) };
    }

    const app = await getFirebase();
    const db = admin.firestore(app);
    const auth = admin.auth(app);

    const otpDocId = `otp_${normalizedPhone.replace(/\D/g, '')}`;
    const otpDoc = await db.collection('otp_requests').doc(otpDocId).get();

    if (!otpDoc.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'No OTP found for this phone number. Please request a new OTP.' }) };
    }

    const otpData = otpDoc.data();

    // Check expiration
    if (otpData?.expiresAt && otpData.expiresAt.toDate() < new Date()) {
      await db.collection('otp_requests').doc(otpDocId).delete();
      return { statusCode: 410, headers, body: JSON.stringify({ success: false, error: 'OTP has expired. Please request a new OTP.' }) };
    }

    // Verify OTP code
    if (String(otpData?.code) !== String(otp)) {
      const attempts = (otpData?.attempts || 0) + 1;
      const maxAttempts = 3;

      if (attempts >= maxAttempts) {
        await db.collection('otp_requests').doc(otpDocId).delete();
        return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: 'Maximum OTP attempts exceeded. Please request a new OTP.' }) };
      }

      await db.collection('otp_requests').doc(otpDocId).update({ attempts });
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: `Invalid OTP. ${maxAttempts - attempts} attempts remaining.` }) };
    }

    // OTP valid — mark verified
    await db.collection('otp_requests').doc(otpDocId).update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Find or create user
    const usersRef = db.collection('users');
    let userId;
    let isNewUser = false;

    const rawDigits = normalizedPhone.replace(/\D/g, '');
    const tenDigit = rawDigits.length === 12 ? rawDigits.slice(2) : rawDigits;

    // Run Firebase Auth lookup + both Firestore queries in parallel
    const [authResult, exactSnap, tenDigitSnap] = await Promise.all([
      auth.getUserByPhoneNumber(normalizedPhone).catch(e => {
        if (e.code === 'auth/user-not-found') return null;
        throw e;
      }),
      usersRef.where('phone', '==', normalizedPhone).limit(1).get(),
      usersRef.where('phone', '==', tenDigit).limit(1).get(),
    ]);

    const authUid = authResult?.uid ?? null;

    const firestoreDoc = !exactSnap.empty ? exactSnap.docs[0] : !tenDigitSnap.empty ? tenDigitSnap.docs[0] : null;

    if (authUid) {
      userId = authUid;
      const docSnap = await usersRef.doc(userId).get();
      if (docSnap.exists) {
        await usersRef.doc(userId).update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          phoneVerified: true,
          phone: normalizedPhone,
        });
      } else if (firestoreDoc) {
        userId = firestoreDoc.id;
        await usersRef.doc(userId).update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          phoneVerified: true,
          phone: normalizedPhone,
        });
      } else {
        await usersRef.doc(userId).set({
          phone: normalizedPhone,
          email: null,
          name: '',
          profileImage: '',
          role: 'user',
          authMode: 'phone',
          phoneVerified: true,
          address: { firstName: '', lastName: '', streetAddress: '', apartment: '', city: '', state: '', pinCode: '', country: 'India', fullAddress: '' },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (firestoreDoc) {
      userId = firestoreDoc.id;
      await usersRef.doc(userId).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        phoneVerified: true,
        phone: normalizedPhone,
      });
    } else {
      isNewUser = true;
      const newRef = usersRef.doc();
      userId = newRef.id;
      await newRef.set({
        phone: normalizedPhone,
        email: email && EMAIL_RE.test(email) ? email : null,
        name: '',
        profileImage: '',
        role: 'user',
        authMode: 'phone',
        phoneVerified: true,
        address: { firstName: '', lastName: '', streetAddress: '', apartment: '', city: '', state: '', pinCode: '', country: 'India', fullAddress: '' },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const customToken = await auth.createCustomToken(userId, { phone: normalizedPhone });

    // Start EC2 now — user is authenticated, they'll need the server for the next step
    const ec2Started = await startEC2IfStopped(db);
    const wait_seconds = ec2Started ? 30 : 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: isNewUser ? 'Account created and OTP verified' : 'OTP verified successfully',
        userId,
        isNewUser,
        phone: normalizedPhone,
        customToken,
        wait_seconds,
      }),
    };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
