import express, { Request, Response } from 'express';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import {
  createOrder,
  createTransaction,
  updateTransaction,
} from '../utils/billdesk.js';

const router = express.Router();

const PP_CREATE_URL = process.env.PETPOOJA_CREATE_URL || 'https://pponlineordercb.petpooja.com/save_order';

// ─── Shared PetPooja sync logic ────────────────────────────────────────────

async function syncOrderToPetpooja(orderid: string): Promise<{ success: boolean; petpooja_order_id?: string; error?: string }> {
  const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
  if (!orderDoc.exists) return { success: false, error: 'Order not found' };

  const o = orderDoc.data()!;

  if (o.payment_status !== '0300') return { success: false, error: 'Payment not completed' };
  if (o.petpooja_synced) return { success: true, petpooja_order_id: o.petpooja_order_id };

  const fullName = `${o.shippingAddress?.firstName || ''} ${o.shippingAddress?.lastName || ''}`.trim();
  const createdOn = new Date().toISOString().replace('T', ' ').split('.')[0];

  const petpoojaPayload = {
    app_key: process.env.PETPOOJA_APP_KEY,
    app_secret: process.env.PETPOOJA_APP_SECRET,
    access_token: process.env.PETPOOJA_ACCESS_TOKEN,
    orderinfo: {
      OrderInfo: {
        Restaurant: {
          details: {
            restID: process.env.PETPOOJA_REST_ID,
            res_name: 'GutMantra',
            address: 'Pune',
          },
        },
        Customer: {
          details: {
            name: fullName,
            phone: o.shippingAddress?.phone || o.buyerPhone,
            email: o.shippingAddress?.email || o.buyerEmail,
            address: o.shippingAddress?.fullAddress,
            latitude: String(o.shippingAddress?.latitude || ''),
            longitude: String(o.shippingAddress?.longitude || ''),
          },
        },
        Order: {
          details: {
            orderID: orderid,
            preorder_date: '',
            preorder_time: '',
            service_charge: '0',
            sc_tax_amount: '0',
            delivery_charges: String(Number(o.deliveryCharge || 0).toFixed(2)),
            dc_tax_percentage: '0',
            dc_tax_amount: '0',
            dc_gst_details: [{ gst_liable: 'restaurant', amount: '0' }],
            packing_charges: '0',
            pc_tax_amount: '0',
            pc_tax_percentage: '0',
            pc_gst_details: [{ gst_liable: 'restaurant', amount: '0' }],
            order_type: 'H',
            created_on: createdOn,
            enable_delivery: 1,
            min_prep_time: 20,
            advanced_order: 'N',
            urgent_order: false,
            urgent_time: 20,
            payment_type: 'ONLINE',
            table_no: '',
            no_of_persons: '0',
            discount_total: String(Number(o.discount || 0).toFixed(2)),
            tax_total: '0.00',
            discount_type: 'F',
            total: String(o.amount),
            collect_cash: '0',
            otp: '1234',
            description: '',
          },
        },
        OrderItem: {
          details: (o.items || []).map((item: any) => ({
            itemid: item.base_id || item.variation_id || item.id,
            variation_id: item.variation_id || '',
            name: item.name,
            quantity: String(parseInt(item.quantity) || 1),
            price: String(parseFloat(item.price) || 0),
            tax_inclusive: true,
            gst_liability: 'restaurant',
            item_tax: [],
            item_discount: '0',
            final_price: String(parseFloat(item.price) || 0),
            description: '',
            variation_name: item.variation_name || '',
            AddonItem: { details: [] },
          })),
        },
        Tax: { details: [] },
        Discount: { details: [] },
      },
      callback_url: process.env.PETPOOJA_CALLBACK_URL || 'https://api.gutmantra.in/api/webhook',
      udid: '',
      device_type: 'Web',
    },
  };

  console.log('[PetPooja Sync] Sending order:', { orderid, amount: o.amount, items: o.items?.length });

  const ppResp = await fetch(PP_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petpoojaPayload),
  });

  const ppData: any = await ppResp.json().catch(() => ({ success: '0' }));
  console.log('[PetPooja Sync] Response:', ppData);

  if (!ppResp.ok || ppData?.success !== '1') {
    console.error('[PetPooja Sync] Failed:', ppData);
    return { success: false, error: JSON.stringify(ppData) };
  }

  await getFirestoreDb().collection('orders').doc(orderid).update({
    petpooja_synced: true,
    petpooja_order_id: ppData?.clientOrderID || ppData?.order_id || null,
    petpooja_response: ppData,
    synced_at: new Date(),
    status: 'synced_to_petpooja',
    updatedAt: new Date(),
  });

  console.log(`[PetPooja Sync] ✅ Order ${orderid} synced (ID: ${ppData?.clientOrderID || ppData?.order_id})`);
  return { success: true, petpooja_order_id: ppData?.clientOrderID || ppData?.order_id };
}

