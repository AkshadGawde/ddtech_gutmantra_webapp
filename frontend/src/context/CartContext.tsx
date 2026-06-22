import React, { createContext, useContext, useEffect, useState } from "react";
import { pixelEvents } from "../utils/fbPixel";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export interface CartItem {
  id: string;
  _docId?: string; // Firestore document ID returned by the API

  productId?: string;

  // PETPOOJA
  base_id?: string;
  variation_id?: string;
  petpoojaVarItemId?: string;

  name: string;
  price: number;
  quantity: number;
  image: string;

  variant?: string;

  petpoojaId?: string;

  category?: string;
  grind?: string;
  selectedQuantity?: string;

  sku?: string;
}

interface CartContextType {
  items: CartItem[];
  cart: CartItem[];

  isLoading: boolean;

  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, variant?: string) => void;
  updateQuantity: (id: string, quantity: number, variant?: string) => void;
  clearCart: () => void;

  totalItems: number;
  totalAmount: number;
  totalPrice: number;

  notification: string | null;
  setNotification: (msg: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || "https://api.gutmantra.in";

async function getToken(): Promise<string | null> {
  return auth.currentUser?.getIdToken() ?? null;
}

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<CartItem[]> {
  const token = await getToken();
  if (!token) return [];

  const res = await fetch(`${API_BASE}/api/cart${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    console.error(`Cart API ${options.method || "GET"} ${path} failed:`, res.status);
    return [];
  }

  const data = await res.json();
  return (data.items ?? []) as CartItem[];
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load cart when user signs in, clear when they sign out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setItems([]);
        return;
      }

      setIsLoading(true);
      try {
        // Migrate any pre-existing localStorage cart to the DB (one-time)
        const saved = localStorage.getItem("cart");
        if (saved) {
          const localItems: CartItem[] = JSON.parse(saved);
          if (localItems.length > 0) {
            const token = await getToken();
            if (token) {
              await Promise.all(
                localItems.map((item) =>
                  fetch(`${API_BASE}/api/cart`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(item),
                  })
                )
              );
            }
          }
          localStorage.removeItem("cart");
        }

        const cartItems = await apiFetch("/");
        setItems(cartItems);
      } catch (error) {
        console.error("Failed to load cart:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = async (item: CartItem) => {
    if (!auth.currentUser) {
      window.dispatchEvent(new CustomEvent("require-login"));
      return;
    }

    const fbEventId = `atc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    pixelEvents.addToCart(
      { name: item.name, id: item.id, price: item.price, quantity: item.quantity },
      fbEventId,
    );

    // Optimistic update
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.variant === item.variant
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.variant === item.variant
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });

    showNotification(`${item.name} added to cart!`);
    console.log("🛒 CART ITEM ADDED:", item);

    // TODO: fbEventId is included so the backend CAPI AddToCart can use the same ID for deduplication
    const synced = await apiFetch("/", {
      method: "POST",
      body: JSON.stringify({ ...item, fbEventId }),
    });
    if (synced.length > 0) setItems(synced);
  };

  const removeFromCart = async (id: string, variant?: string) => {
    const target = items.find((i) => i.id === id && i.variant === variant);
    if (!target) return;

    // Optimistic update
    setItems((prev) =>
      prev.filter((i) => !(i.id === id && i.variant === variant))
    );

    if (auth.currentUser && target._docId) {
      await apiFetch(`/${target._docId}`, { method: "DELETE" });
    }
  };

  const updateQuantity = async (
    id: string,
    quantity: number,
    variant?: string
  ) => {
    if (quantity < 1) return;

    const target = items.find((i) => i.id === id && i.variant === variant);
    if (!target) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === id && i.variant === variant ? { ...i, quantity } : i
      )
    );

    if (auth.currentUser && target._docId) {
      const synced = await apiFetch(`/${target._docId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      if (synced.length > 0) setItems(synced);
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (auth.currentUser) {
      await apiFetch("/clear", { method: "DELETE" });
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cart: items,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        totalPrice: totalAmount,
        notification,
        setNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
