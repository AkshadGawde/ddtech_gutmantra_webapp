const PP_CREATE_URL = process.env.PETPOOJA_CREATE_URL || "https://pponlineordercb.petpooja.com/save_order";
const PP_CANCEL_URL = process.env.PETPOOJA_CANCEL_URL || "https://pponlineordercb.petpooja.com/update_order_status";
const PP_APP_KEY = process.env.PETPOOJA_APP_KEY || "";
const PP_APP_SECRET = process.env.PETPOOJA_APP_SECRET || "";
const PP_ACCESS_TOKEN = process.env.PETPOOJA_ACCESS_TOKEN || "";
const PP_REST_ID = process.env.PETPOOJA_REST_ID || "";
const PP_CALLBACK_URL = process.env.PETPOOJA_CALLBACK_URL || "https://api.gutmantra.in/api/webhook";

if (!PP_APP_KEY || !PP_APP_SECRET || !PP_ACCESS_TOKEN || !PP_REST_ID) {

  console.warn("⚠️ Petpooja credentials missing — running in local/dev mode");

}

export interface PetpoojaOrderPayload {
  orderId: string;
  shippingAddress: any;
  items: Array<any>;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  finalAmount: number;
  deliveryDistanceKm: number;
  couponCode?: string | null;
  paymentMode: "ONLINE" | "COD";
}

export async function createPetpoojaOrder(order: PetpoojaOrderPayload) {
  const payload = {
    app_key: PP_APP_KEY,
    app_secret: PP_APP_SECRET,
    access_token: PP_ACCESS_TOKEN,
    orderinfo: {
      OrderInfo: {
        Restaurant: {
          details: {
            restID: PP_REST_ID,
            res_name: "GutMantra",
            address: "Pune",
          },
        },
        Customer: {
          details: {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim(),
            phone: order.shippingAddress.phone,
            email: order.shippingAddress.email,
            address: order.shippingAddress.fullAddress,
            latitude: String(order.shippingAddress.latitude || ""),
            longitude: String(order.shippingAddress.longitude || ""),
          },
        },
        Order: {
          details: {
            orderID: order.orderId,
            preorder_date: "",
            preorder_time: "",
            service_charge: "0",
            sc_tax_amount: "0",
            delivery_charges: String(order.deliveryCharge.toFixed(2)),
            dc_tax_percentage: "0",
            dc_tax_amount: "0",
            dc_gst_details: [
              {
                gst_liable: "restaurant",
                amount: "0",
              },
            ],
            packing_charges: "0",
            pc_tax_amount: "0",
            pc_tax_percentage: "0",
            pc_gst_details: [
              {
                gst_liable: "restaurant",
                amount: "0",
              },
            ],
            order_type: "H",
            created_on: new Date().toISOString().replace("T", " ").split(".")[0],
            enable_delivery: 1,
            min_prep_time: 20,
            advanced_order: "N",
            urgent_order: false,
            urgent_time: 20,
            payment_type: order.paymentMode === "ONLINE" ? "ONLINE" : "COD",
            table_no: "",
            no_of_persons: "0",
            discount_total: String(order.discount.toFixed(2)),
            tax_total: "0.00",
            discount_type: "F",
            total: String(order.finalAmount.toFixed(2)),
            collect_cash:
              order.paymentMode === "ONLINE"
                ? "0"
                : String(order.finalAmount.toFixed(2)),
            otp: "1234",
            description: "",
          },
        },
        OrderItem: {
          details: order.items,
        },
        Tax: {
          details: [],
        },
        Discount: {
          details: [],
        },
      },
      callback_url: PP_CALLBACK_URL,
      udid: "",
      device_type: "Web",
    },
  };

  console.log("🚀 Petpooja request payload:", JSON.stringify(payload, null, 2));

  const resp = await fetch(PP_CREATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await parseJsonSafely(resp);

  console.log("📡 Petpooja response:", responseBody);

  const success = resp.status === 200 && responseBody?.success === "1";

  return {
    success,
    status: resp.status,
    data: responseBody,
    clientOrderID: responseBody?.clientOrderID || responseBody?.orderID || null,
    error: success ? null : responseBody,
  };
}

async function parseJsonSafely(resp: any) {
  try {
    return await resp.json();
  } catch (error) {
    return { rawText: await resp.text() };
  }
}
