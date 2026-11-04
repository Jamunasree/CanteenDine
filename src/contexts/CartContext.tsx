import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../types";

type CartContextType = {
    cart: CartItem[];
    addToCart: (dish: CartItem) => void;
    removeFromCart: (dishId: number) => void;
    clearCart: () => void;
    isInCart: (dishId: number) => boolean;
};

const CartContext = createContext<CartContextType | null>(null);

export const useCartContext = (): CartContextType => {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCartContext must be used inside <CartProvider>");
    }
    return ctx;
};

const loadCart = (): CartItem[] => {
    try {
        const stored = localStorage.getItem("cart");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>(loadCart);

    // Keep localStorage in sync with the cart state
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (dish: CartItem) => {
        setCart((prev) =>
            prev.some((item) => item.id === dish.id)
                ? prev.map((item) =>
                      item.id === dish.id
                          ? { ...item, quantity: dish.quantity }
                          : item
                  )
                : [...prev, dish]
        );
    };

    const removeFromCart = (dishId: number) => {
        setCart((prev) => prev.filter((dish) => dish.id !== dishId));
    };

    const clearCart = () => setCart([]);

    const isInCart = (dishId: number) => cart.some((dish) => dish.id === dishId);

    return (
        <CartContext.Provider
            value={{ cart, addToCart, removeFromCart, clearCart, isInCart }}
        >
            {children}
        </CartContext.Provider>
    );
};