// ─── POST /create-order ────────────────────────────────────────────────────

router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { userid, items, paymentmethod, payment_type, shippingAddress, buyerEmail, buyerPhone, deliveryCharge, discount } = req.body;

    if (!userid || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'userid and items (array) are required' });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.price || 0) * (parseInt(item.quantity) || 1), 0);
    const dc = parseFloat(deliveryCharge || 0);
    const disc = parseFloat(discount || 0);
    const amount = Math.max(0, subtotal - disc + dc).toFixed(2);

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Total amount must be greater than 0' });
    }

    const orderid = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const billDeskResponse: any = await createOrder({
      orderId: orderid,
      amount,
      currency: '356',
      itemCode: 'DIRECT',
      redirectUrl: `${process.env.BILLDESK_RETURN_URL || 'https://api.gutmantra.in/api/billdesk/callback'}`,
      buyerEmail: buyerEmail || shippingAddress?.email,
      buyerPhone: String(buyerPhone || shippingAddress?.phone || '').replace(/\D/g, ''),
    });

    await getFirestoreDb().collection('orders').doc(orderid).set({
      orderid,
      userid,
      bdorderid: billDeskResponse.bdorderid,
      amount,
      subtotal: subtotal.toFixed(2),
      deliveryCharge: dc.toFixed(2),
      discount: disc.toFixed(2),
      currency: '356',
      status: 'created',
      items,
      shippingAddress,
      paymentmethod,
      payment_type: payment_type || 'ONLINE',
      buyerEmail: buyerEmail || shippingAddress?.email,
      buyerPhone: buyerPhone || shippingAddress?.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      petpooja_synced: false,
      payment_status: null,
    });

    console.log(`[BillDesk] Order created: ${orderid} → ${billDeskResponse.bdorderid}`);

    return res.json({
      success: true,
      orderid,
      bdorderid: billDeskResponse.bdorderid,
      amount,
      currency: '356',
      payment_link: billDeskResponse.payment_link,
      rdata: billDeskResponse.rdata,
    });
  } catch (error: any) {
    console.error('[BillDesk] Create Order error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

// ─── POST /create-transaction ──────────────────────────────────────────────

router.post('/create-transaction', async (req: Request, res: Response) => {
  try {
    const { orderid, bdorderid, amount, cardNumber, cardExpiry, cardCvv, paymentmethod, deviceInfo } = req.body;

    if (!orderid || !bdorderid || !amount) {
      return res.status(400).json({ success: false, error: 'orderid, bdorderid, and amount are required' });
    }

    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) return res.status(404).json({ success: false, error: 'Order not found' });
    if (orderDoc.data()?.bdorderid !== bdorderid) return res.status(400).json({ success: false, error: 'Order/BillDesk ID mismatch' });

    const billDeskResponse: any = await createTransaction({
      bdorderid,
      amount,
      deviceInfo: {
        init_channel: deviceInfo?.init_channel || 'web',
        ip: deviceInfo?.ip || req.ip || '0.0.0.0',
        user_agent: deviceInfo?.userAgent || req.get('user-agent') || 'unknown',
        accept_header: deviceInfo?.acceptHeader || req.get('accept') || '*/*',
        browser_language: deviceInfo?.browserLanguage || 'en-US',
        browser_javascript_enabled: true,
        browser_tz: deviceInfo?.browserTz || 'Asia/Kolkata',
        browser_color_depth: deviceInfo?.browserColorDepth || '32',
        browser_java_enabled: false,
        browser_screen_height: deviceInfo?.browserScreenHeight || 1080,
        browser_screen_width: deviceInfo?.browserScreenWidth || 1920,
      },
      paymentMethod: {
        type: paymentmethod || 'card',
        ...(paymentmethod === 'card' && { card_number: cardNumber, card_expiry: cardExpiry, card_cvv: cardCvv }),
      },
      auth_type: '3ds2',
    });

    await getFirestoreDb().collection('transactions').doc(billDeskResponse.transactionid).set({
      transactionid: billDeskResponse.transactionid,
      orderid, bdorderid, amount,
      auth_status: billDeskResponse.auth_status,
      next_step: billDeskResponse.next_step,
      redirect_url: billDeskResponse.redirect_url,
      challenge_data: billDeskResponse.challenge_data,
      flow_type: '3ds2',
      createdAt: new Date(), updatedAt: new Date(),
    });

    await getFirestoreDb().collection('orders').doc(orderid).update({
      status: 'pending',
      transactionid: billDeskResponse.transactionid,
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      transactionid: billDeskResponse.transactionid,
      bdorderid,
      auth_status: billDeskResponse.auth_status,
      next_step: billDeskResponse.next_step,
      redirect_url: billDeskResponse.redirect_url,
      challenge_data: billDeskResponse.challenge_data,
    });
  } catch (error: any) {
    console.error('[BillDesk] Create Transaction error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create transaction' });
  }
});

