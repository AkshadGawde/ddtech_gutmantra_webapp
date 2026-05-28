# FINAL: Complete BillDesk → PetPooja Integration Prompt

## CRITICAL REQUIREMENTS
1. **DO NOT change PetPooja payload structure** — use EXACT same nested format
2. **Only changes to PetPooja:** `payment_type: "ONLINE"` and `collect_cash: "0"`
3. **Implement webhook auto-sync + frontend polling fallback**
4. **Keep existing offline (COD) flow untouched**

---

## PART 1: BACKEND — `/src/routes/billdeskRoutes.ts`

Replace the existing `/create-order` endpoint completely and add `/sync-to-petpooja/:orderid` endpoint:

```typescript
import express, { Request, Response } from 'express';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import {
  createOrder,
  createTransaction,
  updateTransaction,
  retrieveTransaction,
} from '../utils/billdesk.js';

const router = express.Router();

/**
 * POST /api/orders/create-order
 * Step 1: Create order in BillDesk and store complete order payload in Firestore
 * 
 * Request payload:
 * {
 *   "userid": "string",
 *   "items": [{ "base_id", "variation_id", "name", "price", "quantity" }],
 *   "paymentmethod": "card",
 *   "payment_type": "ONLINE" | "COD",
 *   "shippingAddress": { "firstName", "lastName", "phone", "email", "streetAddress", 
 *                        "apartment", "city", "state", "pinCode", "country", "fullAddress", 
 *                        "latitude", "longitude" },
 *   "buyerEmail": "string",
 *   "buyerPhone": "string"
 * }
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { userid, items, paymentmethod, payment_type, shippingAddress, buyerEmail, buyerPhone } = req.body;

    // Validate required fields
    if (!userid || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userid and items (array) are required',
      });
    }

    // Calculate total amount
    const amount = items
      .reduce((sum: number, item: any) => sum + parseFloat(item.price || 0) * (item.quantity || 1), 0)
      .toFixed(2);

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Total amount must be greater than 0',
      });
    }

    // Generate unique order ID
    const orderid = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Call BillDesk Create Order API
    const billDeskResponse: any = await createOrder({
      orderId: orderid,
      amount,
      currency: '356',
      itemCode: 'PRODUCT',
      redirectUrl: `${process.env.BILLDESK_RETURN_URL}?orderid=${orderid}`,
      buyerEmail,
      buyerPhone,
    });

    if (!billDeskResponse.success) {
      console.error('[BillDesk] Create Order failed:', billDeskResponse.error);
      return res.status(400).json({
        success: false,
        error: 'Failed to create order in BillDesk',
        details: billDeskResponse.error,
      });
    }

    // Store COMPLETE order payload in Firestore (for later sync to PetPooja)
    await getFirestoreDb().collection('orders').doc(orderid).set({
      orderid,
      userid,
      bdorderid: billDeskResponse.bdorderid,
      amount,
      currency: '356',
      status: 'created',
      items,                          // ✅ FULL items array
      shippingAddress,                // ✅ FULL shipping address with coordinates
      paymentmethod,
      payment_type,                   // ✅ "ONLINE" or "COD"
      buyerEmail,
      buyerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      petpooja_synced: false,         // ✅ Track sync status
      payment_status: null,           // Will be updated by webhook or polling
    });

    console.log(`[BillDesk] Order created: ${orderid} → ${billDeskResponse.bdorderid}`);

    return res.json({
      success: true,
      orderid,
      bdorderid: billDeskResponse.bdorderid,
      amount,
      currency: '356',
      payment_link: billDeskResponse.payment_link,
    });
  } catch (error: any) {
    console.error('[BillDesk] Create Order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

/**
 * POST /api/orders/create-transaction
 * Step 2: Create transaction (initiate payment) - UNCHANGED
 */
router.post('/create-transaction', async (req: Request, res: Response) => {
  try {
    const {
      orderid,
      bdorderid,
      amount,
      cardNumber,
      cardExpiry,
      cardCvv,
      paymentmethod,
      deviceInfo,
    } = req.body;

    // Validate required fields
    if (!orderid || !bdorderid || !amount) {
      return res.status(400).json({
        success: false,
        error: 'orderid, bdorderid, and amount are required',
      });
    }

    // Verify order exists and matches
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (orderDoc.data()?.bdorderid !== bdorderid) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and BillDesk Order ID mismatch',
      });
    }

    // Call BillDesk Create Transaction API
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
        browser_tz: deviceInfo?.browserTz || 'UTC',
        browser_color_depth: deviceInfo?.browserColorDepth || '32',
        browser_java_enabled: false,
        browser_screen_height: deviceInfo?.browserScreenHeight || 1080,
        browser_screen_width: deviceInfo?.browserScreenWidth || 1920,
      },
      paymentMethod: {
        type: paymentmethod || 'card',
        ...(paymentmethod === 'card' && {
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvv: cardCvv,
        }),
      },
      auth_type: '3ds2',
    });

    if (!billDeskResponse.success) {
      console.error('[BillDesk] Create Transaction failed:', billDeskResponse.error);
      return res.status(400).json({
        success: false,
        error: 'Failed to create transaction',
        details: billDeskResponse.error,
      });
    }

    // Store transaction in Firestore
    await getFirestoreDb().collection('transactions').doc(billDeskResponse.transactionid).set({
      transactionid: billDeskResponse.transactionid,
      orderid,
      bdorderid,
      amount,
      auth_status: billDeskResponse.auth_status,
      next_step: billDeskResponse.next_step,
      redirect_url: billDeskResponse.redirect_url,
      challenge_data: billDeskResponse.challenge_data,
      flow_type: '3ds2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update order status to pending
    await getFirestoreDb().collection('orders').doc(orderid).update({
      status: 'pending',
      transactionid: billDeskResponse.transactionid,
      updatedAt: new Date(),
    });

    console.log(`[BillDesk] Transaction created: ${billDeskResponse.transactionid}`);

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
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create transaction',
    });
  }
});

/**
 * POST /api/orders/update-transaction
 * Step 3: Update transaction with 3DS2/OTP response - UNCHANGED
 */
router.post('/update-transaction', async (req: Request, res: Response) => {
  try {
    const { transactionid, bdorderid, orderid, flowType, cres, otp } = req.body;

    // Validate required fields
    if (!transactionid || !bdorderid || !orderid) {
      return res.status(400).json({
        success: false,
        error: 'transactionid, bdorderid, and orderid are required',
      });
    }

    if (!flowType || (flowType === '3ds2' && !cres) || (flowType === 'otp' && !otp)) {
      return res.status(400).json({
        success: false,
        error: `For ${flowType} flow, ${flowType === '3ds2' ? 'cres' : 'otp'} is required`,
      });
    }

    // Call BillDesk Update Transaction API
    const billDeskResponse: any = await updateTransaction({
      transactionid,
      bdorderid,
      responseParameters: {
        flow_type: flowType || '3ds2',
        ...(flowType === '3ds2' && { cres }),
        ...(flowType === 'otp' && { otp }),
      },
    });

    if (!billDeskResponse.success) {
      console.error('[BillDesk] Update Transaction failed:', billDeskResponse.error);
      return res.status(400).json({
        success: false,
        error: 'Failed to update transaction',
        details: billDeskResponse.error,
      });
    }

    // Update transaction in Firestore
    await getFirestoreDb().collection('transactions').doc(transactionid).update({
      auth_status: billDeskResponse.auth_status,
      authcode: billDeskResponse.authcode,
      bank_ref_no: billDeskResponse.bank_ref_no,
      rrn: billDeskResponse.rrn,
      updatedAt: new Date(),
    });

    // Update order status based on auth_status
    const orderStatus = billDeskResponse.auth_status === '0300' ? 'completed' : 'failed';
    await getFirestoreDb().collection('orders').doc(orderid).update({
      status: orderStatus,
      payment_status: billDeskResponse.auth_status,
      authcode: billDeskResponse.authcode,
      bank_ref_no: billDeskResponse.bank_ref_no,
      updatedAt: new Date(),
    });

    console.log(
      `[BillDesk] Transaction updated: ${transactionid} → ${billDeskResponse.auth_status}`
    );

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
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update transaction',
    });
  }
});

/**
 * GET /api/orders/status/:orderid
 * Poll order status (for frontend polling)
 */
router.get('/status/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;

    if (!orderid) {
      return res.status(400).json({
        success: false,
        error: 'orderid is required',
      });
    }

    // Get order from Firestore
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    const orderData = orderDoc.data();

    // Get transaction if it exists
    let transactionData = null;
    if (orderData?.transactionid) {
      const txnDoc = await getFirestoreDb().collection('transactions').doc(orderData.transactionid).get();
      if (txnDoc.exists) {
        transactionData = txnDoc.data();
      }
    }

    return res.json({
      success: true,
      order: {
        orderid: orderData?.orderid,
        status: orderData?.status,
        payment_status: orderData?.payment_status,
        amount: orderData?.amount,
        createdAt: orderData?.createdAt,
        petpooja_synced: orderData?.petpooja_synced,
      },
      transaction: transactionData || null,
    });
  } catch (error: any) {
    console.error('[BillDesk] Get Status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get order status',
    });
  }
});

/**
 * POST /api/orders/sync-to-petpooja/:orderid
 * Sync successful BillDesk order to PetPooja with EXACT payload structure
 * 
 * Called by:
 * - Webhook (primary): Auto-triggered on payment success
 * - Frontend polling (fallback): Manual trigger after polling detects payment_status = "0300"
 * 
 * PetPooja payload uses EXACT same structure as offline orders
 * ONLY changes: payment_type and collect_cash fields
 */
router.post('/sync-to-petpooja/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;

    if (!orderid) {
      return res.status(400).json({ success: false, error: 'orderid required' });
    }

    // Get order from Firestore
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData = orderDoc.data();

    // Verify payment was successful
    if (orderData?.payment_status !== '0300') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        payment_status: orderData?.payment_status,
      });
    }

    // Check if already synced (prevent duplicates)
    if (orderData?.petpooja_synced) {
      return res.json({
        success: true,
        message: 'Order already synced to PetPooja',
        petpooja_order_id: orderData?.petpooja_order_id,
      });
    }

    // ─── BUILD PETPOOJA PAYLOAD (EXACT SAME STRUCTURE AS OFFLINE) ─────────────

    const fullName = `${orderData?.shippingAddress?.firstName || ''} ${orderData?.shippingAddress?.lastName || ''}`.trim();
    const createdOn = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB');

    const petpoojaPayload = {
      app_key: process.env.PETPOOJA_APP_KEY,
      app_secret: process.env.PETPOOJA_APP_SECRET,
      access_token: process.env.PETPOOJA_ACCESS_TOKEN,
      orderinfo: {
        OrderInfo: {
          Restaurant: {
            details: {
              restID: process.env.PETPOOJA_REST_ID,
              res_name: "GutMantra",
              address: "Pune"
            }
          },
          Customer: {
            details: {
              name: fullName,
              phone: orderData?.shippingAddress?.phone || orderData?.buyerPhone,
              email: orderData?.shippingAddress?.email || orderData?.buyerEmail,
              address: orderData?.shippingAddress?.fullAddress,
              latitude: orderData?.shippingAddress?.latitude || "",
              longitude: orderData?.shippingAddress?.longitude || ""
            }
          },
          Order: {
            details: {
              orderID: orderid,
              preorder_date: "",
              preorder_time: "",
              service_charge: "0",
              sc_tax_amount: "0",
              delivery_charges: "50.00",
              dc_tax_percentage: "0",
              dc_tax_amount: "0",
              dc_gst_details: [{ gst_liable: "restaurant", amount: "0" }],
              packing_charges: "0",
              pc_tax_amount: "0",
              pc_tax_percentage: "0",
              pc_gst_details: [{ gst_liable: "restaurant", amount: "0" }],
              order_type: "H",
              created_on: createdOn,
              enable_delivery: 1,
              min_prep_time: 20,
              advanced_order: "N",
              urgent_order: false,
              urgent_time: 20,
              payment_type: orderData?.payment_type === "ONLINE" ? "ONLINE" : "COD",  // ✅ ONLY CHANGE
              table_no: "",
              no_of_persons: "0",
              discount_total: "0.00",
              tax_total: "0.00",
              discount_type: "F",
              total: orderData?.amount,
              collect_cash: orderData?.payment_type === "ONLINE" ? "0" : orderData?.amount,  // ✅ ONLY CHANGE
              otp: "1234",
              description: ""
            }
          },
          OrderItem: {
            details: (orderData?.items || []).map((item: any) => ({
              itemid: item.base_id || item.variation_id,
              name: item.name,
              quantity: parseInt(item.quantity) || 1,
              item_price: parseFloat(item.price) || 0,
              notes: ""
            }))
          },
          Tax: {
            details: []
          },
          Discount: {
            details: []
          }
        },
        callback_url: "https://api.gutmantra.in/api/webhook",
        udid: "",
        device_type: "Web"
      }
    };

    console.log('[PetPooja Sync] 📤 Sending order to PetPooja:', {
      orderid,
      payment_type: orderData?.payment_type,
      amount: orderData?.amount,
      itemCount: orderData?.items?.length
    });

    // Send to PetPooja
    const ppResponse = await fetch(
      process.env.PETPOOJA_CREATE_URL || 'https://pponlineordercb.petpooja.com/save_order',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petpoojaPayload),
      }
    );

    const ppData = await ppResponse.json();

    if (!ppResponse.ok || ppData?.status !== 1) {
      console.error('[PetPooja Sync] ❌ Failed:', ppData);
      return res.status(400).json({
        success: false,
        error: 'Failed to sync with PetPooja',
        details: ppData,
      });
    }

    // Update Firestore: Mark as synced
    await getFirestoreDb().collection('orders').doc(orderid).update({
      petpooja_synced: true,
      petpooja_order_id: ppData?.order_id,
      petpooja_response: ppData,
      synced_at: new Date(),
      status: 'synced_to_petpooja',
      updated_at: new Date(),
    });

    console.log(`[PetPooja Sync] ✅ Order ${orderid} synced to PetPooja (ID: ${ppData?.order_id})`);

    return res.json({
      success: true,
      message: 'Order synced to PetPooja successfully',
      petpooja_order_id: ppData?.order_id,
    });
  } catch (error: any) {
    console.error('[PetPooja Sync] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync order',
    });
  }
});

/**
 * GET /api/orders/:orderid
 * Get complete order details - UNCHANGED
 */
router.get('/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;

    if (!orderid) {
      return res.status(400).json({
        success: false,
        error: 'orderid is required',
      });
    }

    // Get order from Firestore
    const orderDoc = await getFirestoreDb().collection('orders').doc(orderid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    const orderData = orderDoc.data();

    // Get transaction if it exists
    let transactionData = null;
    if (orderData?.transactionid) {
      const txnDoc = await getFirestoreDb().collection('transactions').doc(orderData.transactionid).get();
      if (txnDoc.exists) {
        transactionData = txnDoc.data();
      }
    }

    return res.json({
      success: true,
      order: orderData,
      transaction: transactionData,
    });
  } catch (error: any) {
    console.error('[BillDesk] Get Order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get order details',
    });
  }
});

export default router;
```

