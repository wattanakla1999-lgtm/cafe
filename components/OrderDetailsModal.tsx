import React from "react";
import { Order } from "../context/OrderContext";
import { Button } from "./Button";

interface OrderDetailsModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[var(--color-coffee-50)] p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--color-coffee-900)]">รายละเอียดออเดอร์</h3>
                        <p className="text-sm text-[var(--color-coffee-600)]">#{order.orderId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-900)] hover:bg-[var(--color-coffee-100)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">

                    {/* Customer Info */}
                    <div className="flex justify-between items-start pb-4 border-b border-[var(--color-coffee-100)]">
                        <div>
                            <span className="text-xs font-bold text-[var(--color-coffee-400)] uppercase block mb-1">ชื่อลูกค้า</span>
                            <span className="font-bold text-lg text-[var(--color-coffee-900)]">{order.customerName}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-[var(--color-coffee-400)] uppercase block mb-1">เวลาสั่ง</span>
                            <span className="text-sm text-[var(--color-coffee-700)]">
                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`text-sm px-3 py-1 rounded-full border font-bold ${order.status === 'cooking' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                order.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' :
                                    order.status === 'completed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {order.status === 'cooking' ? 'กำลังทำ' :
                                order.status === 'ready' ? 'พร้อมเสิร์ฟ' :
                                    order.status === 'completed' ? 'เสิร์ฟแล้ว' :
                                        order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอคิว'}
                        </span>
                    </div>

                    {/* Note */}
                    {order.note && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
                            <strong className="block mb-1">หมายเหตุ:</strong>
                            {order.note}
                        </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-[var(--color-coffee-800)] border-b border-[var(--color-coffee-100)] pb-2">รายการที่สั่ง</h4>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                                <div className="font-bold text-[var(--color-coffee-900)] w-6 shrink-0">{item.quantity}x</div>
                                <div className="flex-1">
                                    <div className="font-bold text-[var(--color-coffee-800)]">{item.menuItem.name}</div>
                                    {item.options.length > 0 && (
                                        <div className="text-xs text-[var(--color-coffee-500)] mt-0.5">
                                            {item.options.map(o => o.name).join(", ")}
                                        </div>
                                    )}
                                </div>
                                <div className="font-bold text-[var(--color-coffee-700)]">฿{item.totalPrice}</div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Footer: Total & Actions */}
                <div className="p-4 bg-[var(--color-coffee-50)] border-t border-[var(--color-coffee-100)] shrink-0 space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold text-[var(--color-coffee-900)]">
                        <span>ยอดรวม</span>
                        <span>฿{order.totalAmount || order.items.reduce((sum, i) => sum + i.totalPrice, 0)}</span>
                    </div>
                    <Button fullWidth onClick={onClose} variant="outline">
                        ปิด
                    </Button>
                </div>

            </div>
        </div>
    );
}