// ─── POST /update-transaction ──────────────────────────────────────────────

router.post('/update-transaction', async (req: Request, res: Response) => {
  try {
    const { transactionid, bdorderid, orderid, flowType, cres, otp } = req.body;

    if (!transactionid || !bdorderid || !orderid) {
      return res.status(400).json({ success: false, error: 'transactionid, bdorderid, and orderid are required' });
    }

    const billDeskResponse: any = await updateTransaction({
      transactionid, bdorderid,
      responseParameters: {
        flow_type: flowType || '3ds2',
        ...(flowType === '3ds2' && { cres }),
        ...(flowType === 'otp' && { otp }),
      },
    });

    await getFirestoreDb().collection('transactions').doc(transactionid).update({
      auth_status: billDeskResponse.auth_status,
      authcode: billDeskResponse.authcode,
      bank_ref_no: billDeskResponse.bank_ref_no,
      rrn: billDeskResponse.rrn,
      updatedAt: new Date(),
    });

    await getFirestoreDb().collection('orders').doc(orderid).update({
      status: billDeskResponse.auth_status === '0300' ? 'completed' : 'failed',
      payment_status: billDeskResponse.auth_status,
      authcode: billDeskResponse.authcode,
      bank_ref_no: billDeskResponse.bank_ref_no,
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      transactionid,
      auth_status: billDeskResponse.auth_status,
      authcode: billDeskResponse.authcode,
      bank_ref_no: billDeskResponse.bank_ref_no,
      rrn: billDeskResponse.rrn,
    });
  } catch (error: any) {
    console.error('[BillDesk] Update Transaction error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to update transaction' });
  }
});

// ─── GET /status/:orderid ──────────────────────────────────────────────────

router.get('/status/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) return res.status(404).json({ success: false, error: 'Order not found' });

    const o = orderDoc.data()!;
    let transactionData = null;
    if (o.transactionid) {
      const txnDoc = await getFirestoreDb().collection('transactions').doc(o.transactionid).get();
      if (txnDoc.exists) transactionData = txnDoc.data();
    }

    return res.json({
      success: true,
      order: {
        orderid: o.orderid,
        status: o.status,
        payment_status: o.payment_status,
        amount: o.amount,
        createdAt: o.createdAt,
        petpooja_synced: o.petpooja_synced,
      },
      transaction: transactionData || null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to get status' });
  }
});

// ─── POST /sync-to-petpooja/:orderid ──────────────────────────────────────

router.post('/sync-to-petpooja/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;
    if (!orderid) return res.status(400).json({ success: false, error: 'orderid required' });

    const result = await syncOrderToPetpooja(orderid);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, message: 'Order synced to PetPooja', petpooja_order_id: result.petpooja_order_id });
  } catch (error: any) {
    console.error('[PetPooja Sync] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to sync order' });
  }
});

// ─── GET /:orderid ─────────────────────────────────────────────────────────

router.get('/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) return res.status(404).json({ success: false, error: 'Order not found' });

    const o = orderDoc.data()!;
    let transactionData = null;
    if (o.transactionid) {
      const txnDoc = await getFirestoreDb().collection('transactions').doc(o.transactionid).get();
      if (txnDoc.exists) transactionData = txnDoc.data();
    }

    return res.json({ success: true, order: o, transaction: transactionData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to get order' });
  }
});

export { syncOrderToPetpooja };
export default router;
