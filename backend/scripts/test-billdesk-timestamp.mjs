import crypto from 'crypto';
import axios from 'axios';

const MERCHANT_ID = 'KANAKV2';
const MERCHANT_KEY = 'to8pJnluXU43FPzhC2P2YLlbmylW4NEm';
const BASE_URL = 'https://uat1.billdesk.com/u2';

function generateSignature(payload) {
  return crypto.createHmac('sha256', MERCHANT_KEY).update(JSON.stringify(payload)).digest('hex');
}

// BillDesk requires YYYYMMDDHHmmss — ISO 8601 triggers error GNIDE0001
function nowTimestamp() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${ist.getUTCFullYear()}${pad(ist.getUTCMonth() + 1)}${pad(ist.getUTCDate())}${pad(ist.getUTCHours())}${pad(ist.getUTCMinutes())}${pad(ist.getUTCSeconds())}`;
}

async function probe(label, overrideHeaders = {}, overridePayload = {}) {
  const traceId = `${Date.now()}-TEST`;
  const timestamp = nowTimestamp();
  const orderid = `TEST-${Date.now()}`;

  const payload = {
    mercid: MERCHANT_ID,
    orderid,
    amount: '10.00',
    order_date: new Date().toISOString().split('T')[0],
    currency: '356',
    itemcode: 'DIRECT',
    ru: 'https://api.gutmantra.in/api/billdesk/callback',
    ...overridePayload,
  };

  const sig = generateSignature(payload);

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/jose',
    'BD-Traceid': traceId,
    'BD-Timestamp': timestamp,
    'BD-Signature': sig,
    ...overrideHeaders,
  };

  console.log(`\n--- [${label}] ---`);
  console.log('Timestamp:', timestamp);
  console.log('Headers sent:', JSON.stringify(headers, null, 2));

  try {
    const res = await axios.post(`${BASE_URL}/payments/ve1_2/orders/create`, payload, { headers, timeout: 10000 });
    console.log(`✅ HTTP ${res.status} — SUCCESS`);
    console.log('Response:', JSON.stringify(res.data).substring(0, 300));
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.log(`❌ HTTP ${status}`);
    console.log('Full error response:', JSON.stringify(data, null, 2));
    return null;
  }
}

async function main() {
  // Test 1: Baseline (IST timestamp, current impl)
  await probe('Baseline IST +05:30');

  // Test 2: Accept: application/json instead of jose
  await probe('Accept application/json', { Accept: 'application/json' });

  // Test 3: No BD-Signature at all
  await probe('No BD-Signature', { 'BD-Signature': undefined });

  // Test 4: Wrong merchant ID — if error changes, IP is fine, creds are wrong
  await probe('Wrong MerchantID', {}, { mercid: 'WRONGID' });

  // Test 5: Completely empty payload to see raw error
  const traceId2 = `${Date.now()}-TEST2`;
  const ts2 = nowTimestamp();
  try {
    console.log('\n--- [Empty payload] ---');
    const r = await axios.post(`${BASE_URL}/payments/ve1_2/orders/create`, {}, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/jose', 'BD-Traceid': traceId2, 'BD-Timestamp': ts2, 'BD-Signature': 'invalid' },
      timeout: 10000,
    });
    console.log('Response:', JSON.stringify(r.data).substring(0, 300));
  } catch (err) {
    console.log(`❌ HTTP ${err.response?.status} —`, JSON.stringify(err.response?.data, null, 2));
  }
}

main().catch(console.error);
