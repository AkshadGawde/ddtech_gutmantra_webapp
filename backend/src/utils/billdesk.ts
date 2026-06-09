import crypto from 'crypto';
import axios from 'axios';
import { CompactEncrypt, CompactSign, compactDecrypt, compactVerify } from 'jose';

// ─── Config (lazy — read at call time, not at module load) ───────────────────
//
// dotenvx injects process.env AFTER ES modules are imported.
// Module-level constants would capture empty strings.
// Using functions ensures we read the actual values at request time.

const cfg = () => ({
  MERCHANT_ID : process.env.BILLDESK_MERCHANT_ID       || '',
  CLIENT_ID   : process.env.BILLDESK_CLIENT_ID         || '',
  ENC_KEY     : process.env.BILLDESK_ENCRYPTION_KEY    || '',
  ENC_KEY_ID  : process.env.BILLDESK_ENCRYPTION_KEY_ID || '',
  SIGN_KEY    : process.env.BILLDESK_SIGNING_KEY       || '',
  SIGN_KEY_ID : process.env.BILLDESK_SIGNING_KEY_ID    || '',
  BASE_URL    : process.env.BILLDESK_BASE_URL          || 'https://uat1.billdesk.com/u2',
});

// ─── Keys (raw UTF-8 bytes — mirrors Java's String.getBytes()) ────────────────

// jose accepts Uint8Array directly for symmetric algorithms (dir, HS256)
const encryptionKey = (): Uint8Array => new TextEncoder().encode(cfg().ENC_KEY);
const signingKey    = (): Uint8Array => new TextEncoder().encode(cfg().SIGN_KEY);

// ─── Utilities ────────────────────────────────────────────────────────────────

export function generateTraceId(): string {
  // Alphanumeric only, max 35 chars — BillDesk rejects same traceid within 24h
  const ts   = Date.now().toString();                          // 13 digits
  const rand = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
  return `${ts}${rand}`.slice(0, 35);
}

export function getFormattedTimestamp(): string {
  // BD-Timestamp: YYYYMMDDHHmmss in IST
  // Docs example: "20210113180403" = Jan 13 2021 18:04:03 IST
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const Y = ist.getUTCFullYear();
  const M = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const D = String(ist.getUTCDate()).padStart(2, '0');
  const h = String(ist.getUTCHours()).padStart(2, '0');
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  const s = String(ist.getUTCSeconds()).padStart(2, '0');
  return `${Y}${M}${D}${h}${m}${s}`;
}

function getISTOrderDate(): string {
  // order_date field: YYYY-MM-DDThh:mm:ss+05:30 (TZD format per API docs)
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().replace(/\.\d{3}Z$/, '+05:30');
}

// ─── JOSE: Encrypt → Sign ─────────────────────────────────────────────────────

async function encryptPayload(jsonPayload: Record<string, unknown>): Promise<string> {
  const { ENC_KEY_ID, CLIENT_ID } = cfg();
  const plaintext = new TextEncoder().encode(JSON.stringify(jsonPayload));

  console.log('\n🔐 [STEP 2] Encrypt  alg=dir  enc=A256GCM');
  console.log('   kid:', ENC_KEY_ID, '  clientid:', CLIENT_ID);
  console.log('   plaintext:', plaintext.length, 'bytes');

  const jwe = await new CompactEncrypt(plaintext)
    .setProtectedHeader({
      alg:      'dir',
      enc:      'A256GCM',
      kid:      ENC_KEY_ID,
      clientid: CLIENT_ID,
    } as any)
    .encrypt(encryptionKey());

  console.log('   ✅ JWE:', jwe.length, 'chars |', jwe.slice(0, 50) + '…');
  return jwe;
}

async function signPayload(jweToken: string): Promise<string> {
  const { SIGN_KEY_ID, CLIENT_ID } = cfg();
  const bytes = new TextEncoder().encode(jweToken);

  console.log('\n✍️  [STEP 3] Sign  alg=HS256');
  console.log('   kid:', SIGN_KEY_ID, '  clientid:', CLIENT_ID);
  console.log('   payload:', bytes.length, 'bytes');

  const jws = await new CompactSign(bytes)
    .setProtectedHeader({
      alg:      'HS256',
      kid:      SIGN_KEY_ID,
      clientid: CLIENT_ID,
    } as any)
    .sign(signingKey());

  console.log('   ✅ JWS:', jws.length, 'chars |', jws.slice(0, 50) + '…');
  return jws;
}

// ─── JOSE: Verify → Decrypt ───────────────────────────────────────────────────

async function decryptResponse(responseToken: string): Promise<Record<string, unknown>> {
  console.log('\n🔓 Decrypting BillDesk response…');

  const { payload: jweBytes } = await compactVerify(responseToken, signingKey());
  console.log('   ✅ JWS verified');

  const { plaintext } = await compactDecrypt(jweBytes, encryptionKey());
  const json = JSON.parse(new TextDecoder().decode(plaintext));
  console.log('   ✅ JWE decrypted  objectid:', json.objectid ?? '—');

  return json;
}

