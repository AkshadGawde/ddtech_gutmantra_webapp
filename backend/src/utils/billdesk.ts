import crypto from 'crypto';
import axios from 'axios';

// BillDesk Configuration
const BILLDESK_CONFIG = {
  PRODUCTION: {
    BASE_URL: 'https://api.billdesk.com',
    MERCHANT_ID: process.env.BILLDESK_MERCHANT_ID || 'KANAKV2',
    MERCHANT_KEY: process.env.BILLDESK_MERCHANT_KEY || 'to8pJnluXU43FPzhC2P2YLlbmylW4NEm',
  },
  UAT: {
    BASE_URL: 'https://uat1.billdesk.com/u2',
    MERCHANT_ID: process.env.BILLDESK_MERCHANT_ID || 'KANAKV2',
    MERCHANT_KEY: process.env.BILLDESK_MERCHANT_KEY || 'to8pJnluXU43FPzhC2P2YLlbmylW4NEm',
  },
};

// Use production or UAT based on environment
const ENV = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'UAT';
const CONFIG = BILLDESK_CONFIG[ENV as keyof typeof BILLDESK_CONFIG];

/**
 * Generate HMAC-SHA256 signature for BillDesk API requests
 */
export function generateBillDeskSignature(payload: any, merchantKey: string): string {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', merchantKey)
    .update(payloadString)
    .digest('hex');
  return signature;
}

/**
 * Generate unique BD-Traceid for request idempotency
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Get current timestamp in BillDesk format
 * Format: YYYY-MM-DDThh:mm:ss+05:30 (IST timezone, colon in offset)
 */
export function getBillDeskTimestamp(): string {
  const now = new Date();

  // BillDesk expects timestamp in IST timezone (UTC+5:30) with offset
  // Convert UTC to IST by adding 5 hours 30 minutes
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
}

/**
 * Create Order API Call
 * Returns: bdorderid, rdata, payment redirect link
 */
