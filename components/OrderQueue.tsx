"use client";

import React from "react";
import { useOrder } from "../context/OrderContext";
import { Button } from "./Button";

interface OrderQueueProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderQueue({ isOpen, onClose }: OrderQueueProps) {
    const { orders, completeOrder } = useOrder();
    const [completingId, setCompletingId] = React.useState<string | null>(null);

    // Filter for pending orders and sort by timestamp (oldest first - FIFO)
    const pendingOrders = orders
        .filter(order => order.status === "pending")
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div
            className={`bg-white border-l border-[var(--color-coffee-200)] flex flex-col h-full shrink-0 shadow-xl z-30 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "w-full lg:w-80 xl:w-96 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10 border-none"
                }`}
        >
            <div className="p-4 border-b border-[var(--color-coffee-100)] bg-[var(--color-coffee-50)] shrink-0 flex justify-between items-center min-w-[300px] md:min-w-[320px]">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-lg text-[var(--color-coffee-900)]">คิวปัจจุบัน</h2>
                    <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingOrders.length}
                    </span>
                </div>
                <button onClick={onClose} className="text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-700)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-background)] min-w-[320px]">
                {pendingOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-coffee-400)] space-y-2 opacity-60">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-medium">ไม่มีคิวค้าง!</p>
                    </div>
                ) : (
                    pendingOrders.map((order, index) => (
                        <div key={order.orderId} className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${index === 0 ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-[var(--color-coffee-200)]"
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--color-coffee-900)]">ออเดอร์ #{order.orderId}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                            {order.channel}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-[var(--color-coffee-700)] mt-0.5">
                                        {order.customerName}
                                    </p>
                                </div>
                                <span className="text-xs text-[var(--color-coffee-400)]">
                                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm flex items-center gap-3 text-[var(--color-coffee-600)]">
                                        {/* Thumbnail Image */}
                                        {item.menuItem.image && (
                                            <img
                                                src={item.menuItem.image}
                                                alt={item.menuItem.name}
                                                className="w-10 h-10 rounded-md object-cover border border-[var(--color-coffee-50)] shrink-0"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0 flex items-start justify-between">
                                            <div className="truncate pr-2">
                                                <span className="font-bold mr-1">{item.quantity}x</span>
                                                <span className="truncate">{item.menuItem.name}</span>
                                                {item.options.length > 0 && (
                                                    <div className="text-[10px] text-[var(--color-coffee-400)] truncate">
                                                        {item.options.map(o => o.name).join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                fullWidth
                                size="sm"
                                variant={index === 0 ? "primary" : "outline"}
                                onClick={async () => {
                                    setCompletingId(order.id);
                                    await completeOrder(order.id);
                                    setCompletingId(null);
                                }}
                                disabled={completingId === order.id}
                            >
                                {completingId === order.id ? "กำลังดำเนินการ..." : (index === 0 ? "เสิร์ฟเลย" : "เสร็จสิ้น")}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