---

## PART 2: BACKEND — `/src/routes/billdesk-webhook.routes.ts`

Update the `/callback` endpoint to auto-sync to PetPooja on successful payment:

```typescript
// In the /callback endpoint, around line 150-160 where payment status is updated,
// AFTER this block:
// await db.collection('orders').doc(orderId).update({ status: orderStatus, ... });
//
// ADD THIS CODE:

// AUTO-SYNC TO PETPOOJA ON SUCCESSFUL PAYMENT
if (auth_status === '0300') {
  console.log(`[WEBHOOK] 🔄 Payment successful. Auto-syncing order ${orderid} to PetPooja...`);
  
  try {
    const syncResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/orders/sync-to-petpooja/${orderid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log(`[WEBHOOK] ✅ Auto-synced to PetPooja: ${syncData.petpooja_order_id}`);
    } else {
      console.warn(`[WEBHOOK] ⚠️ PetPooja sync failed: ${syncData.error}`);
      console.warn('[WEBHOOK] Frontend polling will retry as fallback...');
    }
  } catch (err) {
    console.error('[WEBHOOK] Error auto-syncing to PetPooja:', err);
    console.warn('[WEBHOOK] Frontend polling will retry as fallback...');
  }
}
```

---

## PART 3: FRONTEND — `src/pages/CheckoutPage.tsx`

