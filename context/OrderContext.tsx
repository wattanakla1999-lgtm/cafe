"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { MenuItem, Option } from "../data/mock";
import { Discount } from "./MenuContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface OrderItem {
    itemId: string; // internal cart ID or DB ID
    menuItem: MenuItem;
    options: Option[];
    quantity: number;
    totalPrice: number;
}

export interface Order {
    orderId: string; // Display ID (e.g. subset of UUID or separate field)
    id: string; // UUID
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    discount?: { name: string, value: number, type: "percent" | "amount", amountOff: number };
    status: "pending" | "completed" | "cancelled";
    timestamp: Date;
    channel: "QR" | "Counter";
    store_id?: string;
}

interface OrderContextType {
    cart: OrderItem[];
    addToCart: (item: MenuItem, options: Option[], quantity: number) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    submitOrder: (customerName: string, channel: "QR" | "Counter", overrideStoreId?: string) => Promise<string | undefined>;
    orders: Order[];
    completeOrder: (orderId: string) => Promise<void>;
    callOrder: (orderId: string) => void;
    currentCalling: string | null;
    selectedDiscount: Discount | null;
    setDiscount: (discount: Discount | null) => void;
    isSubmitting: boolean;
    incomingOrder: any | null; // Payload of the new order
    setIncomingOrder: (order: any | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentCalling, setCurrentCalling] = useState<string | null>(null);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [incomingOrder, setIncomingOrder] = useState<any | null>(null);

    // Load Cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem("cafe_cart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save Cart on change
    useEffect(() => {
        localStorage.setItem("cafe_cart", JSON.stringify(cart));
    }, [cart]);

    // Fetch Orders from Supabase
    useEffect(() => {
        if (!user?.storeId) return;

        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        *,
                        menu_item:menu_items (
                            id, name, price, image, description, category_id
                        )
                    )
                `)
                .eq("store_id", user.storeId)
                .order("created_at", { ascending: false }); // Newest first

            if (error) {
                console.error("Error fetching orders:", error);
                return;
            }

            if (data) {
                const mappedOrders: Order[] = data.map((o: any) => ({
                    id: o.id,
                    orderId: o.id.substring(0, 6).toUpperCase(), // Mock short ID
                    customerName: o.customer_name,
                    totalAmount: o.total_amount,
                    discount: o.discount_info,
                    status: o.status,
                    timestamp: new Date(o.created_at),
                    channel: o.channel,
                    items: o.order_items.map((oi: any) => ({
                        itemId: oi.id,
                        quantity: oi.quantity,
                        totalPrice: oi.total_price,
                        options: oi.options || [],
                        menuItem: {
                            id: oi.menu_item?.id || oi.menu_item_id,
                            name: oi.name, // Use snapshot name
                            price: oi.price,
                            image: oi.menu_item?.image,
                            description: oi.menu_item?.description,
                            category: "Unknown", // we didn't join categories, fine for history
                            available: true
                        }
                    }))
                }));
                setOrders(mappedOrders);
            }
        };

        fetchOrders();

        // Realtime Subscription
        const channel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${user.storeId}`
                },
                (payload) => {
                    // Check for new orders
                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new as any;
                        // STRICT FILTER: Only alert for customer QR orders
                        if (newOrder.channel !== 'QR') {
                            return;
                        }
                        setIncomingOrder(newOrder);
                    }

