import { Request, Response, NextFunction } from 'express';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

// Debounce: only write to Firestore at most once per 60 seconds
let lastWriteAt = 0;
const WRITE_DEBOUNCE_MS = 60_000;

// These must NOT count as user activity — health checks and preflight keep the
// server alive forever if they reset the inactivity timer.
const IGNORED_PATHS = ['/api/health', '/health', '/favicon.ico'];
const IGNORED_METHODS = ['OPTIONS', 'HEAD'];

export function trackActivity(req: Request, _res: Response, next: NextFunction): void {
  const isIgnored =
    IGNORED_METHODS.includes(req.method) ||
    IGNORED_PATHS.some((p) => req.path === p || req.path.startsWith(p));

  if (!isIgnored) {
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
  }

  next();
}
