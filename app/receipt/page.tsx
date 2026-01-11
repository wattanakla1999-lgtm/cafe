"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";
import Link from "next/link";
import { Order } from "../../context/OrderContext";

export default function ReceiptPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select(`
                        *,
                        store:stores(name),
                        order_items (
                            *,
                            menu_item:menu_items (
                                id, name, price, image, description
                            )
                        )
                    `)
                    .eq("id", orderId)
                    .single();

                if (error) throw error;

                if (data) {
                    const mappedOrder: Order = {
                        id: data.id,
                        orderId: data.id.substring(0, 6).toUpperCase(),
                        customerName: data.customer_name,
                        totalAmount: data.total_amount,
                        discount: data.discount_info,
                        status: data.status,
                        timestamp: new Date(data.created_at),
                        channel: data.channel,
                        items: data.order_items.map((oi: any) => ({
                            itemId: oi.id,
                            quantity: oi.quantity,
                            totalPrice: oi.total_price,
                            options: oi.options || [],
                            menuItem: {
                                id: oi.menu_item?.id || oi.menu_item_id,
                                name: oi.name,
                                price: oi.price,
                                image: oi.menu_item?.image,
                                description: oi.menu_item?.description,
                                category: "Unknown",
                                available: true
                            }
                        })),
                        // Attempt to attach store name if possible, or fallback
                        // Note: Our Order type doesn't have storeName, but we use it in UI.
                        // We might need to extend Order type or just use local variable for display
                    };
                    // Hack: attach store name to valid display
                    (mappedOrder as any).storeName = data.store?.name;
                    mappedOrder.store_id = data.store_id; // Pass store_id for navigation
                    setOrder(mappedOrder);
                }
            } catch (err: any) {
                console.error("Error fetching order:", err);
                setError("ไม่พบคำสั่งซื้อ หรือเกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-[var(--color-coffee-600)]">
                กำลังโหลด...
            </div>
        );
    }

    if (!order || error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <p className="text-red-500">{error || "ไม่พบรหัสคำสั่งซื้อ"}</p>
                <Link href="/"><Button>กลับไปที่เมนู</Button></Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-coffee-50)] p-4 flex flex-col items-center justify-center">
            <div className="bg-white w-full max-w-sm rounded-none sm:rounded-xl shadow-xl overflow-hidden relative">
                {/* Receipt paper jagged edge effect top */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--color-coffee-50)]" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}></div>

                <div className="p-8 pt-12 text-center space-y-6">
                    <div className="space-y-1 flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-[var(--color-coffee-900)]">{(order as any).storeName || "Cafe"}</h2>
                        <p className="text-sm text-[var(--color-coffee-500)]">ออเดอร์ #{order.orderId}</p>
                        <p className="text-xs text-[var(--color-coffee-400)]">{order.timestamp.toLocaleString('th-TH')}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-[var(--color-coffee-200)] py-4 space-y-2">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <div className="text-left">
                                    <span className="text-[var(--color-coffee-800)] font-bold">{item.menuItem.name}</span>
                                    <div className="text-xs text-[var(--color-coffee-500)]">
                                        {item.options.map(o => o.name).join(", ")}
                                    </div>
                                </div>
                                <span className="text-[var(--color-coffee-900)]">฿{item.totalPrice}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between font-bold text-lg text-[var(--color-coffee-900)]">
                        <span>ยอดรวม</span>
                        <span>฿{order.totalAmount}</span>
                    </div>

                    <div className="pt-4">
                        <div className="w-32 h-32 bg-[var(--color-coffee-100)] mx-auto rounded-lg flex items-center justify-center text-xs text-[var(--color-coffee-500)] mb-2">
                            {/* Static or generic QR for customer share if needed, but this is the receipt itself */}
                            <div className="flex items-center justify-center w-full h-full text-4xl text-[var(--color-coffee-300)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-[var(--color-coffee-800)]">ขอบคุณค่ะ, {order.customerName}!</p>
                        <p className="text-xs text-[var(--color-coffee-500)]">กรุณารอเรียกคิวสักครู่</p>
                    </div>
                </div>

                {/* Receipt paper jagged edge effect bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--color-coffee-50)]" style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}></div>
            </div>

            <div className="mt-8">
                <Link href={order?.store_id ? `/menu?storeId=${order.store_id}` : "/menu"}>
                    <Button variant="ghost">กลับสู่หน้าหลัก</Button>
                </Link>
            </div>
        </div>
    );
}
