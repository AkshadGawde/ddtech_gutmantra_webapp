import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { syncOrderToPetpooja } from './billdeskRoutes.js';

const router = express.Router();

/**
 * DEBUG WEBHOOK - Logs everything from BillDesk
 * This helps us understand the actual payload structure and headers
 * Remove logging and implement verification once we see real data
 */
router.post('/debug', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();

    // Log EVERYTHING for analysis
    const webhookDebug = {
      timestamp,
      headers: req.headers,
      body: req.body,
      query: req.query,
      method: req.method,
      url: req.originalUrl,
      remoteIp: req.ip,
    };

    console.log('=== BILLDESK WEBHOOK DEBUG ===');
    console.log(JSON.stringify(webhookDebug, null, 2));
    console.log('==============================');

    // Store in Firestore for later analysis
    await getFirestoreDb().collection('webhooks_debug').doc(`billdesk_${timestamp}`).set(webhookDebug);

    // Always return 200 OK so BillDesk doesn't retry
    res.status(200).json({ received: true, timestamp });
  } catch (error) {
    console.error('Debug webhook error:', error);
    res.status(200).json({ error: 'Logged' });
  }
});

/**
 * PRODUCTION WEBHOOK - Verify & Process
 * Implement once we know actual BillDesk webhook structure
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    // STEP 1: Extract potential signature from common header names
    const possibleSignatureHeaders = [
      'x-billdesk-signature',
      'x-signature',
      'billdesk-signature',
      'bd-signature',
      'authorization',
    ];

    let signature: string | undefined;
    let signatureHeader: string | undefined;

    for (const header of possibleSignatureHeaders) {
      if (req.headers[header]) {
        signature = req.headers[header] as string;
        signatureHeader = header;
        break;
      }
    }

    console.log(`[WEBHOOK] Signature Header: ${signatureHeader}, Value: ${signature ? signature.substring(0, 20) + '...' : 'NONE'}`);

    // STEP 2: Extract transaction details (these are common across payment gateways)
    const payload = req.body;
    const {
      transactionid,
      bdorderid,
      orderid,
      auth_status,
      authcode,
      bank_ref_no,
      rrn,
      amount,
      status,
    } = payload;

    console.log(`[WEBHOOK] Processing: txnid=${transactionid}, bdorderid=${bdorderid}, status=${auth_status || status}`);

    // STEP 3: Verify signature if present
    if (signature && signatureHeader) {
      const merchantKey = process.env.BILLDESK_MERCHANT_KEY || 'to8pJnluXU43FPzhC2P2YLlbmylW4NEm';

      // Try common signature methods
      const payloadString = JSON.stringify(payload);

      // Method 1: HMAC-SHA256 (most common)
      const expectedSignatureSha256 = crypto
        .createHmac('sha256', merchantKey)
        .update(payloadString)
        .digest('hex');

      // Method 2: HMAC-SHA1
      const expectedSignatureSha1 = crypto
        .createHmac('sha1', merchantKey)
        .update(payloadString)
        .digest('hex');

      // Method 3: HMAC-SHA256 base64
      const expectedSignatureSha256Base64 = crypto
        .createHmac('sha256', merchantKey)
        .update(payloadString)
        .digest('base64');

      const cleanSignature = signature.replace('Bearer ', '').trim();
      const isValidSha256 = cleanSignature === expectedSignatureSha256;
      const isValidSha1 = cleanSignature === expectedSignatureSha1;
      const isValidSha256Base64 = cleanSignature === expectedSignatureSha256Base64;

      if (isValidSha256) {
        console.log('[WEBHOOK] ✅ Signature verified: HMAC-SHA256 (hex)');
      } else if (isValidSha1) {
        console.log('[WEBHOOK] ✅ Signature verified: HMAC-SHA1 (hex)');
      } else if (isValidSha256Base64) {
        console.log('[WEBHOOK] ✅ Signature verified: HMAC-SHA256 (base64)');
      } else {
        console.warn('[WEBHOOK] ⚠️ Signature verification failed');
        console.warn(`Expected (SHA256): ${expectedSignatureSha256}`);
        console.warn(`Received: ${cleanSignature}`);
      }
    } else {
      console.warn('[WEBHOOK] ⚠️ No signature found in request headers');
    }

    // STEP 4: Update Firestore
    if (transactionid && bdorderid) {
      const transactionUpdate = {
        transactionid,
        bdorderid,
        auth_status: auth_status || status,
        authcode,
        bank_ref_no,
        rrn,
        amount,
        webhook_received_at: new Date(),
        webhook_payload: payload,
      };

      // Update transaction document
      const db = getFirestoreDb();
      await db.collection('transactions').doc(transactionid).update(transactionUpdate);

      // Update associated order status
      const orderDoc = await db.collection('orders').where('bdorderid', '==', bdorderid).limit(1).get();
      if (!orderDoc.empty) {
        const orderId = orderDoc.docs[0].id;

        const orderStatus = auth_status === '0300' ? 'completed' : 'failed';
        await db.collection('orders').doc(orderId).update({
          status: orderStatus,
          updated_at: new Date(),
          payment_status: auth_status,
        });

        console.log(`[WEBHOOK] ✅ Updated order ${orderId} to status: ${orderStatus}`);

        // AUTO-SYNC TO PETPOOJA ON SUCCESSFUL PAYMENT
        if (auth_status === '0300') {
          console.log(`[WEBHOOK] 🔄 Payment success — auto-syncing order ${orderId} to PetPooja...`);
          try {
            // Mark payment_status so syncOrderToPetpooja can proceed
            await db.collection('orders').doc(orderId).update({ payment_status: '0300', updatedAt: new Date() });

            const syncResult = await syncOrderToPetpooja(orderId);
            if (syncResult.success) {
              console.log(`[WEBHOOK] ✅ Auto-synced to PetPooja: ${syncResult.petpooja_order_id}`);
            } else {
              console.warn(`[WEBHOOK] ⚠️ PetPooja sync failed: ${syncResult.error} — frontend polling will retry`);
            }
          } catch (syncErr) {
            console.error('[WEBHOOK] PetPooja sync error:', syncErr);
          }
        }
      }
    }

    // STEP 5: Always return 200 OK
    res.status(200).json({
      received: true,
      transactionid,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    // ALWAYS return 200 to prevent BillDesk retries
    res.status(200).json({ error: 'Processed with exception', timestamp: new Date().toISOString() });
  }
});

export default router;
