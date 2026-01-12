"use client";

import React from "react";
import { useOrder } from "../context/OrderContext";
import { useConfirm } from "../context/ConfirmContext";
import { Button } from "./Button";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { Order } from "../context/OrderContext";

interface OrderQueueProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderQueue({ isOpen, onClose }: OrderQueueProps) {
    const { orders, updateOrderStatus, completeOrder } = useOrder();
    const { confirm, prompt } = useConfirm();
    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

    // Filter for active orders (pending, cooking, ready)
    const activeOrders = orders
        .filter(order => ["pending", "cooking", "ready"].includes(order.status))
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
                        {activeOrders.length}
                    </span>
                </div>
                <button onClick={onClose} className="text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-700)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4 space-y-4 bg-[var(--color-background)] min-w-[320px]">
                {activeOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-coffee-400)] space-y-2 opacity-60">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-medium">ไม่มีคิวค้าง!</p>
                    </div>
                ) : (
                    activeOrders.map((order, index) => (
                        <div key={order.orderId} className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${index === 0 ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-[var(--color-coffee-200)]"
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--color-coffee-900)]">ออเดอร์ #{order.orderId}</span>
                                        <div className="relative inline-block">
                                            <span className={`text-sm px-2 py-0.5 rounded border font-semibold ${order.status === 'cooking' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                order.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {order.status === 'cooking' ? 'กำลังทำ' : order.status === 'ready' ? 'พร้อมเสิร์ฟ' : 'รอคิว'}
                                            </span>
                                            {/* Ping indicators for all statuses */}
                                            {order.status === 'cooking' && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                                </span>
                                            )}
                                            {order.status === 'ready' && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </span>
                                            )}
                                            {order.status === 'pending' && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xl font-extrabold text-[var(--color-coffee-900)] mt-0.5">
                                        {order.customerName}
                                    </p>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-sm bg-[var(--color-primary)] text-white font-bold hover:brightness-110 mt-2 flex items-center gap-2 px-2 py-1 rounded-lg shadow-sm transition-all w-fit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        ดูรายละเอียด
                                    </button>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-[var(--color-coffee-400)] block">
                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const reason = await prompt({
                                                    title: "ยกเลิกออเดอร์",
                                                    message: "กรุณาระบุเหตุผลในการยกเลิกออเดอร์นี้:",
                                                    confirmText: "ยืนยันการยกเลิก",
                                                    cancelText: "ปิด",
                                                    variant: "danger",
                                                    inputConfig: {
                                                        placeholder: "เช่น ลูกค้าเปลี่ยนใจ, สินค้าหมด, ...",
                                                        required: true
                                                    }
                                                });

                                                if (reason !== null) {
                                                    await updateOrderStatus(order.id, "cancelled", reason);
                                                }
                                            }}
                                            className="text-[10px] text-red-400 hover:text-red-600 underline mt-1"
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>
                            </div>

                            {order.note && (
                                <div className="mb-3 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200 font-medium">
                                    📝 {order.note}
                                </div>
                            )}

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

                            <div className="grid grid-cols-1 gap-2">
                                {order.status === 'pending' && (
                                    <Button
                                        fullWidth
                                        size="sm"
                                        variant="primary"
                                        onClick={async () => {
                                            setProcessingId(order.id);
                                            await updateOrderStatus(order.id, "cooking");
                                            setProcessingId(null);
                                        }}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? "..." : "เริ่มทำ"}
                                    </Button>
                                )}

                                {order.status === 'cooking' && (
                                    <Button
                                        fullWidth
                                        size="sm"
                                        className="bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                                        onClick={async () => {
                                            setProcessingId(order.id);
                                            await updateOrderStatus(order.id, "ready");
                                            setProcessingId(null);
                                        }}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? "..." : "พร้อมเสิร์ฟ"}
                                    </Button>
                                )}

                                {order.status === 'ready' && (
                                    <Button
                                        fullWidth
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                                        onClick={async () => {
                                            setProcessingId(order.id);
                                            await completeOrder(order.id);
                                            setProcessingId(null);
                                        }}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? "..." : "เสิร์ฟแล้ว"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div >
    );
}
