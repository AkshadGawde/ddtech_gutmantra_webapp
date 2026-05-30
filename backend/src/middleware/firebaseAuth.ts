import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../services/firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    (req as AuthenticatedRequest).userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
