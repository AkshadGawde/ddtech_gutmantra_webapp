'use strict';

const admin = require('firebase-admin');

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

    const app = getFirebase();
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

    let authUid = null;
    try {
      const authUser = await auth.getUserByPhoneNumber(normalizedPhone);
      authUid = authUser.uid;
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    const [exactSnap, tenDigitSnap] = await Promise.all([
      usersRef.where('phone', '==', normalizedPhone).limit(1).get(),
      usersRef.where('phone', '==', tenDigit).limit(1).get(),
    ]);

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
      }),
    };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