export async function createOrder(orderData: {
  orderId: string;
  amount: string; // e.g., "299.28"
  currency: string; // "356" for INR
  itemCode: string;
  redirectUrl: string;
  buyerEmail?: string;
  buyerPhone?: string;
  orderDate?: string;
}) {
  const traceId = generateTraceId();
  const timestamp = getBillDeskTimestamp();
  console.log('[BillDesk] Create Order — BD-Timestamp:', timestamp, '| BD-Traceid:', traceId);

  const payload = {
    mercid: CONFIG.MERCHANT_ID,
    orderid: orderData.orderId,
    amount: orderData.amount,
    order_date: orderData.orderDate || new Date().toISOString().split('T')[0],
    currency: orderData.currency || '356',
    itemcode: orderData.itemCode,
    ru: orderData.redirectUrl,
    additional_info: {
      email: orderData.buyerEmail,
      mobile: orderData.buyerPhone,
    },
  };

  const signature = generateBillDeskSignature(payload, CONFIG.MERCHANT_KEY);

  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/payments/ve1_2/orders/create`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/jose',
          'BD-Traceid': traceId,
          'BD-Timestamp': timestamp,
          'BD-Signature': signature,
        },
      }
    );

    return {
      success: true,
      bdorderid: response.data.bdorderid,
      rdata: response.data.rdata,
      payment_link: response.data.payment_link,
      trace_id: traceId,
      timestamp,
    };
  } catch (error: any) {
    console.error('BillDesk Create Order Error:', error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Create Transaction API Call
 * Initiates payment charge with card or other payment method
 */
export async function createTransaction(transactionData: {
  bdorderid: string;
  amount: string;
  deviceInfo: {
    init_channel: 'web' | 'mobile_app';
    ip: string;
    user_agent: string;
    accept_header: string;
    browser_language: string;
    browser_javascript_enabled: boolean;
    browser_tz?: string;
    browser_color_depth?: string;
    browser_java_enabled?: boolean;
    browser_screen_height?: number;
    browser_screen_width?: number;
  };
  paymentMethod: {
    type: 'card' | 'emi' | 'nwt' | 'otp';
    card_token?: string;
    card_number?: string;
    card_expiry?: string;
    card_cvv?: string;
  };
  auth_type?: '3ds2' | 'y3ds' | 'otp'; // 3ds2 recommended
  coft_consent?: boolean;
}) {
  const traceId = generateTraceId();
  const timestamp = getBillDeskTimestamp();

  const payload = {
    mercid: CONFIG.MERCHANT_ID,
    bdorderid: transactionData.bdorderid,
    amount: transactionData.amount,
    itemcode: 'TESTITEM',
    auth_type: transactionData.auth_type || '3ds2',
    device: {
      init_channel: transactionData.deviceInfo.init_channel,
      ip: transactionData.deviceInfo.ip,
      user_agent: transactionData.deviceInfo.user_agent,
      accept_header: transactionData.deviceInfo.accept_header,
      browser_language: transactionData.deviceInfo.browser_language,
      browser_javascript_enabled: transactionData.deviceInfo.browser_javascript_enabled,
      browser_tz: transactionData.deviceInfo.browser_tz || 'UTC',
      browser_color_depth: transactionData.deviceInfo.browser_color_depth || '32',
      browser_java_enabled: transactionData.deviceInfo.browser_java_enabled || false,
      browser_screen_height: transactionData.deviceInfo.browser_screen_height || 1080,
      browser_screen_width: transactionData.deviceInfo.browser_screen_width || 1920,
    },
    paymentdetail: {
      paymentmethod: transactionData.paymentMethod.type,
      ...(transactionData.paymentMethod.type === 'card' && {
        card: {
          cardnumber: transactionData.paymentMethod.card_number,
          expirydate: transactionData.paymentMethod.card_expiry,
          cvv: transactionData.paymentMethod.card_cvv,
        },
      }),
      ...(transactionData.paymentMethod.type === 'nwt' && {
        network_token: transactionData.paymentMethod.card_token,
      }),
    },
    ...(transactionData.coft_consent && {
      coft: {
        coft_consent: 'Y',
      },
    }),
  };

  const signature = generateBillDeskSignature(payload, CONFIG.MERCHANT_KEY);

  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/payments/ve1_2/transactions/create`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/jose',
          'BD-Traceid': traceId,
          'BD-Timestamp': timestamp,
          'BD-Signature': signature,
        },
      }
    );

    return {
      success: true,
      transactionid: response.data.transactionid,
      next_step: response.data.next_step, // "redirect", "capture_otp", "3ds2_challenge", "3ds2_frictionless"
      auth_status: response.data.auth_status, // "0300" (successful), "0002" (pending), "0399" (failed)
      redirect_url: response.data.redirect_url,
      challenge_data: response.data.challenge_data, // For 3DS2 challenge
      trace_id: traceId,
      timestamp,
    };
  } catch (error: any) {
    console.error('BillDesk Create Transaction Error:', error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Update Transaction API Call
 * Authorizes transaction after customer completes authentication
 */
export async function updateTransaction(transactionData: {
  transactionid: string;
  bdorderid: string;
  responseParameters: {
    flow_type: '3ds2' | 'otp' | 'rupay';
    cres?: string; // For 3DS2 flow
    otp?: string; // For OTP flow
    AccuResponseCode?: string; // For RuPay
    session?: string; // For RuPay
    AccuGuid?: string; // For RuPay
    AccuRequestId?: string; // For RuPay
  };
}) {
  const traceId = generateTraceId();
  const timestamp = getBillDeskTimestamp();

  const payload = {
    mercid: CONFIG.MERCHANT_ID,
    transactionid: transactionData.transactionid,
    bdorderid: transactionData.bdorderid,
    response_parameters: {
      ...(transactionData.responseParameters.flow_type === '3ds2' && {
        cres: transactionData.responseParameters.cres,
      }),
      ...(transactionData.responseParameters.flow_type === 'otp' && {
        otp: transactionData.responseParameters.otp,
      }),
      ...(transactionData.responseParameters.flow_type === 'rupay' && {
        AccuResponseCode: transactionData.responseParameters.AccuResponseCode,
        session: transactionData.responseParameters.session,
        AccuGuid: transactionData.responseParameters.AccuGuid,
        AccuRequestId: transactionData.responseParameters.AccuRequestId,
      }),
    },
  };

  const signature = generateBillDeskSignature(payload, CONFIG.MERCHANT_KEY);

  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/payments/ve1_2/transactions/update`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/jose',
          'BD-Traceid': traceId,
          'BD-Timestamp': timestamp,
          'BD-Signature': signature,
        },
      }
    );

    return {
      success: true,
      transactionid: response.data.transactionid,
      auth_status: response.data.auth_status, // "0300" (successful), "0002" (pending), "0399" (failed)
      authcode: response.data.authcode,
      bank_ref_no: response.data.bank_ref_no,
      rrn: response.data.rrn,
      mandate_setup_status: response.data.mandate_setup_status,
      trace_id: traceId,
      timestamp,
    };
  } catch (error: any) {
    console.error('BillDesk Update Transaction Error:', error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Retrieve Transaction Status (Official API)
 * Query existing transaction by transactionid or orderid
 */
export async function retrieveTransaction(queryParams: {
  transactionid?: string;
  orderid?: string;
  mercid?: string;
  refund_details?: boolean;
}) {
  const traceId = generateTraceId();
  const timestamp = getBillDeskTimestamp();

  const payload = {
    mercid: queryParams.mercid || CONFIG.MERCHANT_ID,
    ...(queryParams.transactionid && { transactionid: queryParams.transactionid }),
    ...(queryParams.orderid && { orderid: queryParams.orderid }),
    ...(queryParams.refund_details && { refund_details: queryParams.refund_details }),
  };

  const signature = generateBillDeskSignature(payload, CONFIG.MERCHANT_KEY);

  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/payments/ve1_2/transactions/retrieve`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/jose',
          'BD-Traceid': traceId,
          'BD-Timestamp': timestamp,
          'BD-Signature': signature,
        },
      }
    );

    return {
      success: true,
      transactionid: response.data.transactionid,
      orderid: response.data.orderid,
      auth_status: response.data.auth_status,
      settlement_status: response.data.settlement_status,
      authcode: response.data.authcode,
      bank_ref_no: response.data.bank_ref_no,
      rrn: response.data.rrn,
      amount: response.data.amount,
      trace_id: traceId,
      timestamp,
    };
  } catch (error: any) {
    console.error('BillDesk Retrieve Transaction Error:', error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}
