"use client";

import React, { useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { useMenu } from "../../context/MenuContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const { cart, removeFromCart, submitOrder, isSubmitting } = useOrder();
    const { publicStoreId } = useMenu();
    const router = useRouter();

    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    const [customerName, setCustomerName] = useState("");
    const [note, setNote] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleConfirm = async () => {
        if (isSubmitting) return;

        const orderId = await submitOrder(customerName.trim() || "-", "QR", publicStoreId || undefined, note.trim());

        if (orderId) {
            setIsRedirecting(true);
            router.push(`/receipt?id=${orderId}`);
        } else {
            alert("ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    if (isRedirecting) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
                <p className="mt-4 text-[var(--color-coffee-700)] font-bold">กำลังดำเนินการ...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)]">
                <div className="text-center space-y-4">
                    <p className="text-[var(--color-coffee-500)]">ตะกร้าของคุณว่างเปล่า</p>
                    <Link href="/menu">
                        <Button variant="primary">ไปที่เมนู</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-[26rem]"> {/* Increased padding-bottom for tall fixed footer */}
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-coffee-100)] p-4 flex items-center">
                <Link href="/menu" className="mr-4 text-[var(--color-coffee-600)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-xl font-bold text-[var(--color-primary)]">สรุปการสั่งซื้อ</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Order List */}
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.itemId} className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-coffee-100)] flex justify-between items-start animate-in slide-in-from-bottom-2 duration-300 gap-3">
                            {item.menuItem.image && (
                                <img
                                    src={item.menuItem.image}
                                    alt={item.menuItem.name}
                                    className="w-16 h-16 rounded-lg object-cover border border-[var(--color-coffee-50)] shrink-0"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="font-bold text-[var(--color-coffee-900)]">{item.menuItem.name}</h3>
                                <p className="text-sm text-[var(--color-coffee-500)]">
                                    {item.options.map(o => o.name).join(", ")}
                                </p>
                                <div className="mt-1 text-sm font-medium text-[var(--color-coffee-600)]">
                                    x{item.quantity} · ฿{item.totalPrice}
                                </div>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.itemId)}
                                className="text-red-400 hover:text-red-600 ml-4 p-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Customer Details Inputs moved to footer */}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-coffee-100)] p-4 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 rounded-t-xl">
                <div className="bg-[var(--color-coffee-50)] p-3 rounded-xl mb-4 space-y-2 border border-[var(--color-coffee-100)]">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-coffee-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                            type="text"
                            maxLength={50}
                            className="flex-1 p-1.5 text-sm bg-transparent border-b border-[var(--color-coffee-200)] focus:border-[var(--color-primary)] outline-none placeholder:text-[var(--color-coffee-400)] text-[var(--color-coffee-900)]"
                            placeholder="ชื่อผู้สั่ง"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-coffee-500)] mt-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <textarea
                            className="flex-1 p-1.5 text-sm bg-transparent border-b border-[var(--color-coffee-200)] focus:border-[var(--color-primary)] outline-none resize-none placeholder:text-[var(--color-coffee-400)] text-[var(--color-coffee-900)]"
                            placeholder="หมายเหตุ"
                            maxLength={130}
                            rows={1}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 text-lg font-bold text-[var(--color-coffee-900)]">
                    <span>รวมทั้งสิ้น</span>
                    <span className="text-[var(--color-primary)]">฿{total}</span>
                </div>
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleConfirm}
                    disabled={cart.length === 0 || isSubmitting}
                >
                    {isSubmitting ? "กำลังยืนยัน..." : "ยืนยัน Order"}
                </Button>
            </div>
        </div>
    );
}
