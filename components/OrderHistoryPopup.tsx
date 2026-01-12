"use client";

import React from "react";
import { useOrder } from "../context/OrderContext";
import { Button } from "./Button";

interface OrderHistoryPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderHistoryPopup({ isOpen, onClose }: OrderHistoryPopupProps) {
    const { orders } = useOrder();

    if (!isOpen) return null;

    // Filter orders to only show those from today
    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        const today = new Date();
        return orderDate.getDate() === today.getDate() &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">

                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--color-coffee-100)] shrink-0">
                    <h2 className="text-2xl font-bold text-[var(--color-coffee-900)]">ประวัติออเดอร์ (วันนี้)</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-coffee-50)] rounded-full text-[var(--color-coffee-500)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {todayOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--color-coffee-400)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>ไม่มีออเดอร์วันนี้</p>
                        </div>
                    ) : (
                        todayOrders.map((order) => (
                            <div key={order.orderId} className="bg-[var(--color-coffee-50)] rounded-xl p-4 border border-[var(--color-coffee-100)] hover:border-[var(--color-primary)] transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[var(--color-coffee-900)] text-lg">#{order.orderId}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${order.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-[var(--color-coffee-500)] bg-white px-2 py-0.5 rounded border border-[var(--color-coffee-200)]">
                                                {order.channel}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-[var(--color-coffee-700)] mt-1">
                                            ลูกค้า: {order.customerName}
                                        </div>
                                        <div className="text-xs text-[var(--color-coffee-500)]">
                                            {new Date(order.timestamp).toLocaleTimeString()}
                                        </div>
                                        {order.note && (
                                            <div className="mt-1 text-xs text-[var(--color-primary)] font-medium bg-[var(--color-primary)]/5 p-1.5 rounded border border-[var(--color-primary)]/10">
                                                📝 Note: {order.note}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xl font-bold text-[var(--color-primary)]">
                                        ฿{order.totalAmount}
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 space-y-2 border border-[var(--color-coffee-100)]">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <div className="flex-1">
                                                <span className="font-bold text-[var(--color-coffee-800)]">{item.quantity}x {item.menuItem.name}</span>
                                                {item.options.length > 0 && (
                                                    <div className="text-xs text-[var(--color-coffee-500)] ml-4">
                                                        {item.options.map(o => o.name).join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[var(--color-coffee-600)] font-medium">฿{item.totalPrice}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-coffee-100)] flex justify-end shrink-0">
                    <Button onClick={onClose} variant="secondary">
                        ปิด
                    </Button>
                </div>

            </div>
        </div>
    );
}
