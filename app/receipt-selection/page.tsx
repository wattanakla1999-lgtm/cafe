"use client";

import React, { Suspense, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { useMenu } from "../../context/MenuContext";
import { Button } from "../../components/Button";
import { useSearchParams, useRouter } from "next/navigation";

// Subcomponent to handle search params
function ReceiptSelectionContent() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "Guest";
    const storeIdParam = searchParams.get("storeId"); // Get storeId from URL if passed
    const { submitOrder, isSubmitting } = useOrder();

    // Store ID is retrieved from URL params to support anonymous orders
    const storeId = storeIdParam;

    const router = useRouter();

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const methods = [
        { id: "email", icon: "📧", label: "อีเมล", desc: "ส่งเข้ากล่องข้อความของคุณ" },
        { id: "line", icon: "💬", label: "LINE", desc: "ส่งทางแชท LINE" },
        { id: "now", icon: "📱", label: "แสดงทันที", desc: "แสดงบนหน้าจอ" },
        { id: "none", icon: "❌", label: "ไม่รับใบเสร็จ", desc: "ช่วยลดโลกร้อน" },
    ];

    const handleConfirm = async () => {
        if (!selectedMethod || isSubmitting) return;

        // We need the storeId here. If it's missing, submitOrder will fail.
        // Let's try to get it from useMenu (need to import and hook)

        const orderId = await submitOrder(name, "QR", storeId || undefined);

        if (orderId) {
            router.push(`/receipt?id=${orderId}`);
        } else {
            // Handle error (maybe alert user)
            alert("ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 flex flex-col">
            <div className="flex-1 max-w-md mx-auto w-full space-y-8 py-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[var(--color-primary)]">ใบเสร็จอิเล็กทรอนิกส์</h1>
                    <p className="text-[var(--color-coffee-500)]">คุณต้องการรับใบเสร็จทางช่องทางใด?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {methods.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMethod(m.id)}
                            className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${selectedMethod === m.id
                                ? "border-[var(--color-primary)] bg-white shadow-md ring-2 ring-[var(--color-primary)] ring-opacity-10"
                                : "border-[var(--color-coffee-100)] bg-white hover:border-[var(--color-coffee-300)]"
                                }`}
                        >
                            <span className="text-3xl">{m.icon}</span>
                            <div className="text-left">
                                <span className="block font-bold text-[var(--color-coffee-900)]">{m.label}</span>
                                <span className="text-sm text-[var(--color-coffee-500)]">{m.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto max-w-md mx-auto w-full">
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleConfirm}
                    disabled={!selectedMethod || isSubmitting}
                >
                    {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันออเดอร์"}
                </Button>
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function ReceiptSelectionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ReceiptSelectionContent />
        </Suspense>
    );
}
