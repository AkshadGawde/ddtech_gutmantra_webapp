declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export const fbq = (...args: any[]) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
};

export const pixelEvents = {
  pageView: () => fbq("track", "PageView"),

  addToCart: (
    item: { name: string; id: string; price: number; quantity: number },
    eventId?: string,
  ) =>
    fbq(
      "track",
      "AddToCart",
      {
        content_name: item.name,
        content_ids: [item.id],
        content_type: "product",
        value: item.price * item.quantity,
        currency: "INR",
      },
      eventId ? { eventID: eventId } : undefined,
    ),

  initiateCheckout: (total: number, numItems: number, eventId?: string) =>
    fbq(
      "track",
      "InitiateCheckout",
      {
        value: total,
        currency: "INR",
        num_items: numItems,
      },
      eventId ? { eventID: eventId } : undefined,
    ),

  purchase: (
    orderId: string,
    total: number,
    items: { id: string; quantity: number }[],
    eventId?: string,
  ) =>
    fbq(
      "track",
      "Purchase",
      {
        value: total,
        currency: "INR",
        content_ids: items.map((i) => i.id),
        content_type: "product",
        order_id: orderId,
      },
      eventId ? { eventID: eventId } : undefined,
    ),
};
