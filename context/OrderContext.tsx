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
    status: "pending" | "cooking" | "ready" | "completed" | "cancelled";
    timestamp: Date;
    channel: "QR" | "Counter";
    store_id?: string;
    note?: string;
}

interface OrderContextType {
    cart: OrderItem[];
    addToCart: (item: MenuItem, options: Option[], quantity: number) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    submitOrder: (customerName: string, channel: "QR" | "Counter", overrideStoreId?: string, note?: string) => Promise<string | undefined>;
    orders: Order[];
    updateOrderStatus: (orderId: string, status: Order["status"], reason?: string) => Promise<void>;
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
        let mounted = true;
        if (!user?.storeId) return;

        const fetchOrders = async (retryCount = 0) => {
            if (!mounted) return; // Stop if unmounted

            try {
                // Use REST API directly to avoid Supabase client lock contention (AbortError)
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

                // Construct URL with query parameters for joining tables
                // select=*,order_items(*,menu_item:menu_items(id,name,price,image,description,category_id))
                const query = new URLSearchParams({
                    select: '*,order_items(*,menu_item:menu_items(id,name,price,image,description,category_id))',
                    store_id: `eq.${user.storeId}`,
                    order: 'created_at.desc'
                });

                const response = await fetch(`${supabaseUrl}/rest/v1/orders?${query.toString()}`, {
                    method: 'GET',
                    headers: {
                        'apikey': anonKey,
                        'Authorization': `Bearer ${user.accessToken}`, // Use token from AuthContext
                        'Content-Type': 'application/json'
                    }
                });

                if (!mounted) return; // Stop if unmounted during fetch

                if (!response.ok) {
                    const errorText = await response.text();
                    // Check for 5xx errors or specific fetch issues to retry
                    if (retryCount < 3) {
                        console.warn(`[Orders] ⚠️ Fetch error (Attempt ${retryCount + 1}), retrying...`, response.status, errorText);
                        setTimeout(() => {
                            if (mounted) fetchOrders(retryCount + 1);
                        }, 1000 * (retryCount + 1));
                        return;
                    }
                    console.error("Error fetching orders:", response.status, errorText);
                    return;
                }

                const data = await response.json();

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
                        note: o.note,
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
                    if (mounted) setOrders(mappedOrders);
                }
            } catch (err: any) {
                if (!mounted) return;
                // Retry on network errors
                if (retryCount < 3) {
                    console.warn(`[Orders] ⚠️ Exception (Attempt ${retryCount + 1}), retrying...`, err);
                    setTimeout(() => {
                        if (mounted) fetchOrders(retryCount + 1);
                    }, 1000 * (retryCount + 1));
                }
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
            mounted = false;
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

    const submitOrder = async (customerName: string, channel: "QR" | "Counter", overrideStoreId?: string, note?: string): Promise<string | undefined> => {
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
                    channel: channel,
                    note: note
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
                        note: orderData.note,
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

    const updateOrderStatus = async (orderId: string, status: Order["status"], reason?: string) => {
        // Optimistic Update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

        try {
            const updatePayload: any = { status };
            if (status === 'cancelled' && reason) {
                updatePayload.cancel_reason = reason;
            }

            const { error } = await supabase
                .from("orders")
                .update(updatePayload)
                .eq("id", orderId);

            if (error) {
                // Revert on error
                // For MVP, we might just log or re-fetch. Ideally revert state.
                console.error("Error updating status:", error);
                // Revert to re-fetch
                const { data: { user } } = await supabase.auth.getUser(); // dummy check
            }
        } catch (error) {
            console.error("Exception updating status:", error);
        }
    };

    const completeOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, "completed");
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
            updateOrderStatus,
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