// ─── Core: Build → Encrypt → Sign → POST → Decrypt ───────────────────────────

async function josePost(
  path: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const traceId   = generateTraceId();
  const timestamp = getFormattedTimestamp();
  const url       = `${cfg().BASE_URL}${path}`;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  POST ${url}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('  BD-Traceid:', traceId);
  console.log('  BD-Timestamp:', timestamp);

  // Step 1 — JSON
  console.log('\n📋 [STEP 1] JSON payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Step 2 — Encrypt
  const jwe = await encryptPayload(payload);

  // Step 3 — Sign
  const jws = await signPayload(jwe);

  // Step 4 — Send
  console.log('\n📤 [STEP 4] Sending');
  console.log('  Content-Type: application/jose');
  console.log('  Body preview:', jws.slice(0, 80) + '…');

  const response = await axios.post(url, jws, {
    headers: {
      'Content-Type': 'application/jose',
      'Accept':       'application/jose',
      'BD-Traceid':   traceId,
      'BD-Timestamp': timestamp,
    },
  });

  console.log('\n📥 HTTP', response.status, '— decrypting…');

  const data: Record<string, unknown> =
    typeof response.data === 'string'
      ? await decryptResponse(response.data)
      : response.data;

  console.log('  Decrypted:', JSON.stringify(data, null, 2));
  return { ...data, _traceId: traceId, _timestamp: timestamp };
}

// ─── Public API 1: Create Order ───────────────────────────────────────────────

export interface CreateOrderInput {
  orderId:          string;
  amount:           string;  // two-decimal string e.g. "299.28"
  redirectUrl:      string;
  buyerEmail?:      string;
  buyerPhone?:      string;
  currency?:        string;  // default "356" (INR)
  itemCode?:        string;  // default "DIRECT"
  deviceIp?:        string;
  deviceUserAgent?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const payload: Record<string, unknown> = {
    mercid:     cfg().MERCHANT_ID,
    orderid:    input.orderId,
    amount:     input.amount,
    order_date: getISTOrderDate(),
    currency:   input.currency  || '356',
    ru:         input.redirectUrl,
    itemcode:   input.itemCode  || 'DIRECT',
    additional_info: {
      additional_info1: input.buyerEmail || 'NA',
      additional_info2: input.buyerPhone || 'NA',
    },
    device: {
      init_channel:  'internet',
      ip:            input.deviceIp        || '0.0.0.0',
      user_agent:    input.deviceUserAgent || 'Mozilla/5.0',
      accept_header: 'text/html',
    },
  };

  try {
    const data = await josePost('/payments/ve1_2/orders/create', payload);

    const links        = (data.links ?? []) as any[];
    const redirectLink = links.find((l: any) => l.rel === 'redirect');

    return {
      success:      true,
      bdorderid:    data.bdorderid    as string,
      orderid:      data.orderid      as string,
      rdata:        redirectLink?.parameters?.rdata  as string | undefined,
      payment_link: redirectLink?.href               as string | undefined,
      mercid:       data.mercid       as string,
      next_step:    data.next_step    as string,
      trace_id:     data._traceId    as string,
      timestamp:    data._timestamp  as string,
    };
  } catch (error: any) {
    const status = error.response?.status;
    const body   = error.response?.data;
    console.error('\n❌ createOrder failed  HTTP', status);
    console.error('   Response:', JSON.stringify(body, null, 2));
    throw { success: false, error: body?.error ?? error.message, status };
  }
}

// ─── Public API 2: Retrieve Transaction ──────────────────────────────────────

export interface RetrieveTransactionInput {
  orderid?:        string;
  transactionid?:  string;
  refund_details?: boolean;
}

export async function retrieveTransaction(input: RetrieveTransactionInput) {
  if (!input.orderid && !input.transactionid) {
    throw { success: false, error: 'orderid or transactionid is required' };
  }

  const payload: Record<string, unknown> = {
    mercid: cfg().MERCHANT_ID,
    ...(input.orderid       && { orderid:       input.orderid }),
    ...(input.transactionid && { transactionid: input.transactionid }),
    ...(input.refund_details && { refund_details: input.refund_details }),
  };

  try {
    const data = await josePost('/payments/ve1_2/transactions/get', payload);

    return {
      success:           true,
      orderid:           data.orderid           as string,
      transactionid:     data.transactionid     as string,
      auth_status:       data.auth_status        as string,
      transaction_date:  data.transaction_date   as string,
      amount:            data.amount             as string,
      currency:          data.currency           as string,
      payment_method:    data.payment_method_type as string,
      transaction_error: data.transaction_error_desc as string,
      bank_ref_no:       data.bank_ref_no        as string,
      authcode:          data.authcode           as string,
      mercid:            data.mercid             as string,
      trace_id:          data._traceId           as string,
      timestamp:         data._timestamp         as string,
    };
  } catch (error: any) {
    const status = error.response?.status;
    const body   = error.response?.data;
    console.error('\n❌ retrieveTransaction failed  HTTP', status);
    console.error('   Response:', JSON.stringify(body, null, 2));
    throw { success: false, error: body?.error ?? error.message, status };
  }
}

// ─── Public API 3: Create Refund ─────────────────────────────────────────────
// POST /payments/ve1_2/refunds/create
//
// Required fields per docs:
//   transactionid, orderid, mercid, transaction_date, txn_amount,
//   refund_amount, currency, merc_refund_ref_no
//
// refund_status in response:
//   "0799" — refund (original txn already settled)
//   "0699" — cancellation (original txn not yet settled)

export interface CreateRefundInput {
  transactionid:      string; // BillDesk transaction ID
  orderid:            string; // original merchant order ID
  transaction_date:   string; // original txn date — YYYY-MM-DDThh:mm:ss+05:30
  txn_amount:         string; // original transaction amount e.g. "299.00"
  refund_amount:      string; // amount to refund e.g. "100.00"
  merc_refund_ref_no: string; // unique per refund: alphanumeric + _ : - max 100 chars
  currency?:          string; // default "356"
}

export async function createRefund(input: CreateRefundInput) {
  const payload: Record<string, unknown> = {
    mercid:             cfg().MERCHANT_ID,
    transactionid:      input.transactionid,
    orderid:            input.orderid,
    transaction_date:   input.transaction_date,
    txn_amount:         input.txn_amount,
    refund_amount:      input.refund_amount,
    currency:           input.currency ?? '356',
    merc_refund_ref_no: input.merc_refund_ref_no,
  };

  try {
    const data = await josePost('/payments/ve1_2/refunds/create', payload);

    return {
      success:            true,
      refundid:           data.refundid           as string,
      transactionid:      data.transactionid      as string,
      orderid:            data.orderid            as string,
      mercid:             data.mercid             as string,
      txn_amount:         data.txn_amount         as string,
      refund_amount:      data.refund_amount      as string,
      currency:           data.currency           as string,
      refund_date:        data.refund_date        as string,
      transaction_date:   data.transaction_date   as string,
      merc_refund_ref_no: data.merc_refund_ref_no as string,
      refund_status:      data.refund_status      as '0799' | '0699',
      trace_id:           data._traceId           as string,
      timestamp:          data._timestamp         as string,
    };
  } catch (error: any) {
    const status = error.response?.status;
    const body   = error.response?.data;
    console.error('\n❌ createRefund failed  HTTP', status);
    console.error('   Response:', JSON.stringify(body, null, 2));
    throw { success: false, error: body?.error ?? error.message, status };
  }
}

// ─── Public API 4: Retrieve Refund ───────────────────────────────────────────
// POST /payments/ve1_2/refunds/get
//
// mercid is always sent; provide ONE of: refundid or merc_refund_ref_no

export interface RetrieveRefundInput {
  refundid?:           string; // BillDesk-generated refund ID
  merc_refund_ref_no?: string; // your own refund reference number
}

export async function retrieveRefund(input: RetrieveRefundInput) {
  if (!input.refundid && !input.merc_refund_ref_no) {
    throw { success: false, error: 'refundid or merc_refund_ref_no is required' };
  }

  const payload: Record<string, unknown> = {
    mercid: cfg().MERCHANT_ID,
    ...(input.refundid           && { refundid:           input.refundid }),
    ...(input.merc_refund_ref_no && { merc_refund_ref_no: input.merc_refund_ref_no }),
  };

  try {
    const data = await josePost('/payments/ve1_2/refunds/get', payload);

    return {
      success:            true,
      refundid:           data.refundid           as string,
      transactionid:      data.transactionid      as string,
      orderid:            data.orderid            as string,
      mercid:             data.mercid             as string,
      txn_amount:         data.txn_amount         as string,
      refund_amount:      data.refund_amount      as string,
      currency:           data.currency           as string,
      refund_date:        data.refund_date        as string,
      transaction_date:   data.transaction_date   as string,
      merc_refund_ref_no: data.merc_refund_ref_no as string,
      refund_status:      data.refund_status      as '0799' | '0699',
      trace_id:           data._traceId           as string,
      timestamp:          data._timestamp         as string,
    };
  } catch (error: any) {
    const status = error.response?.status;
    const body   = error.response?.data;
    console.error('\n❌ retrieveRefund failed  HTTP', status);
    console.error('   Response:', JSON.stringify(body, null, 2));
    throw { success: false, error: body?.error ?? error.message, status };
  }
}
