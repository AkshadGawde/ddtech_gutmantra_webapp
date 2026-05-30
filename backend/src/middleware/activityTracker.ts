import { Request, Response, NextFunction } from 'express';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

// Debounce: only write to Firestore at most once per 30 seconds to avoid hammering
let lastWriteAt = 0;
const WRITE_DEBOUNCE_MS = 30_000;

/**
 * Middleware that updates /system/ec2_activity on every request.
 * The checkInactivity Lambda reads this document every minute to decide
 * whether to stop the EC2 instance.
 *
 * Uses a 30-second debounce so frequent requests don't flood Firestore writes.
 */
export function trackActivity(req: Request, _res: Response, next: NextFunction): void {
  const now = Date.now();
  if (now - lastWriteAt >= WRITE_DEBOUNCE_MS) {
    lastWriteAt = now;
    const db = getFirestoreDb();
    db.collection('system').doc('ec2_activity').set(
      { lastActivityAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    ).catch((err) => {
      console.warn('activityTracker write failed (non-critical):', err.message);
    });
  }
  next();
}
