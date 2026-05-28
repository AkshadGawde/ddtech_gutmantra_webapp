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
 * Step 1: Create order in BillDesk and store in Firestore
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { userid, items, paymentmethod, buyerEmail, buyerPhone } = req.body;

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

    // Store order in Firestore
    await getFirestoreDb().collection('orders').doc(orderid).set({
      orderid,
      userid,
      bdorderid: billDeskResponse.bdorderid,
      amount,
      currency: '356',
      status: 'created',
      items,
      paymentmethod,
      buyerEmail,
      buyerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
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
 * Step 2: Create transaction (initiate payment)
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
 * Step 3: Update transaction with 3DS2/OTP response
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
 * GET /api/orders/:orderid
 * Get complete order details
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
