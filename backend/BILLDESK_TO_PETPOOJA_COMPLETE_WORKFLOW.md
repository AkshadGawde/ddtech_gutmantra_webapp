# Complete BillDesk → PetPooja Workflow

## STEP-BY-STEP FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE PAYMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: FRONTEND INITIATES ORDER (User clicks "Place Order" - ONLINE)
└─ Frontend sends: POST /api/orders/create-order
   Payload: { userid, items, shippingAddress, payment_type: "ONLINE", ... }
   
STEP 2: BACKEND CREATES BILLDESK ORDER
└─ Backend calls: BillDesk Create Order API
   └─ BillDesk returns: { bdorderid: "OAFC...", payment_link: "https://..." }
   └─ Backend stores in Firestore:
      ├─ orderid: "ORD-1779949..."
      ├─ bdorderid: "OAFC..."
      ├─ items: [ { base_id, name, price, quantity } ]
      ├─ shippingAddress: { firstName, lastName, phone, email, fullAddress, latitude, longitude }
      ├─ payment_type: "ONLINE"
      ├─ payment_status: null (waiting for payment)
      ├─ petpooja_synced: false
      └─ status: "created"

STEP 3: FRONTEND OPENS PAYMENT GATEWAY
└─ Frontend receives payment_link
└─ Opens BillDesk payment page in popup
└─ User enters card details and completes payment

STEP 4: BILLDESK PROCESSES PAYMENT (Happens on BillDesk servers)
└─ User submits payment
└─ BillDesk validates card
└─ Payment succeeds (or fails)
└─ BillDesk records: transactionid, auth_status, authcode, etc.

STEP 5A: BILLDESK SENDS WEBHOOK TO YOUR BACKEND [PRIMARY]
└─ BillDesk POSTs to: https://api.gutmantra.in/api/billdesk/callback
   Payload: {
     "transactionid": "TXN20260528001",
     "bdorderid": "OAFC20260528001",
     "orderid": "ORD-1779949...",
     "auth_status": "0300",           ← 0300 = SUCCESS, 0399 = FAILED
     "authcode": "123456",
     "bank_ref_no": "BANK123",
     "rrn": "RRN123456",
     "amount": "349.00",
     "status": "success"
   }

STEP 5B: FRONTEND POLLS FOR PAYMENT STATUS [FALLBACK]
└─ Frontend polls every 3 seconds: GET /api/orders/status/:orderid
   └─ Backend returns: { order: { payment_status, status, ... } }
   └─ Frontend keeps polling until payment_status = "0300" or "0399"

STEP 6: BACKEND WEBHOOK HANDLER PROCESSES PAYMENT
┌──────────────────────────────────────────────────────────────────┐
│ Endpoint: POST /api/billdesk/callback                            │
│ File: /src/routes/billdesk-webhook.routes.ts                    │
└──────────────────────────────────────────────────────────────────┘

Handler flow:
├─ Receives webhook payload from BillDesk
├─ Extracts: transactionid, bdorderid, auth_status
├─ Verifies auth_status
│  └─ If "0300" → Payment SUCCESSFUL
│  └─ If "0399" → Payment FAILED
├─ Updates Firestore /orders/{orderid}:
│  ├─ payment_status: "0300"
│  ├─ status: "completed"
│  └─ updatedAt: timestamp
├─ If auth_status === "0300":
│  └─ Calls: syncOrderToPetpooja(orderid)  [PRIMARY SYNC]
└─ Returns: { received: true, status: 200 }

STEP 7: BACKEND SYNCS ORDER TO PETPOOJA [PRIMARY - Webhook triggered]
┌──────────────────────────────────────────────────────────────────┐
│ Function: syncOrderToPetpooja(orderid)                           │
│ File: /src/routes/billdeskRoutes.ts                             │
│ Called by: Webhook handler (primary) OR Frontend polling (fallback) │
└──────────────────────────────────────────────────────────────────┘

