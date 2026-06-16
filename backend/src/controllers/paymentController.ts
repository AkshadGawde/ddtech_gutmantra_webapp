import { Request, Response } from "express";
import { validateCoupon } from "../services/couponService.js";
import { geocodeAddress } from "../services/deliveryService.js";
import { createPetpoojaOrder } from "../services/petpoojaService.js";
import { createOrder as billDeskCreateOrder } from "../utils/billdesk.js";
import {
  createOrderRecord,
  getOrderById,
  updateOrderRecord,
  OrderCreatePayload,
} from "../services/orderService.js";
import { BillDeskRequest } from "../middleware/verifyBilldesk.js";
import { Money } from "../utils/money.js";
import { sendPurchaseEvent } from "../utils/fbConversions.js";

function getUserId(orderId: string, providedUserId?: unknown) {
  if (typeof providedUserId === "string" && orderId.startsWith(providedUserId)) {
    return providedUserId.trim();
  }

  return String(orderId.split("_")[0] || "guest");
}

function buildFullAddress(address: any): string {
  return [
    address.streetAddress,
    address.apartment,
    address.city,
    address.state,
    address.pinCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ")
    .trim();
}

export async function createOrder(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log("📦 createOrder request:", JSON.stringify(body, null, 2));

    const orderId = String(body.orderID || body.orderId || "").trim();

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderID",
      });
    }

    const paymentMode = body.paymentMode === "ONLINE" ? "ONLINE" : "COD";
    const userId = getUserId(orderId, body.userId);

    const shippingAddress = body.shippingAddress;
    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pinCode) {
      return res.status(400).json({
        success: false,
        message: "shippingAddress is invalid or incomplete",
      });
    }

    shippingAddress.fullAddress = shippingAddress.fullAddress || buildFullAddress(shippingAddress);

    if (!shippingAddress.fullAddress) {
      return res.status(400).json({
        success: false,
        message: "Full address is required",
      });
    }

    const geocodeResult = await geocodeAddress(
      shippingAddress.streetAddress,
      shippingAddress.apartment,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.pinCode,
      shippingAddress.country
    );

    if (!geocodeResult.isDeliverable) {
      return res.status(400).json({
        success: false,
        message: geocodeResult.message,
      });
    }

    const deliveryCharge = geocodeResult.deliveryCharge;
    const deliveryDistanceKm = geocodeResult.distanceKm;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    const items = body.items.map((item: any) => {
      // item.productId = parent Petpooja itemid (Firestore doc ID = Petpooja itemid)
      // item.base_id   = variant's sku (may be variationid when item has variations)
      const parentItemId = item.productId
        ? String(item.productId)
        : item.base_id || item.sku || (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : "");

      const variantId = item.base_id || item.sku || "";

      // Only store a variation_id when it is distinct from the parent item ID.
      // petpoojaService will then use variationid as the itemid (Petpooja expects
      // variationid for variable items, parent itemid for simple items).
      const variationId = variantId && variantId !== parentItemId ? variantId : "";

      if (!parentItemId) {
        throw new Error(`Missing base_id or sku for item ${item.name || "unknown"}`);
      }

      return {
        id: String(parentItemId),
        variation_id: variationId,
        name: item.name,
        price: String(item.price),
        quantity: String(item.quantity),
        tax_inclusive: true,
        gst_liability: "restaurant",
        item_tax: [],
        item_discount: "0",
        final_price: String(item.price),
        description: "",
        variation_name: "",
        AddonItem: { details: [] },
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * parseInt(item.quantity, 10),
      0
    );

    if (subtotal < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum order value is ₹500. Please add more items to your cart.",
      });
    }

    let discount = 0;
    const couponCode = body.couponCode;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, subtotal, userId);
      discount = validation.discount;
    }

    // Free delivery for orders ≥₹799 (based on pre-discount subtotal)
    const effectiveDeliveryCharge = subtotal >= 799 ? 0 : deliveryCharge;
    const finalAmount = Math.max(0, subtotal - discount + effectiveDeliveryCharge);

    const orderPayload: OrderCreatePayload = {
      orderId,
      userId,
      paymentMode,
      shippingAddress,
      items,
      subtotal,
      discount,
      deliveryCharge: effectiveDeliveryCharge,
      finalAmount,
      deliveryDistanceKm,
      couponCode: couponCode || null,
    };

    await createOrderRecord(orderPayload);
    console.log(`✅ Firestore order created: ${orderId} (${paymentMode})`);

    if (paymentMode === "COD") {
      const petpoojaResult = await createPetpoojaOrder({
        orderId,
        shippingAddress,
        items,
        subtotal,
        discount,
        deliveryCharge: effectiveDeliveryCharge,
        finalAmount,
        deliveryDistanceKm,
        couponCode: couponCode || null,
        paymentMode: "COD",
      });

      if (!petpoojaResult.success) {
        await updateOrderRecord(orderId, {
          paymentStatus: "payment_failed",
          orderStatus: "PAYMENT_FAILED",
          petpoojaResponse: petpoojaResult.data,
        });

        return res.status(500).json({
          success: false,
          message: "Petpooja COD order failed",
          petpooja: petpoojaResult.data,
        });
      }

      await updateOrderRecord(orderId, {
        petpoojaID: petpoojaResult.clientOrderID,
        petpoojaResponse: petpoojaResult.data,
      });

      // Fire FB Conversions API (non-blocking)
      // TODO: body.fbEventId matches the pixel Purchase eventID sent from the frontend for deduplication
      sendPurchaseEvent({
        orderId,
        eventId: body.fbEventId || orderId,
        value: finalAmount,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        ip: req.headers['x-forwarded-for'] as string || req.ip,
        userAgent: req.headers['user-agent'],
        sourceUrl: 'https://gutmantra.in/checkout',
      }).catch(() => {});

      return res.json({
        success: true,
        orderId,
        paymentMode,
        petpooja: petpoojaResult.data,
      });
    }

    return res.json({
      success: true,
      orderId,
      paymentMode,
      message: "Order created and awaiting online payment",
    });
  } catch (error) {
    console.error("❌ createOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: String(error),
    });
  }
}

