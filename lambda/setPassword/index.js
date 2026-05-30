'use strict';

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const { EC2Client, StartInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

// ── AWS singletons ────────────────────────────────────────────────────────────

// EC2_REGION = region where your EC2 instance lives (may differ from Lambda region)
const ec2 = new EC2Client({ region: process.env.EC2_REGION || process.env.AWS_REGION });
const evBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

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

// ── EC2 helpers ───────────────────────────────────────────────────────────────

async function getEC2State() {
  const cmd = new DescribeInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] });
  const result = await ec2.send(cmd);
  const state = result.Reservations?.[0]?.Instances?.[0]?.State?.Name;
  return state || 'unknown';
}

async function startEC2(db) {
  const state = await getEC2State();
  console.log(`EC2 current state: ${state}`);

  if (state === 'running') {
    console.log('EC2 already running — skipping start');
    return false;
  }

  if (state === 'stopping') {
    console.log('EC2 is stopping — will start after it fully stops');
    await new Promise(r => setTimeout(r, 15000));
  }

  if (state !== 'stopped' && state !== 'stopping') {
    console.log(`EC2 in unexpected state: ${state} — attempting start anyway`);
  }

  const cmd = new StartInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] });
  await ec2.send(cmd);
  console.log('EC2 start command sent');

  // Stamp activity NOW so checkInactivity doesn't see a stale timestamp
  // and stop EC2 the moment it finishes booting
  await db.collection('system').doc('ec2_activity').set(
    { lastActivityAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  ).catch(err => console.warn('Activity stamp failed (non-critical):', err.message));

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

// ── Password validation ───────────────────────────────────────────────────────

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

// Handles both REST API v1 and HTTP API v2 event formats
// v2 lowercases all headers, so we check both cases
function parseEvent(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
  const body = typeof event.body === 'string'
    ? JSON.parse(event.body || '{}')
    : (event.body || {});
  const getHeader = (name) =>
    event.headers?.[name] || event.headers?.[name.toLowerCase()] || '';
  return { method, body, getHeader };
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = corsHeaders();
  const { method, body, getHeader } = parseEvent(event);

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Extract Firebase ID token — getHeader handles both 'Authorization' (v1) and 'authorization' (v2)
    const authHeader = getHeader('Authorization');
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!idToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Authentication required' }) };
    }

    const app = getFirebase();
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // Verify Firebase ID token
    let userId;
    let userPhone;
    try {
      const decoded = await auth.verifyIdToken(idToken);
      userId = decoded.uid;
      const userDoc = await db.collection('users').doc(userId).get();
      userPhone = userDoc.exists ? userDoc.data()?.phone : null;
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid or expired token' }) };
    }

    const { password, confirmPassword, name } = body;

    if (!password || typeof password !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Password is required' }) };
    }

    if (password !== confirmPassword) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Passwords do not match' }) };
    }

    if (!PASSWORD_RE.test(password)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        }),
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const updateData = {
      passwordHash,
      passwordSetAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    await db.collection('users').doc(userId).update(updateData);

    // ⚡️ CRITICAL: Start EC2 and publish to EventBridge
    const [ec2Started] = await Promise.all([
      startEC2(db),
      publishAuthEvent('signup-success', userPhone),
    ]);

    const wait_seconds = ec2Started ? 30 : 0;

    console.log(`Signup complete for ${userId} | EC2 started: ${ec2Started} | wait: ${wait_seconds}s`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: ec2Started ? 'Account created! Starting server...' : 'Account created!',
        wait_seconds,
      }),
    };
  } catch (error) {
    console.error('setPassword error:', error);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) };
  }
};
