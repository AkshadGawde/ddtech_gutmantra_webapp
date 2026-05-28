import { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiting store for SMS OTP requests
 * Key: phone number or IP address
 * Value: { lastRequestTime, count }
 */
const rateLimitStore = new Map<string, { lastRequestTime: number; count: number }>();

/**
 * Cleanup old entries every 5 minutes to prevent memory leak
 */
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.lastRequestTime < fiveMinutesAgo) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for SMS OTP requests
 * Allows maximum 1 request per 60 seconds per phone number or IP
 */
export function rateLimitSMS(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = req.body?.phone || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Use phone number as primary rate limit key, fallback to IP
    const rateLimitKey = phone || ip;

    if (!rateLimitKey) {
      return res.status(400).json({
        success: false,
        error: 'Unable to identify request source for rate limiting',
      });
    }

    const now = Date.now();
    const rateLimitRecord = rateLimitStore.get(rateLimitKey);

    // Check if request is within 60-second window
    if (rateLimitRecord) {
      const timeSinceLastRequest = now - rateLimitRecord.lastRequestTime;
      const sixtySeconds = 60 * 1000;

      if (timeSinceLastRequest < sixtySeconds) {
        const remainingSeconds = Math.ceil((sixtySeconds - timeSinceLastRequest) / 1000);
        console.warn(`⏱️ Rate limit exceeded for ${rateLimitKey}. Retry after ${remainingSeconds}s`);

        return res.status(429).json({
          success: false,
          error: `Too many requests. Please wait ${remainingSeconds} seconds before trying again.`,
          retryAfter: remainingSeconds,
        });
      }
    }

    // Update rate limit record
    rateLimitStore.set(rateLimitKey, {
      lastRequestTime: now,
      count: (rateLimitRecord?.count || 0) + 1,
    });

    console.log(`✅ Rate limit check passed for ${rateLimitKey}`);
    next();
  } catch (error) {
    console.error('❌ Rate limiting error:', error);
    // Don't block request on rate limit error, but log it
    next();
  }
}