export async function createOnlineOrder(req: Request, res: Response) {
  try {
    const { orderId, amount, customerEmail, customerPhone } = req.body;

    console.log("💰 createOnlineOrder request:", JSON.stringify(req.body, null, 2));

    if (!orderId || !amount || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment initialization fields",
      });
    }

    const orderData = await getOrderById(String(orderId));

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderData.paymentStatus !== "payment_pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not eligible for online payment",
        paymentStatus: orderData.paymentStatus,
      });
    }

    const expectedAmount = Number(orderData.finalAmount ?? orderData.total ?? 0);
    const requestedAmount = Number(amount);

    if (!Money.fromRupees(expectedAmount).equals(Money.fromRupees(requestedAmount))) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
        expectedAmount,
        requestedAmount,
      });
    }

    const BILLDESK_RETURN_URL = process.env.BILLDESK_RETURN_URL || "https://api.gutmantra.in/api/billdesk/callback";
    const MERCHANT_ID = process.env.BILLDESK_MERCHANT_ID || "KANAKV2";

    // Call real BillDesk API — get bdorderid + rdata generated by BillDesk
    const bdResult = await billDeskCreateOrder({
      orderId: String(orderId),
      amount: Number(requestedAmount).toFixed(2),
      currency: "356",
      itemCode: "DIRECT",
      redirectUrl: BILLDESK_RETURN_URL,
      buyerEmail: customerEmail,
      buyerPhone: String(customerPhone).replace(/\D/g, ""),
    });

    console.log("✅ BillDesk createOrder response:", JSON.stringify(bdResult, null, 2));

    if (!bdResult.bdorderid || !bdResult.rdata) {
      console.error("❌ BillDesk createOrder returned invalid response", bdResult);
      return res.status(500).json({
        success: false,
        message: "Payment initialization failed — BillDesk did not return order details",
      });
    }

    // Payment URL: use payment_link from BillDesk if available, else build from base URL
    const BASE_URL = process.env.BILLDESK_BASE_URL || "https://uat1.billdesk.com/u2";
    const paymentUrl = bdResult.payment_link || `${BASE_URL}/payments/ve1_2/pgui/pay`;

    await updateOrderRecord(orderId, {
      bdorderid: bdResult.bdorderid,
      billdeskRequest: {
        bdorderid: bdResult.bdorderid,
        traceId: bdResult.trace_id,
        paymentUrl,
        createdAt: new Date(),
      },
    });

    return res.json({
      success: true,
      orderId,
      paymentMode: orderData.paymentMode,
      next_step: "redirect",
      links: [
        {
          rel: "redirect",
          method: "POST",
          href: paymentUrl,
          parameters: {
            mercid: MERCHANT_ID,
            bdorderid: bdResult.bdorderid,
            rdata: bdResult.rdata,
          },
        },
      ],
    });
  } catch (error) {
    console.error("❌ createOnlineOrder failed:", error);
    return res.status(500).json({
      success: false,
      message: "Payment initialization failed",
      error: String(error),
    });
  }
}

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://gutmantra.in";

function redirectCustomer(res: Response, orderId: string) {
  return res.redirect(302, `${FRONTEND_BASE_URL}/payment-processing?orderId=${encodeURIComponent(orderId)}`);
}