In the `handleCheckout` function, replace the order submission section (around line 520-600) with:

```typescript
// ─── Step 3: place order ──
try {
  setLoading(true);

  const orderID = `${user.uid}_${Date.now()}`;

  const formattedItems = items.map((item: any) => {
    const variantSuffix =
      item.variant && !item.name.includes(item.variant)
        ? ` (${item.variant})`
        : "";
    return {
      base_id:
        item.base_id ||
        item.sku ||
        (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : ""),
      variation_id:
        item.variation_id ||
        (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : ""),
      name: `${item.name}${variantSuffix}`,
      price: String(item.price),
      quantity: String(item.quantity),
    };
  });

  const fullAddress = buildFullAddress(shippingAddress);

  if (!fullAddress) {
    alert("Address missing");
    return;
  }

  // ─── SELECT ENDPOINT BASED ON PAYMENT MODE ────────────────────────────
  const endpoint = paymentMode === 'ONLINE' 
    ? `${API_BASE}/orders/create-order`  // ✅ NEW BillDesk endpoint
    : `${API_BASE}/create-order`;         // ✅ EXISTING legacy endpoint

  // ─── BUILD PAYLOAD FOR SELECTED ENDPOINT ──────────────────────────────
  const finalPayload = paymentMode === 'ONLINE'
    ? {
        userid: user.uid,
        items: formattedItems,
        paymentmethod: 'card',
        payment_type: 'ONLINE',
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          streetAddress: shippingAddress.streetAddress,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pinCode: shippingAddress.pinCode,
          country: shippingAddress.country,
          fullAddress,
          latitude: shippingAddress.latitude,
          longitude: shippingAddress.longitude,
        },
        buyerEmail: shippingAddress.email,
        buyerPhone: shippingAddress.phone,
      }
    : {
        orderID,
        paymentMode,
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          streetAddress: shippingAddress.streetAddress,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pinCode: shippingAddress.pinCode,
          country: shippingAddress.country,
          fullAddress,
        },
        items: formattedItems,
      };

  console.log('💳 PAYMENT MODE:', paymentMode);
  console.log('🔗 ENDPOINT:', endpoint);
  console.log('📦 FINAL PAYLOAD:', JSON.stringify(finalPayload, null, 2));

  // Verify NO null base_id in items
  const nullBaseIds = formattedItems.filter((item: any) => !item.base_id);
  if (nullBaseIds.length > 0) {
    console.error('🔴 CRITICAL: Items with null/empty base_id:', nullBaseIds);
    throw new Error(`Invalid items: ${nullBaseIds.map((i: any) => i.name).join(", ")} missing SKU`);
  }
  console.log('✅ All items have valid base_id');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalPayload),
  });

  const data = await response.json();
  console.log('📡 RESPONSE:', data);

  if (!data.success) {
    throw new Error(data.error || 'Order failed');
  }

  // ─── ONLINE PAYMENT FLOW ──────────────────────────────────────────────
  if (paymentMode === 'ONLINE') {
    const { orderid, payment_link } = data;
    console.log('✅ BillDesk order created:', { orderid, payment_link });

    // Open BillDesk payment gateway
    const paymentWindow = window.open(payment_link, 'BillDeskPayment', 'width=900,height=700');

    if (!paymentWindow) {
      alert('Popup blocked. Please disable popup blocker and try again.');
      return;
    }

    console.log('📡 Starting payment status polling for:', orderid);

    // FALLBACK: Poll for payment status every 2 seconds
    let pollCount = 0;
    const maxPolls = 150; // 5 minutes total

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const statusResponse = await fetch(`${API_BASE}/orders/status/${orderid}`);
        const statusData = await statusResponse.json();

        console.log(`[Poll ${pollCount}/${maxPolls}] Payment status:`, statusData.order?.payment_status);

        if (statusData.order?.payment_status === '0300') {
          // ✅ PAYMENT SUCCESSFUL
          clearInterval(pollInterval);
          paymentWindow?.close();

          console.log('✅ Payment successful! Triggering PetPooja sync...');

          // Trigger PetPooja sync (fallback if webhook didn't fire)
          try {
            const syncResponse = await fetch(`${API_BASE}/orders/sync-to-petpooja/${orderid}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const syncData = await syncResponse.json();
            console.log('PetPooja sync response:', syncData);
          } catch (syncErr) {
            console.warn('Sync fallback error:', syncErr);
          }

          clearCart();
          alert('Order placed successfully! Payment confirmed.\nYour order is being prepared.');
          navigate('/success');
          return;
        }

        if (statusData.order?.payment_status === '0399') {
          // ❌ PAYMENT FAILED
          clearInterval(pollInterval);
          paymentWindow?.close();
          throw new Error('Payment failed. Please try again.');
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }

      // Stop after max polling
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.warn('⏱️ Polling timeout. Order may still be processing.');
        console.log('💡 Webhook will auto-sync if payment completes.');
        alert('Your payment is being processed. Check your email for confirmation.');
        navigate('/');
      }
    }, 2000); // Poll every 2 seconds

    return;
  }

  // ─── COD FLOW (EXISTING) ──────────────────────────────────────────────
  console.log('✅ COD order placed successfully');
  clearCart();
  onNext ? onNext() : navigate('/success');
} catch (error: any) {
  console.error('❌ Checkout error:', error);
  alert(error.message || 'Something went wrong. Please try again.');
} finally {
  setLoading(false);
}
```

---

## DEPLOYMENT CHECKLIST

After implementing:

1. **Backend:**
   - [ ] Update `/src/routes/billdeskRoutes.ts` with all code above
   - [ ] Update `/src/routes/billdesk-webhook.routes.ts` with auto-sync code
   - [ ] Run `npm install` (if new packages needed)
   - [ ] Run `npm run build` (verify no errors)
   - [ ] Test: `pm2 restart gut-backend --update-env`

2. **Frontend:**
   - [ ] Update `src/pages/CheckoutPage.tsx` with new `handleCheckout` logic
   - [ ] Verify build: `npm run build`
   - [ ] Test locally or deploy

3. **Testing (in order):**
   - [ ] Place COD order → Should go to PetPooja immediately ✅
   - [ ] Place ONLINE order → Payment link opens
   - [ ] Complete payment on BillDesk
   - [ ] Check Firestore: `orders` collection → `petpooja_synced: true` ✅
   - [ ] Check POS: Order appears with payment_type: "ONLINE" ✅
   - [ ] Check logs: Webhook auto-sync message appears OR polling triggers sync

4. **Production:**
   - [ ] Update `.env` on server with correct BillDesk credentials
   - [ ] Change `BILLDESK_BASE_URL` to production: `https://api.billdesk.com`
   - [ ] Change `NODE_ENV` to `production`
   - [ ] Test with whitelisted domain `api.gutmantra.in`

