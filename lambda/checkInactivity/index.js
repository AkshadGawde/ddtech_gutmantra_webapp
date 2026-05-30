'use strict';

/**
 * checkInactivity Lambda
 *
 * Triggered by CloudWatch Events every 1 minute.
 * Checks Firestore /system/ec2_activity for the last global request timestamp.
 * If no authenticated request has been made in INACTIVITY_THRESHOLD_MINUTES,
 * stops the EC2 instance — saving $8.47/month by only running when users are active.
 *
 * Activity is recorded by the EC2 backend's activityTracker middleware on every
 * authenticated request.
 */

const admin = require('firebase-admin');
const { EC2Client, StopInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

const INACTIVITY_THRESHOLD_MS = (parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES) || 15) * 60 * 1000;

// ── AWS singleton ─────────────────────────────────────────────────────────────

// EC2_REGION = region where your EC2 instance lives (may differ from Lambda region)
const ec2 = new EC2Client({ region: process.env.EC2_REGION || process.env.AWS_REGION });

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
  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name || 'unknown';
}

async function stopEC2() {
  const cmd = new StopInstancesCommand({ InstanceIds: [process.env.EC2_INSTANCE_ID] });
  await ec2.send(cmd);
  console.log('EC2 stop command sent');
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async () => {
  try {
    // 1) Check if EC2 is already stopped — nothing to do
    const state = await getEC2State();
    console.log(`EC2 state: ${state}`);

    if (state === 'stopped' || state === 'stopping') {
      console.log('EC2 already stopped/stopping — no action needed');
      return { action: 'noop', reason: `ec2_${state}` };
    }

    if (state !== 'running') {
      console.log(`EC2 in state ${state} — skipping inactivity check`);
      return { action: 'noop', reason: `ec2_${state}` };
    }

    // 2) Read last global activity timestamp from Firestore
    const app = getFirebase();
    const db = admin.firestore(app);

    const activityDoc = await db.collection('system').doc('ec2_activity').get();

    if (!activityDoc.exists) {
      // No activity record at all — EC2 shouldn't be running, stop it
      console.warn('No activity document found — stopping idle EC2');
      await stopEC2();
      return { action: 'stopped', reason: 'no_activity_record' };
    }

    const data = activityDoc.data();
    const lastActivityAt = data?.lastActivityAt?.toDate?.();

    if (!lastActivityAt) {
      console.warn('lastActivityAt missing — stopping idle EC2');
      await stopEC2();
      return { action: 'stopped', reason: 'no_activity_timestamp' };
    }

    const idleMs = Date.now() - lastActivityAt.getTime();
    const idleMinutes = Math.floor(idleMs / 60000);

    console.log(`Last activity: ${lastActivityAt.toISOString()} — idle for ${idleMinutes} minutes`);

    // 3) Stop EC2 if idle for >= threshold
    if (idleMs >= INACTIVITY_THRESHOLD_MS) {
      console.log(`Idle for ${idleMinutes} min (threshold: ${INACTIVITY_THRESHOLD_MS / 60000} min) — stopping EC2`);
      await stopEC2();
      return { action: 'stopped', reason: 'inactivity', idleMinutes };
    }

    const minutesRemaining = Math.ceil((INACTIVITY_THRESHOLD_MS - idleMs) / 60000);
    console.log(`EC2 active — stopping in ${minutesRemaining} minutes if no new requests`);
    return { action: 'noop', reason: 'active', idleMinutes, minutesRemaining };

  } catch (error) {
    console.error('checkInactivity error:', error);
    // Don't throw — CloudWatch will mark this as a failure and retry
    return { action: 'error', error: error.message };
  }
};
