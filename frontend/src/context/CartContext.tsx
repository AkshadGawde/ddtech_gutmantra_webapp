import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;

  productId?: string;

  // PETPOOJA
  base_id?: string;
  variation_id?: string;

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

  addToCart: (item: CartItem) => void;

  removeFromCart: (
    id: string,
    variant?: string
  ) => void;

  updateQuantity: (
    id: string,
    quantity: number,
    variant?: string
  ) => void;

  clearCart: () => void;

  totalItems: number;
  totalAmount: number;
  totalPrice: number;

  cart: CartItem[];

  notification: string | null;

  setNotification: (
    msg: string | null
  ) => void;
}

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

export const CartProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [notification, setNotification] =
    useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(items)
    );
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          i.variant === item.variant
      );

      if (existing) {
        return prev.map((i) =>
          i.id === item.id &&
          i.variant === item.variant
            ? {
                ...i,
                quantity:
                  i.quantity + item.quantity,
              }
            : i
        );
      }

      return [...prev, item];
    });

    console.log("🛒 CART ITEM ADDED:", item);

    setNotification(
      `${item.name} added to cart!`
    );

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const removeFromCart = (
    id: string,
    variant?: string
  ) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.id === id &&
            i.variant === variant
          )
      )
    );
  };

  const updateQuantity = (
    id: string,
    quantity: number,
    variant?: string
  ) => {
    if (quantity < 1) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === id &&
        i.variant === variant
          ? {
              ...i,
              quantity,
            }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,

        cart: items,

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
    throw new Error(
      "useCart must be used within a CartProvider"
    );
  }

  return context;
};