Sync flow:
├─ Fetch order from Firestore: /orders/{orderid}
├─ Verify payment_status === "0300" (must be successful)
├─ Check idempotency: if petpooja_synced === true, skip (already synced)
├─ Build PetPooja payload (EXACT structure):
│  {
│    "app_key": "PETPOOJA_APP_KEY",
│    "app_secret": "PETPOOJA_APP_SECRET",
│    "access_token": "PETPOOJA_ACCESS_TOKEN",
│    "orderinfo": {
│      "OrderInfo": {
│        "Restaurant": {
│          "details": {
│            "restID": "nb4xiadc",
│            "res_name": "GutMantra",
│            "address": "Pune"
│          }
│        },
│        "Customer": {
│          "details": {
│            "name": "Tarun Gawde",
│            "phone": "9820141554",
│            "email": "gutmantra24@gmail.com",
│            "address": "C1-B 704, Brooklyn, Pride World City Pune, Pune, Maharashtra, 412105, India",
│            "latitude": "18.6213534",
│            "longitude": "73.9168518"
│          }
│        },
│        "Order": {
│          "details": {
│            "orderID": "ORD-1779949...",
│            "payment_type": "ONLINE",        ← ONLINE (not COD)
│            "collect_cash": "0",             ← 0 for ONLINE (amount for COD)
│            "total": "349.00",
│            "created_on": "2026-05-28 12:00:34",
│            ... (other fields unchanged)
│          }
│        },
│        "OrderItem": {
│          "details": [
│            {
│              "itemid": "1255512511",
│              "name": "Kanak - Multigrain Atta (500 Gram)",
│              "quantity": 2,
│              "item_price": "65"
│            },
│            ...
│          ]
│        },
│        "Tax": { "details": [] },
│        "Discount": { "details": [] }
│      },
│      "callback_url": "https://api.gutmantra.in/api/webhook",
│      "device_type": "Web"
│    }
│  }
├─ POST to PetPooja: https://pponlineordercb.petpooja.com/save_order
├─ Verify PetPooja response: { status: 1, order_id: "..." }
├─ Update Firestore /orders/{orderid}:
│  ├─ petpooja_synced: true
│  ├─ petpooja_order_id: "PetPooja-Order-ID"
│  ├─ status: "synced_to_petpooja"
│  └─ synced_at: timestamp
└─ Return: { success: true, petpooja_order_id: "..." }

STEP 8: FRONTEND POLLING DETECTS PAYMENT [FALLBACK]
├─ Frontend polling loop detects payment_status === "0300"
├─ Frontend calls: POST /api/orders/sync-to-petpooja/{orderid} [FALLBACK]
│  └─ Backend checks: if petpooja_synced === true, returns "already synced"
│  └─ (No duplicate sync due to idempotency flag)
├─ Frontend shows success message
└─ Frontend clears cart and navigates to /success

STEP 9: ORDER APPEARS ON POS DASHBOARD
└─ PetPooja processes the order
└─ Restaurant sees order on POS dashboard with:
   ├─ Order ID: ORD-1779949...
   ├─ Payment Type: ONLINE (paid)
   ├─ Customer: Tarun Gawde
   ├─ Items: Atta x2, Dhaniya x1
   ├─ Total: ₹349.00
   └─ Status: Ready for preparation
