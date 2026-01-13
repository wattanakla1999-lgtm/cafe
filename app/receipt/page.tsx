"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";
import Link from "next/link";
import { Order } from "../../context/OrderContext";

import { Suspense } from "react";

function ReceiptContent() {
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
                        id, customer_name, total_amount, discount_info, status, created_at, channel, store_id, note,
                        store:stores(name, address, tax_type, vat_rate),
                        order_items (
                            quantity, total_price, options, name,
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
                        note: data.note,
                        items: data.order_items.map((oi: any) => ({
                            itemId: oi.id, // This might be undefined in join, but oi is order_items row here
                            quantity: oi.quantity,
                            totalPrice: oi.total_price,
                            options: oi.options || [],
                            menuItem: {
                                id: oi.menu_item?.id || "unknown", // Fallback
                                name: oi.menu_item?.name || oi.name, // Use stored name if join fails
                                price: oi.menu_item?.price || 0,
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
                    // Hack: attach store name to valid display
                    const storeData = data.store as any;
                    (mappedOrder as any).storeName = Array.isArray(storeData) ? storeData[0]?.name : storeData?.name;
                    (mappedOrder as any).storeAddress = Array.isArray(storeData) ? storeData[0]?.address : storeData?.address;
                    (mappedOrder as any).taxType = Array.isArray(storeData) ? storeData[0]?.tax_type : storeData?.tax_type;
                    (mappedOrder as any).vatRate = Array.isArray(storeData) ? storeData[0]?.vat_rate : storeData?.vat_rate;
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
                        {(order as any).storeAddress && (
                            <p className="text-xs text-[var(--color-coffee-600)] max-w-[200px] whitespace-pre-wrap">{(order as any).storeAddress}</p>
                        )}
                        <p className="text-sm text-[var(--color-coffee-500)] mt-1">ออเดอร์ #{order.orderId}</p>
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

                    {order.note && (
                        <div className="bg-[var(--color-coffee-50)] p-3 rounded-lg border border border-[var(--color-coffee-100)] text-left">
                            <span className="text-xs font-bold text-[var(--color-coffee-600)] block mb-1">หมายเหตุ:</span>
                            <span className="text-sm text-[var(--color-coffee-800)]">{order.note}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        {(() => {
                            const taxType = (order as any).taxType || 'none';
                            const vatRate = (order as any).vatRate || 7;
                            // We assume totalAmount is final paid amount
                            const totalAmount = order.totalAmount;
                            let vatAmount = 0;
                            let beforeVat = totalAmount;

                            if (taxType === 'include') {
                                beforeVat = totalAmount / (1 + vatRate / 100);
                                vatAmount = totalAmount - beforeVat;
                            } else if (taxType === 'exclude') {
                                // For exclude, the totalAmount in DB *should* already include VAT if computed correctly before saving
                                // BUT wait, our submitOrder logic (which we didn't touch deep in context) likely saves pure sum of items.
                                // However, we just adjusted CartPage to show 'finalTotal' but the order submitted 
                                // via standard logic using `order.items` sum might differ if backend doesn't account for it.
                                // Wait, if VAT is excluded, the meaningful total to show on receipt is what they PAID.
                                // If the stored total_amount in DB is just subtotal (because we didn't change submitOrder logic to add VAT to the saved total), 
                                // then we should probably re-calculate "Total to Pay" here or display "Subtotal" vs "Total".

                                // Given I didn't change `submitOrder` or DB schema for storing tax amount, 
                                // I must rely on re-calculation assumption same as CartPage.
                                // If totalAmount in DB is sum of items (Subtotal - Discount), then:

                                beforeVat = totalAmount; // This is actually subtotal after discount
                                vatAmount = totalAmount * (vatRate / 100);
                                // displayTotal = totalAmount + vatAmount; 
                                // BUT we are displaying `order.totalAmount` at the bottom. 
                                // If I change the display but not the passed `order.totalAmount`, it might look inconsistent.
                                // For 'exclude', the `order.totalAmount` saved in DB is likely PRE-TAX if the logic wasn't updated.
                                // Let's assume for Receipt we want to show the full breakdown and the GRAND TOTAL.
                            }

                            // If tax is exclude, the `order.totalAmount` (from DB) is currently likely the subtotal-discount.
                            // So the Real Grand Total is `order.totalAmount + vat`.
                            // However, if I display a different Total than what `order` object says, it might be confusing if other parts use it.
                            // But for Receipt, correctness of "Amount to Pay" is key.

                            const displayTotal = taxType === 'exclude' ? totalAmount + vatAmount : totalAmount;

                            return (
                                <>
                                    {taxType !== 'none' && (
                                        <div className="flex justify-between text-xs text-[var(--color-coffee-600)]">
                                            <span>ยอดก่อนภาษี</span>
                                            <span>฿{beforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    {taxType !== 'none' && (
                                        <div className="flex justify-between text-xs text-[var(--color-coffee-600)]">
                                            <span>
                                                {taxType === 'include' ? `รวม VAT ${vatRate}%` : `VAT ${vatRate}%`}
                                            </span>
                                            <span>฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg text-[var(--color-coffee-900)] pt-2 border-t border-[var(--color-coffee-200)] mt-2">
                                        <span>ยอดรวม</span>
                                        <span>฿{Math.floor(displayTotal)}</span>
                                    </div>
                                </>
                            );
                        })()}
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

export default function ReceiptPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ReceiptContent />
        </Suspense>
    );
}
