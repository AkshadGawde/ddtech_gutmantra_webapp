'use strict';

import crypto from 'crypto';
import axios from 'axios';

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

function buildUserData(params: {
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
}): Record<string, any> {
  const ud: Record<string, any> = {};
  if (params.email) ud.em = [hash(params.email)];
  if (params.phone) ud.ph = [hash(normalizePhone(params.phone))];
  if (params.ip) ud.client_ip_address = params.ip;
  if (params.userAgent) ud.client_user_agent = params.userAgent;
  return ud;
}

async function sendCAPIEvent(
  eventName: string,
  eventId: string,
  userData: Record<string, any>,
  customData: Record<string, any>,
  sourceUrl: string,
): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('FB CAPI: missing PIXEL_ID or ACCESS_TOKEN — skipping');
    return;
  }

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: sourceUrl,
      event_id: eventId,
      user_data: userData,
      custom_data: customData,
    }],
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    console.log(`✅ FB CAPI: ${eventName} sent (eventId=${eventId})`, response.data);
  } catch (err: any) {
    console.warn(
      `⚠️ FB CAPI: ${eventName} failed (non-critical):`,
      err?.response?.data || err.message,
    );
  }
}

export interface PurchaseEventData {
  orderId: string;
  /** Deduplication ID — must match the pixel eventID. Falls back to orderId if omitted. */
  eventId?: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
}

export async function sendPurchaseEvent(data: PurchaseEventData): Promise<void> {
  const userData = buildUserData({
    email: data.email,
    phone: data.phone,
    ip: data.ip,
    userAgent: data.userAgent,
  });

  const customData = {
    currency: data.currency || 'INR',
    value: data.value.toFixed(2),
    order_id: data.orderId,
  };

  await sendCAPIEvent(
    'Purchase',
    data.eventId || data.orderId,
    userData,
    customData,
    data.sourceUrl || 'https://gutmantra.in/checkout',
  );
}

export interface AddToCartEventData {
  /** Deduplication ID — must match the pixel eventID sent from the frontend. */
  eventId?: string;
  contentIds: string[];
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
}

export async function sendAddToCartEvent(data: AddToCartEventData): Promise<void> {
  const userData = buildUserData({
    email: data.email,
    phone: data.phone,
    ip: data.ip,
    userAgent: data.userAgent,
  });

  const customData = {
    currency: data.currency || 'INR',
    value: data.value.toFixed(2),
    content_ids: data.contentIds,
    content_type: 'product',
  };

  await sendCAPIEvent(
    'AddToCart',
    data.eventId || `atc_${Date.now()}`,
    userData,
    customData,
    data.sourceUrl || 'https://gutmantra.in',
  );
}
