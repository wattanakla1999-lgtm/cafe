"use client";

import React, { Suspense, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import { useSearchParams, useRouter } from "next/navigation";

// Subcomponent to handle search params
function ReceiptSelectionContent() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "Guest";
    const { submitOrder } = useOrder();
    const router = useRouter();

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const methods = [
        { id: "email", icon: "📧", label: "Email", desc: "Send to your inbox" },
        { id: "line", icon: "💬", label: "LINE", desc: "Send via LINE Chat" },
        { id: "now", icon: "📱", label: "Show Now", desc: "Display on screen" },
        { id: "none", icon: "❌", label: "No Receipt", desc: "Save paper" },
    ];

    const handleConfirm = () => {
        if (!selectedMethod) return;
        submitOrder(name, "QR");
        router.push("/receipt");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 flex flex-col">
            <div className="flex-1 max-w-md mx-auto w-full space-y-8 py-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[var(--color-primary)]">E-Receipt</h1>
                    <p className="text-[var(--color-coffee-500)]">How would you like to receive your receipt?</p>
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
                    disabled={!selectedMethod}
                >
                    Confirm Order
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
