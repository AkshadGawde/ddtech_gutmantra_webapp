'use strict';

import crypto from 'crypto';
import https from 'https';

const PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const API_VERSION = 'v19.0';

function hash(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
}

interface PurchaseEventData {
  orderId: string;
  value: number;
  currency?: string;
  phone?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
}

export async function sendPurchaseEvent(data: PurchaseEventData): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('FB Conversions API: missing PIXEL_ID or ACCESS_TOKEN — skipping');
    return;
  }

  const user_data: Record<string, any> = {};
  if (data.email) user_data.em = [hash(data.email)];
  if (data.phone) user_data.ph = [hash(normalizePhone(data.phone))];
  if (data.ip) user_data.client_ip_address = data.ip;
  if (data.userAgent) user_data.client_user_agent = data.userAgent;

  const payload = JSON.stringify({
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.sourceUrl || 'https://gutmantra.in/checkout',
      event_id: data.orderId,
      user_data,
      custom_data: {
        currency: data.currency || 'INR',
        value: data.value.toFixed(2),
        order_id: data.orderId,
      },
    }],
  });

  const options = {
    hostname: 'graph.facebook.com',
    path: `/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ FB Conversions API: Purchase event sent for order', data.orderId);
        } else {
          console.warn('⚠️ FB Conversions API error:', body);
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      console.warn('⚠️ FB Conversions API request failed (non-critical):', err.message);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}
