"use client";

import React, { useState } from "react";
import { Button } from "./Button";
import Link from "next/link";

interface ReceiptPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReceiptPopup({ isOpen, onClose }: ReceiptPopupProps) {
    const [showQR, setShowQR] = useState(false);

    if (!isOpen) return null;

    const handleShowQR = () => {
        setShowQR(true);
    };

    const handleClose = () => {
        setShowQR(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">

                {!showQR ? (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-[var(--color-coffee-900)]">Order Confirmed!</h3>
                        <p className="text-[var(--color-coffee-600)]">Does the customer want a receipt?</p>

                        <div className="grid gap-3">
                            <Button onClick={handleShowQR} fullWidth variant="primary">
                                Yes, Show Receipt QR
                            </Button>
                            <Button onClick={handleClose} fullWidth variant="secondary">
                                No Receipt
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-[var(--color-coffee-900)]">Scan for Receipt</h3>
                        <div className="bg-[var(--color-coffee-100)] w-48 h-48 mx-auto rounded-xl flex items-center justify-center">
                            <span className="text-sm text-[var(--color-coffee-500)]">[QR Code]</span>
                        </div>
                        <p className="text-sm text-[var(--color-coffee-500)]">Please ask customer to scan this QR.</p>
                        <Button onClick={handleClose} fullWidth variant="outline">
                            Close
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}
