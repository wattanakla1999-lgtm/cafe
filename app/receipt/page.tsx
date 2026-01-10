"use client";

import React, { useEffect, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { Order } from "../../context/OrderContext";

export default function ReceiptPage() {
    const { orders } = useOrder();
    const { user } = useAuth();
    const [latestOrder, setLatestOrder] = useState<Order | null>(null);

    useEffect(() => {
        // Get the most recent order from the user's session logic.
        // Since we just submitted, it's likely the first one in the list (if we prepended)
        // or we can find one that matches our session. 
        // For this Mock, we'll just take the top one.
        if (orders.length > 0) {
            setLatestOrder(orders[0]);
        }
    }, [orders]);

    if (!latestOrder) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <p>No recent order found.</p>
                <Link href="/menu"><Button>Back to Menu</Button></Link>
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
                        {user?.storeImage && (
                            <img src={user.storeImage} alt="Store Logo" className="w-16 h-16 rounded-full object-cover border border-[var(--color-coffee-200)] mb-2" />
                        )}
                        <h2 className="text-2xl font-bold text-[var(--color-coffee-900)]">{user?.storeName || "Cafe"}</h2>
                        <p className="text-sm text-[var(--color-coffee-500)]">Order #{latestOrder.orderId}</p>
                        <p className="text-xs text-[var(--color-coffee-400)]">{latestOrder.timestamp.toLocaleString()}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-[var(--color-coffee-200)] py-4 space-y-2">
                        {latestOrder.items.map((item, idx) => (
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
                        <span>Total</span>
                        <span>฿{latestOrder.totalAmount}</span>
                    </div>

                    <div className="pt-4">
                        <div className="w-32 h-32 bg-[var(--color-coffee-100)] mx-auto rounded-lg flex items-center justify-center text-xs text-[var(--color-coffee-500)] mb-2">
                            [Mock QR Code]
                        </div>
                        <p className="text-sm font-bold text-[var(--color-coffee-800)]">Thank you, {latestOrder.customerName}!</p>
                        <p className="text-xs text-[var(--color-coffee-500)]">Please wait for your queue.</p>
                    </div>
                </div>

                {/* Receipt paper jagged edge effect bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--color-coffee-50)]" style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}></div>
            </div>

            <div className="mt-8">
                <Link href="/">
                    <Button variant="ghost">Back to Home</Button>
                </Link>
            </div>
        </div>
    );
}
