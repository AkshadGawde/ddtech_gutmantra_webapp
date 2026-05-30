'use strict';

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const { EC2Client, StartInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

// ── AWS singletons ────────────────────────────────────────────────────────────

const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const evBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

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

async function getEC2State() {
  const cmd = new DescribeInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] });
  const result = await ec2.send(cmd);
  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name || 'unknown';
}

async function startEC2() {
  const state = await getEC2State();
  console.log(`EC2 current state: ${state}`);

  if (state === 'running') {
    console.log('EC2 already running — skipping start');
    return false;
  }

  if (state === 'stopping') {
    await new Promise(r => setTimeout(r, 15000));
  }

  const cmd = new StartInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] });
  await ec2.send(cmd);
  console.log('EC2 start command sent');
  return true;
}

async function publishAuthEvent(detailType, phone) {
  try {
    await evBridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'lambda.auth',
        DetailType: detailType,
        Detail: JSON.stringify({ phone, timestamp: new Date().toISOString() }),
        EventBusName: 'default',
      }],
    }));
  } catch (err) {
    console.warn('EventBridge publish failed (non-critical):', err.message);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { phone, password } = body;

    if (!phone || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Phone and password are required' }) };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid phone number format' }) };
    }

    const app = getFirebase();
    const db = admin.firestore(app);
    const auth = admin.auth(app);

    // Lookup user — check both +91XXXXXXXXXX and 10-digit formats
    const rawDigits = normalizedPhone.replace(/\D/g, '');
    const tenDigit = rawDigits.length === 12 ? rawDigits.slice(2) : rawDigits;

    const [exactSnap, tenDigitSnap] = await Promise.all([
      db.collection('users').where('phone', '==', normalizedPhone).limit(1).get(),
      db.collection('users').where('phone', '==', tenDigit).limit(1).get(),
    ]);

    const userDoc = !exactSnap.empty ? exactSnap.docs[0] : !tenDigitSnap.empty ? tenDigitSnap.docs[0] : null;

    if (!userDoc) {
      // ❌ DO NOT wake EC2 — save cost
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Phone number not registered', code: 'PHONE_NOT_FOUND' }) };
    }

    const userData = userDoc.data();

    if (!userData.phoneVerified) {
      // ❌ DO NOT wake EC2
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Phone number not verified. Please verify via OTP first.', code: 'PHONE_NOT_VERIFIED' }) };
    }

    if (!userData.passwordHash) {
      // ❌ DO NOT wake EC2
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'No password set for this account. Please use Forgot Password.', code: 'NO_PASSWORD' }) };
    }

    // ── Password check ────────────────────────────────────────────────────────
    const isValid = await bcrypt.compare(password, userData.passwordHash);

    if (!isValid) {
      // ❌ WRONG PASSWORD — DO NOT wake EC2 (save cost!)
      console.log(`Wrong password for phone: ${normalizedPhone}`);
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Incorrect password', code: 'WRONG_PASSWORD' }) };
    }

    // ✅ PASSWORD CORRECT — update timestamps
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(userDoc.id).update({
      lastLoginAt: now,
      lastActivityAt: now,
    });

    // Generate Firebase custom token for client signInWithCustomToken
    const customToken = await auth.createCustomToken(userDoc.id, { phone: normalizedPhone });

    // ⚡️ CRITICAL: Start EC2 + publish to EventBridge (parallel for speed)
    const [ec2Started] = await Promise.all([
      startEC2(),
      publishAuthEvent('login-success', normalizedPhone),
    ]);

    const wait_seconds = ec2Started ? 30 : 0;

    console.log(`Login success for ${userDoc.id} | EC2 started: ${ec2Started} | wait: ${wait_seconds}s`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: ec2Started ? 'Welcome back! Starting server...' : 'Welcome back!',
        userId: userDoc.id,
        customToken,
        wait_seconds,
      }),
    };
  } catch (error) {
    console.error('phoneLogin error:', error);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