export async function billdeskCallback(req: BillDeskRequest, res: Response) {
  try {
    console.log("📥 BillDesk callback body:", JSON.stringify(req.body, null, 2));
    console.log("📥 BillDesk callback headers:", JSON.stringify(req.headers, null, 2));

    const body = req.body;

    // BillDesk returns our orderid (internal), bdorderid (theirs), transactionid, auth_status
    const orderId = String(
      body.orderid || body.order_id || body.merchantOrderId || body.orderId || ""
    ).trim();
    const transactionId = String(
      body.transactionid || body.transaction_id || body.txnid || ""
    ).trim();
    const authStatus = String(body.auth_status || body.status || "").trim();
    const callbackAmount = Number(body.amount ?? body.txnAmount ?? 0);

    console.log(`📥 Parsed → orderId=${orderId} txn=${transactionId} auth_status=${authStatus}`);

    if (!orderId) {
      console.error("❌ Missing orderId in BillDesk callback", body);
      return res.redirect(302, `${FRONTEND_BASE_URL}/?payment=error`);
    }

    const orderData = await getOrderById(orderId);

    if (!orderData) {
      console.error(`❌ Callback for unknown order ${orderId}`);
      return res.redirect(302, `${FRONTEND_BASE_URL}/?payment=error`);
    }

    if (orderData.paymentStatus !== "payment_pending") {
      console.log(`⏭️ Duplicate callback for order ${orderId}, status already=${orderData.paymentStatus}`);
      return redirectCustomer(res, orderId);
    }

    const expectedAmount = Number(orderData.finalAmount ?? orderData.total ?? 0);
    if (callbackAmount > 0 && !Money.fromRupees(expectedAmount).equals(Money.fromRupees(callbackAmount))) {
      console.error(`❌ Amount mismatch for ${orderId}: expected ${expectedAmount}, got ${callbackAmount}`);
      await updateOrderRecord(orderId, {
        paymentStatus: "payment_failed",
        orderStatus: "PAYMENT_FAILED",
        paymentResponse: body,
        billdeskTransactionId: transactionId,
        failureReason: "Amount mismatch",
      });
      return redirectCustomer(res, orderId);
    }

    // BillDesk success = auth_status "0300"
    const success = authStatus === "0300" || authStatus.toUpperCase() === "SUCCESS";

    if (!success) {
      const failedState = authStatus.includes("CANCEL") || authStatus === "0001"
        ? "payment_cancelled"
        : "payment_failed";

      console.log(`❌ Payment failed for order ${orderId}: auth_status=${authStatus}`);
      await updateOrderRecord(orderId, {
        paymentStatus: failedState,
        payment_status: authStatus,   // raw code for polling
        orderStatus: "PAYMENT_FAILED",
        paymentResponse: body,
        billdeskTransactionId: transactionId,
        bdorderid: String(body.bdorderid || ""),
      });
      return redirectCustomer(res, orderId);
    }

    console.log(`✅ Payment success for order ${orderId} (auth_status=${authStatus})`);

    const petpoojaOrder = await createPetpoojaOrder({
      orderId,
      shippingAddress: orderData.shippingAddress,
      items: orderData.items,
      subtotal: Number(orderData.subtotal ?? 0),
      discount: Number(orderData.discount ?? 0),
      deliveryCharge: Number(orderData.deliveryCharge ?? 0),
      finalAmount: Number(orderData.finalAmount ?? orderData.total ?? 0),
      deliveryDistanceKm: Number(orderData.deliveryDistanceKm ?? 0),
      couponCode: orderData.couponCode,
      paymentMode: "ONLINE",
    });

    if (!petpoojaOrder.success) {
      console.error("❌ Petpooja sync failed after payment success", petpoojaOrder);
      await updateOrderRecord(orderId, {
        paymentStatus: "payment_success",
        orderStatus: "PAYMENT_SUCCESS",
        petpoojaSyncStatus: "failed",
        paymentResponse: body,
        billdeskTransactionId: transactionId,
        bdorderid: String(body.bdorderid || ""),
        petpoojaResponse: petpoojaOrder.data,
      });
      return redirectCustomer(res, orderId);
    }

    await updateOrderRecord(orderId, {
      paymentStatus: "payment_success",
      payment_status: "0300",       // raw BillDesk code — used by polling
      orderStatus: "PLACED",
      billdeskTransactionId: transactionId,
      bdorderid: String(body.bdorderid || ""),
      authCode: String(body.authcode || ""),
      bankRefNo: String(body.bank_ref_no || ""),
      rrn: String(body.rrn || ""),
      paymentResponse: body,
      petpoojaID: petpoojaOrder.clientOrderID,
      petpoojaResponse: petpoojaOrder.data,
      paidAt: new Date(),
    });

    console.log(`✅ Order ${orderId} placed and synced to Petpooja`);
    return redirectCustomer(res, orderId);
  } catch (error) {
    console.error("❌ BillDesk callback error:", error);
    return res.status(500).send("ERROR");
  }
}
