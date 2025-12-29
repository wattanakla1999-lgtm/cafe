"use client";

import React from "react";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";

export default function OrdersPage() {
    const { orders, callOrder } = useOrder();

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-primary)]">Order Queue</h1>
                <div className="space-x-4">
                    <Link href="/call" target="_blank">
                        <Button variant="outline">Open Customer Display</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost">Home</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-[var(--color-coffee-400)]">
                        <p className="text-xl">No active orders</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.orderId} className="bg-white rounded-xl shadow-md border border-[var(--color-coffee-200)] overflow-hidden flex flex-col animate-in scale-95 duration-200">
                            {/* Header */}
                            <div className={`p-4 flex justify-between items-start ${order.channel === 'Counter' ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-primary)] text-white'}`}>
                                <div>
                                    <h3 className="font-bold text-lg">{order.customerName}</h3>
                                    <span className="text-xs opacity-80 uppercase tracking-wider">{order.channel} Order</span>
                                </div>
                                <span className="font-mono font-bold text-xl">#{order.orderId}</span>
                            </div>

                            {/* Body */}
                            <div className="p-4 flex-1 space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="border-b border-dashed border-[var(--color-coffee-100)] last:border-0 pb-2 last:pb-0">
                                        <div className="font-bold text-[var(--color-coffee-800)]">
                                            {item.quantity}x {item.menuItem.name}
                                        </div>
                                        <div className="text-sm text-[var(--color-coffee-500)]">
                                            {item.options.map(o => o.name).join(", ")}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-[var(--color-coffee-50)] border-t border-[var(--color-coffee-100)]">
                                <Button
                                    fullWidth
                                    onClick={() => callOrder(order.customerName)}
                                    className="shadow-sm"
                                >
                                    Call Customer
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