```

---

## WHAT BILLDESK SENDS (Webhook Payload)

**When payment is SUCCESSFUL:**

```json
{
  "transactionid": "TXN20260528001",
  "bdorderid": "OAFC20260528001",
  "orderid": "ORD-1779949200123",
  "auth_status": "0300",
  "authcode": "123456",
  "bank_ref_no": "BANK123456",
  "rrn": "RRN123456",
  "amount": "349.00",
  "status": "success"
}
```

**When payment FAILS:**

```json
{
  "transactionid": "TXN20260528002",
  "bdorderid": "OAFC20260528002",
  "orderid": "ORD-1779949200124",
  "auth_status": "0399",
  "authcode": "DECLINED",
  "status": "failed"
}
```

---

## WHAT YOUR SERVER RECEIVES & VERIFIES

### In `/src/routes/billdesk-webhook.routes.ts` → `/callback` endpoint

```typescript
router.post('/callback', async (req: Request, res: Response) => {
  // ────────────────────────────────────────────────────────────
  // STEP 1: EXTRACT PAYLOAD FROM BILLDESK
  // ────────────────────────────────────────────────────────────
  const payload = req.body;
  const {
    transactionid,
    bdorderid,
    orderid,
    auth_status,        // ← CRITICAL: 0300 = success, 0399 = failed
    authcode,
    bank_ref_no,
    rrn,
    amount,
    status,
  } = payload;

  console.log('[WEBHOOK] Received from BillDesk:', {
    transactionid,
    bdorderid,
    auth_status,
    amount,
  });

  // ────────────────────────────────────────────────────────────
  // STEP 2: VERIFY SIGNATURE (Optional - Add if needed)
  // ────────────────────────────────────────────────────────────
  // const signature = req.headers['x-billdesk-signature'];
  // const expectedSignature = crypto
  //   .createHmac('sha256', MERCHANT_KEY)
  //   .update(JSON.stringify(payload))
  //   .digest('hex');
  // if (signature !== expectedSignature) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  // ────────────────────────────────────────────────────────────
  // STEP 3: UPDATE FIRESTORE WITH PAYMENT STATUS
  // ────────────────────────────────────────────────────────────
  const db = getFirestoreDb();
  
  // Update transaction record
  await db.collection('transactions').doc(transactionid).update({
    transactionid,
    bdorderid,
    auth_status,         // ← Store payment status
    authcode,
    bank_ref_no,
    rrn,
    amount,
    webhook_received_at: new Date(),
  });

  // Update order status
  const orderStatus = auth_status === '0300' ? 'completed' : 'failed';
  const orderDoc = await db.collection('orders')
    .where('bdorderid', '==', bdorderid)
    .limit(1)
    .get();

  if (!orderDoc.empty) {
    const orderId = orderDoc.docs[0].id;
    
    await db.collection('orders').doc(orderId).update({
      status: orderStatus,
      payment_status: auth_status,    // ← CRITICAL: 0300 or 0399
      authcode,
      bank_ref_no,
      updated_at: new Date(),
    });

    console.log(`[WEBHOOK] Order ${orderId} payment status: ${orderStatus}`);

    // ──────────────────────────────────────────────────────────
    // STEP 4: IF PAYMENT SUCCESSFUL, SYNC TO PETPOOJA (PRIMARY)
    // ──────────────────────────────────────────────────────────
    if (auth_status === '0300') {
      console.log(`[WEBHOOK] 🔄 Payment successful! Auto-syncing to PetPooja...`);
      
      try {
        const syncResponse = await fetch(
          `http://localhost:5000/api/orders/sync-to-petpooja/${orderId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const syncData = await syncResponse.json();
        
        if (syncData.success) {
          console.log(`[WEBHOOK] ✅ Synced to PetPooja: ${syncData.petpooja_order_id}`);
        } else {
          console.warn(`[WEBHOOK] ⚠️ PetPooja sync failed: ${syncData.error}`);
          // Frontend polling will retry as fallback
        }
      } catch (err) {
        console.error('[WEBHOOK] Error syncing to PetPooja:', err);
        // Frontend polling will retry as fallback
      }
    } else {
      console.log(`[WEBHOOK] ❌ Payment failed: ${auth_status}`);
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 5: ALWAYS RETURN 200 OK (Don't let BillDesk retry)
  // ────────────────────────────────────────────────────────────
  res.status(200).json({
    received: true,
    transactionid,
    processed_at: new Date().toISOString(),
  });
});
```

---

## HOW SERVER CREATES ORDER AT PETPOOJA

### In `/src/routes/billdeskRoutes.ts` → `/sync-to-petpooja/:orderid`

```typescript
router.post('/sync-to-petpooja/:orderid', async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;

    // ────────────────────────────────────────────────────────────
    // STEP 1: FETCH ORDER FROM FIRESTORE
    // ────────────────────────────────────────────────────────────
    const orderDoc = await getFirestoreDb()
      .collection('orders')
      .doc(orderid)
      .get();

    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData = orderDoc.data();

    console.log('[PetPooja Sync] Fetched order:', {
      orderid,
      payment_status: orderData?.payment_status,
      petpooja_synced: orderData?.petpooja_synced,
    });

    // ────────────────────────────────────────────────────────────
    // STEP 2: VERIFY PAYMENT WAS SUCCESSFUL
    // ────────────────────────────────────────────────────────────
    if (orderData?.payment_status !== '0300') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        payment_status: orderData?.payment_status,
      });
    }

    console.log('[PetPooja Sync] ✅ Payment verified: auth_status = 0300');

    // ────────────────────────────────────────────────────────────
    // STEP 3: CHECK IDEMPOTENCY (Prevent duplicate syncs)
    // ────────────────────────────────────────────────────────────
    if (orderData?.petpooja_synced) {
      console.log('[PetPooja Sync] Already synced. Skipping...');
      return res.json({
        success: true,
        message: 'Order already synced to PetPooja',
        petpooja_order_id: orderData?.petpooja_order_id,
      });
    }

    // ────────────────────────────────────────────────────────────
    // STEP 4: BUILD PETPOOJA PAYLOAD (EXACT STRUCTURE)
    // ────────────────────────────────────────────────────────────
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
              phone: orderData?.shippingAddress?.phone,
              email: orderData?.shippingAddress?.email,
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
              payment_type: "ONLINE",        // ← ONLINE (not COD)
              table_no: "",
              no_of_persons: "0",
              discount_total: "0.00",
              tax_total: "0.00",
              discount_type: "F",
              total: orderData?.amount,
              collect_cash: "0",             // ← 0 for ONLINE (amount for COD)
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
          Tax: { details: [] },
          Discount: { details: [] }
        },
        callback_url: "https://api.gutmantra.in/api/webhook",
        udid: "",
        device_type: "Web"
      }
    };

    console.log('[PetPooja Sync] 📤 Sending payload to PetPooja:', {
      orderID: orderid,
      itemCount: orderData?.items?.length,
      total: orderData?.amount,
      payment_type: "ONLINE"
    });

    // ────────────────────────────────────────────────────────────
    // STEP 5: SEND TO PETPOOJA API
    // ────────────────────────────────────────────────────────────
    const ppResponse = await fetch(
      process.env.PETPOOJA_CREATE_URL || 'https://pponlineordercb.petpooja.com/save_order',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petpoojaPayload),
      }
    );

    const ppData = await ppResponse.json();

    console.log('[PetPooja Sync] Response:', {
      status: ppResponse.status,
      petpooja_status: ppData?.status,
      order_id: ppData?.order_id,
    });

    // ────────────────────────────────────────────────────────────
    // STEP 6: VERIFY PETPOOJA ACCEPTED THE ORDER
    // ────────────────────────────────────────────────────────────
    if (!ppResponse.ok || ppData?.status !== 1) {
      console.error('[PetPooja Sync] ❌ Failed:', ppData);
      return res.status(400).json({
        success: false,
        error: 'PetPooja rejected order',
        details: ppData,
      });
    }

    // ────────────────────────────────────────────────────────────
    // STEP 7: UPDATE FIRESTORE - MARK AS SYNCED
    // ────────────────────────────────────────────────────────────
    await getFirestoreDb().collection('orders').doc(orderid).update({
      petpooja_synced: true,              // ← Idempotency flag
      petpooja_order_id: ppData?.order_id,
      petpooja_response: ppData,
      synced_at: new Date(),
      status: 'synced_to_petpooja',
      updated_at: new Date(),
    });

    console.log(`[PetPooja Sync] ✅ SUCCESS! Order synced.`);
    console.log(`   Firestore order: ${orderid}`);
    console.log(`   PetPooja order: ${ppData?.order_id}`);

    // ────────────────────────────────────────────────────────────
    // STEP 8: RETURN SUCCESS TO CALLER
    // ────────────────────────────────────────────────────────────
    return res.json({
      success: true,
      message: 'Order synced to PetPooja successfully',
      petpooja_order_id: ppData?.order_id,
    });

  } catch (error: any) {
    console.error('[PetPooja Sync] ❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Sync failed',
    });
  }
});
```

---

## DATA FLOW SUMMARY

```
BillDesk                    →    Your Backend              →    PetPooja
─────────────────────────────────────────────────────────────────────────

User pays                        Webhook receives           Receives order
     ↓                                ↓                            ↓
BillDesk processes               Updates Firestore          Creates order
payment (2-30 sec)               payment_status = "0300"     on POS
     ↓                                ↓                            ↓
Sends webhook POST          Calls syncOrderToPetpooja()  Returns order_id
to callback URL                        ↓                            ↓
{                            Builds PetPooja payload   Updates Firestore
 transactionid,             with payment_type="ONLINE"  petpooja_synced=true
 auth_status: "0300",       and collect_cash="0"
 ...                                 ↓
}                           POSTs to PetPooja API
                                   ↓
                            Verifies response
                                   ↓
                            Returns success
```

---

## Key Verification Points

✅ **Webhook signature verification** (optional but recommended)
✅ **Payment status check** (auth_status must be "0300")
✅ **Firestore validation** (order must exist)
✅ **Idempotency check** (prevent duplicate syncs)
✅ **PetPooja response validation** (status must be 1)
✅ **Firestore sync flag** (mark as synced to prevent re-syncing)

---

## Error Scenarios Handled

| Scenario | What Server Does |
|----------|------------------|
| Webhook arrives before polling | Webhook syncs → Polling detects already synced, skips |
| Webhook delayed | Polling syncs as fallback → Webhook retries, detects already synced |
| Payment fails (0399) | Updates Firestore, skips PetPooja sync |
| PetPooja temporarily down | Webhook fails, Frontend polling retries |
| Duplicate webhook from BillDesk | Idempotency flag prevents duplicate PetPooja orders |
| Network connection drops mid-sync | Polling fallback kicks in and retries |

