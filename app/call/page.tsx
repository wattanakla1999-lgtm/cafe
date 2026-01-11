"use client";

import React, { useEffect, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function CallPage() {
    const { currentCalling } = useOrder();
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (currentCalling) {
            setHistory(prev => [currentCalling, ...prev].slice(0, 5));
            // Play sound? (Optional, browser blocks auto-play usually)
        }
    }, [currentCalling]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-coffee-900)] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">

                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[var(--color-primary)] blur-3xl"></div>
                </div>

                <div className="z-10 w-full max-w-4xl space-y-12">
                    <h1 className="text-[var(--color-coffee-200)] text-3xl font-light uppercase tracking-[0.2em]">กำลังให้บริการ</h1>

                    {currentCalling ? (
                        <div className="animate-in zoom-in duration-500">
                            <div className="text-white text-9xl font-bold mb-4 drop-shadow-2xl">
                                {currentCalling}
                            </div>
                            <div className="text-[var(--color-primary)] text-4xl font-medium animate-pulse">
                                ออเดอร์ของคุณพร้อมแล้ว!
                            </div>
                        </div>
                    ) : (
                        <div className="text-[var(--color-coffee-400)] text-6xl font-thin italic">
                            รอเรียกคิว...
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div className="mt-20 pt-10 border-t border-white/10">
                            <h3 className="text-[var(--color-coffee-300)] text-xl mb-6 uppercase tracking-widest">เรียกคิวไปแล้วก่อนหน้า</h3>
                            <div className="flex flex-wrap justify-center gap-4">
                                {history.map((name, i) => (
                                    <span key={i} className="px-6 py-3 bg-white/5 rounded-full text-white/60 text-xl backdrop-blur-sm">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