                    // Simple strategy: re-fetch all for simplicity in MVP
                    // We add a small delay to ensure order_items are fully inserted/committed
                    // before fetching the order with its items.
                    setTimeout(() => {
                        fetchOrders();
                    }, 500);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.storeId]);

    // Sync calling status across tabs (local only for now)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "cafe_calling") {
                setCurrentCalling(e.newValue);
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const addToCart = (menuItem: MenuItem, options: Option[], quantity: number) => {
        setCart((prevCart) => {
            // Helper to generate a unique key for options aggregation
            const getOptionsKey = (opts: Option[]) => {
                return opts
                    .map(o => o.id)
                    .sort()
                    .join('|');
            };

            const incomingOptionsKey = getOptionsKey(options);

            // Check if item already exists
            const existingItemIndex = prevCart.findIndex(
                item => item.menuItem.id === menuItem.id && getOptionsKey(item.options) === incomingOptionsKey
            );

            const optionsPrice = options.reduce((sum, opt) => sum + opt.price, 0);

            if (existingItemIndex !== -1) {
                // Item exists, update quantity
                const updatedCart = [...prevCart];
                const existingItem = updatedCart[existingItemIndex];

                updatedCart[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity + quantity,
                    totalPrice: (menuItem.price + optionsPrice) * (existingItem.quantity + quantity)
                };

                return updatedCart.sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name, 'th'));
            } else {
                // New Item
                const totalPrice = (menuItem.price + optionsPrice) * quantity;
                const newItem: OrderItem = {
                    itemId: Math.random().toString(36).substring(7),
                    menuItem,
                    options,
                    quantity,
                    totalPrice,
                };
                const newCart = [...prevCart, newItem];
                return newCart.sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name, 'th'));
            }
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((item) => item.itemId !== itemId));
    };

    const clearCart = () => setCart([]);

    const submitOrder = async (customerName: string, channel: "QR" | "Counter", overrideStoreId?: string): Promise<string | undefined> => {
        const targetStoreId = user?.storeId || overrideStoreId;
        if (cart.length === 0 || !targetStoreId) {
            console.error("Submit aborted: No store ID", { userStore: user?.storeId, override: overrideStoreId });
            return undefined;
        }
        setIsSubmitting(true);

        try {
            let totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
            let discountInfo = undefined;

            if (selectedDiscount) {
                let discountAmount = 0;
                if (selectedDiscount.type === "percent") {
                    discountAmount = totalAmount * (selectedDiscount.value / 100);
                } else {
                    discountAmount = selectedDiscount.value;
                }
                if (discountAmount > totalAmount) discountAmount = totalAmount;

                discountInfo = {
                    name: selectedDiscount.name,
                    value: selectedDiscount.value,
                    type: selectedDiscount.type,
                    amountOff: discountAmount
                };
                totalAmount -= discountAmount;
            }

            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert([{
                    store_id: targetStoreId,
                    customer_name: customerName,
                    total_amount: totalAmount,
                    discount_info: discountInfo,
                    status: "pending",
                    channel: channel
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Order Items
            if (orderData) {
                const orderItems = cart.map(item => ({
                    order_id: orderData.id,
                    menu_item_id: item.menuItem.id,
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: item.menuItem.price,
                    options: item.options, // jsonb handles array objects
                    total_price: item.totalPrice
                }));

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(orderItems);

                if (itemsError) throw itemsError;

                // --- OPTIMISTIC UPDATE ---
                // Add to local state immediately so user sees it instantly
                if (orderData) {
                    const newOrder: Order = {
                        id: orderData.id,
                        orderId: orderData.id.substring(0, 6).toUpperCase(),
                        customerName: orderData.customer_name,
                        totalAmount: orderData.total_amount,
                        discount: orderData.discount_info,
                        status: "pending",
                        timestamp: new Date(),
                        channel: orderData.channel as "QR" | "Counter",
                        items: cart.map(item => ({ ...item }))
                    };
                    setOrders(prev => [newOrder, ...prev]);

                    // Save to Guest History (Local Storage)
                    const history = JSON.parse(localStorage.getItem("cafe_guest_orders") || "[]");
                    if (!history.includes(orderData.id)) {
                        history.unshift(orderData.id); // Newest first
                        localStorage.setItem("cafe_guest_orders", JSON.stringify(history));
                    }

                    // Clear discount and cart
                    setSelectedDiscount(null);
                    clearCart();

                    return orderData.id;
                }
            }

            // Clear discount and cart (fallback if orderData null, unlikely)
            setSelectedDiscount(null);
            clearCart();

        } catch (error) {
            console.error("Order submission failed:", error);
            alert("Failed to submit order.");
            return undefined;
        } finally {
            setIsSubmitting(false);
        }
    };

    const completeOrder = async (orderId: string) => {
        // Optimistic Update: Remove from local state immediately
        setOrders(prev => prev.filter(o => o.id !== orderId));

        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: "completed" })
                .eq("id", orderId);

            if (error) {
                // Revert if error (optional, but good practice - for MVP we might skip revert logic for simplicity or just re-fetch)
                throw error;
            }
        } catch (error) {
            console.error("Error completing order:", error);
            // Verify state by re-fetching if error occurs
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
                // Trigger re-fetch logic if we had it exposed, or just alert.
            }
        }
    };

    const callOrder = (customerName: string) => {
        setCurrentCalling(customerName);
        localStorage.setItem("cafe_calling", customerName);
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
            isSubmitting,
            incomingOrder,
            setIncomingOrder
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

