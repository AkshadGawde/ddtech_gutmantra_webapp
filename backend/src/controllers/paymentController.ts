import { Request, Response } from "express";
import { validateCoupon } from "../services/couponService.js";
import { geocodeAddress } from "../services/deliveryService.js";
import { createPetpoojaOrder } from "../services/petpoojaService.js";
import {
  buildBillDeskFormPayload,
  parseBillDeskCallback,
  isBillDeskSuccess,
} from "../services/billdeskService.js";
import {
  createOrderRecord,
  getOrderById,
  updateOrderRecord,
  OrderCreatePayload,
} from "../services/orderService.js";
import { BillDeskRequest } from "../middleware/verifyBilldesk.js";
import { Money } from "../utils/money.js";

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
      const baseId =
        item.base_id || item.sku || (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : "");
      const variationId = item.variation_id && item.variation_id !== item.base_id ? item.variation_id : "";

      if (!baseId) {
        throw new Error(`Missing base_id or sku for item ${item.name || "unknown"}`);
      }

      return {
        id: String(baseId),
        variation_id: variationId || "",
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

    let discount = 0;
    const couponCode = body.couponCode;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, subtotal, userId);
      discount = validation.discount;
    }

    const finalAmount = Math.max(0, subtotal - discount + deliveryCharge);

    const orderPayload: OrderCreatePayload = {
      orderId,
      userId,
      paymentMode,
      shippingAddress,
      items,
      subtotal,
      discount,
      deliveryCharge,
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
        deliveryCharge,
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

        return res.status(502).json({
          success: false,
          message: "Petpooja COD order failed",
          petpooja: petpoojaResult.data,
        });
      }

      await updateOrderRecord(orderId, {
        petpoojaID: petpoojaResult.clientOrderID,
        petpoojaResponse: petpoojaResult.data,
      });

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

    const billdeskResult = buildBillDeskFormPayload({
      orderId: String(orderId),
      amount: requestedAmount,
      customerEmail,
      customerPhone,
    });

    if (!billdeskResult.links || billdeskResult.links.length === 0) {
      console.error("❌ BillDesk form generation failed - no links returned");
      return res.status(500).json({
        success: false,
        message: "Payment initialization failed - invalid gateway response",
      });
    }

    const redirectLink = billdeskResult.links[0];

    if (!redirectLink.href || !redirectLink.parameters) {
      console.error("❌ BillDesk redirect link malformed:", redirectLink);
      return res.status(500).json({
        success: false,
        message: "Payment initialization failed - invalid redirect data",
      });
    }

    await updateOrderRecord(orderId, {
      billdeskRequest: {
        payload: redirectLink.parameters,
        paymentUrl: redirectLink.href,
        method: redirectLink.method,
        transactionToken: billdeskResult.transactionToken,
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
          method: redirectLink.method,
          href: redirectLink.href,
          parameters: redirectLink.parameters,
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

export async function billdeskCallback(req: BillDeskRequest, res: Response) {
  try {
    console.log("📥 BillDesk callback request:", JSON.stringify(req.body, null, 2));

    const callback = req.billdeskCallback ?? parseBillDeskCallback(req.body);

    if (!callback.orderId) {
      console.error("❌ Missing orderId in callback payload");
      return res.status(400).send("MISSING_ORDER_ID");
    }

    const orderData = await getOrderById(callback.orderId);

    if (!orderData) {
      console.error(`❌ BillDesk callback for unknown order ${callback.orderId}`);
      return res.status(404).send("ORDER_NOT_FOUND");
    }

    if (orderData.paymentStatus !== "payment_pending") {
      console.log(
        `⏭️ Ignoring callback for order ${callback.orderId} because paymentStatus=${orderData.paymentStatus}`
      );
      return res.status(200).send("IGNORED");
    }

    const expectedAmount = Number(orderData.finalAmount ?? orderData.total ?? 0);
    const callbackAmount = Number(callback.amount ?? 0);

    if (callbackAmount > 0 && !Money.fromRupees(expectedAmount).equals(Money.fromRupees(callbackAmount))) {
      console.error(
        `❌ BillDesk amount mismatch for order ${callback.orderId}: expected ${Money.fromRupees(expectedAmount)}, received ${Money.fromRupees(callbackAmount)}`
      );
      await updateOrderRecord(callback.orderId, {
        paymentStatus: "payment_failed",
        orderStatus: "PAYMENT_FAILED",
        paymentResponse: req.body,
        billdeskTransactionId: callback.transactionId,
        failureReason: "Amount mismatch",
      });
      return res.status(400).send("AMOUNT_MISMATCH");
    }

    const success = isBillDeskSuccess(callback.status);

    if (!success) {
      const failedState = callback.status?.toString().toUpperCase().includes("CANCEL")
        ? "payment_cancelled"
        : "payment_failed";

      console.log(`❌ BillDesk payment failed for order ${callback.orderId}:`, callback.status);
      await updateOrderRecord(callback.orderId, {
        paymentStatus: failedState,
        orderStatus: "PAYMENT_FAILED",
        paymentResponse: req.body,
        billdeskTransactionId: callback.transactionId,
      });
      return res.status(200).send("OK");
    }

    console.log(`✅ BillDesk payment success for order ${callback.orderId}`);

    const petpoojaOrder = await createPetpoojaOrder({
      orderId: callback.orderId,
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
      await updateOrderRecord(callback.orderId, {
        paymentStatus: "payment_success",
        orderStatus: "PAYMENT_SUCCESS",
        petpoojaSyncStatus: "failed",
        paymentResponse: req.body,
        billdeskTransactionId: callback.transactionId,
        petpoojaResponse: petpoojaOrder.data,
      });
      return res.status(500).send("PETPOOJA_SYNC_FAILED");
    }

    await updateOrderRecord(callback.orderId, {
      paymentStatus: "payment_success",
      orderStatus: "PLACED",
      billdeskTransactionId: callback.transactionId,
      paymentResponse: req.body,
      petpoojaID: petpoojaOrder.clientOrderID,
      petpoojaResponse: petpoojaOrder.data,
      paidAt: new Date(),
    });

    console.log(`✅ Order ${callback.orderId} marked paid and synced to Petpooja`);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ BillDesk callback error:", error);
    return res.status(500).send("ERROR");
  }
}
