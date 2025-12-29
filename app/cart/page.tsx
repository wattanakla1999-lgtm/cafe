"use client";

import React, { useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const { cart, removeFromCart } = useOrder();
    const [name, setName] = useState("");
    const router = useRouter();

    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    const handleNext = () => {
        if (!name.trim()) return;
        // Pass name via query param to keep it simple, or we could use a global "DraftOrder" state.
        // Using query param for simplicity in this prototype.
        router.push(`/receipt-selection?name=${encodeURIComponent(name)}`);
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)]">
                <div className="text-center space-y-4">
                    <p className="text-[var(--color-coffee-500)]">Your cart is empty</p>
                    <Link href="/menu">
                        <Button variant="primary">Go to Menu</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-coffee-100)] p-4 flex items-center">
                <Link href="/menu" className="mr-4 text-[var(--color-coffee-600)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-xl font-bold text-[var(--color-primary)]">Order Summary</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Order List */}
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.itemId} className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-coffee-100)] flex justify-between items-start animate-in slide-in-from-bottom-2 duration-300">
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

                {/* Customer Name Input */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-coffee-100)] space-y-3">
                    <label htmlFor="name" className="block font-bold text-[var(--color-coffee-800)]">
                        Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kla"
                        className="w-full p-3 bg-[var(--color-background)] border border-[var(--color-coffee-200)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-[var(--color-coffee-500)]">We will call this name when your order is ready.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-coffee-100)] p-4 safe-area-bottom">
                <div className="flex justify-between items-center mb-4 text-lg font-bold text-[var(--color-coffee-900)]">
                    <span>Total</span>
                    <span className="text-[var(--color-primary)]">฿{total}</span>
                </div>
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleNext}
                    disabled={!name.trim() || cart.length === 0}
                >
                    Next Step (Select Receipt)
                </Button>
            </div>
        </div>
    );
}
