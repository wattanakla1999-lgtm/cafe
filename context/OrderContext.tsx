"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { MenuItem, Option } from "../data/mock";
import { Discount } from "./MenuContext";

export interface OrderItem {
    itemId: string;
    menuItem: MenuItem;
    options: Option[];
    quantity: number;
    totalPrice: number;
}

export interface Order {
    orderId: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    discount?: { name: string, value: number, type: "percent" | "amount", amountOff: number };
    status: "pending" | "completed";
    timestamp: Date;
    channel: "QR" | "Counter";
}

interface OrderContextType {
    cart: OrderItem[];
    addToCart: (item: MenuItem, options: Option[], quantity: number) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    submitOrder: (customerName: string, channel: "QR" | "Counter") => void;
    orders: Order[];
    completeOrder: (orderId: string) => void;
    callOrder: (orderId: string) => void;
    currentCalling: string | null;
    selectedDiscount: Discount | null;
    setDiscount: (discount: Discount | null) => void;
    isSubmitting: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentCalling, setCurrentCalling] = useState<string | null>(null);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedOrders = localStorage.getItem("cafe_orders");
        if (savedOrders) {
            // Parse and ensure Date objects are correctly re-instantiated if needed,
            // though for this simple case, string dates are fine for display.
            // If actual Date object methods are used, a reviver function would be needed.
            setOrders(JSON.parse(savedOrders));
        }
        const savedCalling = localStorage.getItem("cafe_calling");
        if (savedCalling) {
            setCurrentCalling(savedCalling);
        }
        const savedCart = localStorage.getItem("cafe_cart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save Cart on change
    useEffect(() => {
        localStorage.setItem("cafe_cart", JSON.stringify(cart));
    }, [cart]);

    // Sync with other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "cafe_orders") {
                setOrders(JSON.parse(e.newValue || "[]"));
            }
            if (e.key === "cafe_calling") {
                setCurrentCalling(e.newValue);
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const addToCart = (menuItem: MenuItem, options: Option[], quantity: number) => {
        const optionsPrice = options.reduce((sum, opt) => sum + opt.price, 0);
        const totalPrice = (menuItem.price + optionsPrice) * quantity;

        const newItem: OrderItem = {
            itemId: Math.random().toString(36).substring(7),
            menuItem,
            options,
            quantity,
            totalPrice,
        };

        setCart((prev) => [...prev, newItem]);
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((item) => item.itemId !== itemId));
    };

    const clearCart = () => setCart([]);

    const submitOrder = (customerName: string, channel: "QR" | "Counter") => {
        if (cart.length === 0) return;
        setIsSubmitting(true);

        // Simulate network delay to show loading state
        setTimeout(() => {
            let totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
            let discountInfo = undefined;

            if (selectedDiscount) {
                let discountAmount = 0;
                if (selectedDiscount.type === "percent") {
                    discountAmount = totalAmount * (selectedDiscount.value / 100);
                } else {
                    discountAmount = selectedDiscount.value;
                }

                // Ensure total doesn't go below 0
                if (discountAmount > totalAmount) discountAmount = totalAmount;

                discountInfo = {
                    name: selectedDiscount.name,
                    value: selectedDiscount.value,
                    type: selectedDiscount.type,
                    amountOff: discountAmount
                };
                totalAmount -= discountAmount;
            }

            const newOrder: Order = {
                orderId: Math.random().toString(36).substring(2, 8).toUpperCase(),
                customerName,
                items: [...cart],
                totalAmount,
                discount: discountInfo,
                status: "pending",
                timestamp: new Date(),
                channel,
            };

            // Clear discount after submit
            setSelectedDiscount(null);

            const updatedOrders = [newOrder, ...orders];
            setOrders(updatedOrders);
            localStorage.setItem("cafe_orders", JSON.stringify(updatedOrders));
            clearCart();
            setIsSubmitting(false);
        }, 1000); // 1 second delay
    };

    const completeOrder = (orderId: string) => {
        const updatedOrders = orders.map(order =>
            order.orderId === orderId ? { ...order, status: "completed" as const } : order
        );
        setOrders(updatedOrders);
        localStorage.setItem("cafe_orders", JSON.stringify(updatedOrders));
    };

    const callOrder = (customerName: string) => {
        setCurrentCalling(customerName);
        localStorage.setItem("cafe_calling", customerName);

        // Auto-clear calling status after 10 seconds for demo purposes
        setTimeout(() => {
            setCurrentCalling(null);
            localStorage.removeItem("cafe_calling");
        }, 10000);
    };

    return (
        <OrderContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            submitOrder,
            orders,
            completeOrder,
            callOrder,
            currentCalling,
            selectedDiscount,
            setDiscount: setSelectedDiscount,
            isSubmitting
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error("useOrder must be used within an OrderProvider");
    }
    return context;
}
