"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Order } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchGuestOrders = async () => {
            const historyIds = JSON.parse(localStorage.getItem("cafe_guest_orders") || "[]");

            if (historyIds.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select(`
                        *,
                        order_items (
                            *,
                            menu_item:menu_items (
                                id, name, price, image
                            )
                        )
                    `)
                    .in("id", historyIds)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                if (data) {
                    const mappedOrders: Order[] = data.map((o: any) => ({
                        id: o.id,
                        orderId: o.id.substring(0, 6).toUpperCase(),
                        customerName: o.customer_name,
                        totalAmount: o.total_amount,
                        discount: o.discount_info,
                        status: o.status,
                        timestamp: new Date(o.created_at),
                        channel: o.channel,
                        store_id: o.store_id,
                        items: o.order_items.map((oi: any) => ({
                            itemId: oi.id,
                            quantity: oi.quantity,
                            totalPrice: oi.total_price,
                            options: oi.options || [],
                            menuItem: {
                                id: oi.menu_item?.id || oi.menu_item_id,
                                name: oi.name,
                                price: oi.price,
                                image: oi.menu_item?.image,
                                description: "",
                                category: "",
                                available: true
                            }
                        }))
                    }));
                    setOrders(mappedOrders);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuestOrders();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-coffee-100)] p-4 flex items-center">
                <Link href={orders.length > 0 && orders[0].store_id ? `/menu?storeId=${orders[0].store_id}` : "/menu"} className="mr-4 text-[var(--color-coffee-600)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-xl font-bold text-[var(--color-coffee-900)]">ประวัติการสั่งซื้อ</h1>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8 text-[var(--color-coffee-500)]">กำลังโหลด...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-coffee-500)]">
                        <p>คุณยังไม่มีประวัติการสั่งซื้อ</p>
                        <Link href="/menu" className="mt-4 inline-block">
                            <Button>ไปสั่งอาหาร</Button>
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => router.push(`/receipt?id=${order.id}`)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-coffee-100)] active:scale-95 transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-[var(--color-coffee-900)]">#{order.orderId}</span>
                                    <p className="text-xs text-[var(--color-coffee-500)]">{order.timestamp.toLocaleString('th-TH')}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {order.status === 'completed' ? 'เสร็จสิ้น' :
                                        order.status === 'cancelled' ? 'ยกเลิก' : 'รอคิว'}
                                </span>
                            </div>

                            <div className="text-sm text-[var(--color-coffee-700)] mb-3 line-clamp-2">
                                {order.items.map(i => `${i.menuItem.name} x${i.quantity}`).join(", ")}
                            </div>

                            <div className="pt-2 border-t border-[var(--color-coffee-50)] flex justify-between items-center">
                                <span className="text-sm text-[var(--color-coffee-500)]">{order.items.length} รายการ</span>
                                <span className="font-bold text-[var(--color-coffee-900)]">฿{order.totalAmount}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