---

## VERIFICATION LOGS

**Expected console output on successful online order:**

```
✅ All items have valid base_id
💳 PAYMENT MODE: ONLINE
🔗 ENDPOINT: https://api.gutmantra.in/api/orders/create-order
✅ BillDesk order created: { orderid: "ORD-...", payment_link: "https://..." }
📡 Starting payment status polling for: ORD-...
[Poll 1/150] Payment status: null
[Poll 2/150] Payment status: 0300
✅ Payment successful! Triggering PetPooja sync...
PetPooja sync response: { success: true, petpooja_order_id: "..." }
```

**Expected server logs:**

```
[BillDesk] Order created: ORD-... → OAFC...
[WEBHOOK] 🔄 Payment successful. Auto-syncing order ORD-... to PetPooja...
[WEBHOOK] ✅ Auto-synced to PetPooja: [petpooja-order-id]
[PetPooja Sync] ✅ Order ORD-... synced to PetPooja (ID: [id])
```

---

## KEY POINTS

✅ **PetPooja payload is EXACTLY the same** — only `payment_type` and `collect_cash` change  
✅ **Webhook triggers auto-sync** (primary)  
✅ **Frontend polling triggers sync** (fallback)  
✅ **Offline (COD) flow completely unchanged**  
✅ **No existing logic hampered**  
✅ **Prevents duplicate orders** with `petpooja_synced` flag  

---

**Copy-paste this entire file and share with Claude Code for implementation.**
