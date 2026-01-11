"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "./Button";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

interface ReceiptPopupProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string | null;
}

export function ReceiptPopup({ isOpen, onClose, orderId }: ReceiptPopupProps) {
    const { user } = useAuth();
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
                        <h3 className="text-xl font-bold text-[var(--color-coffee-900)]">รับออเดอร์แล้ว!</h3>
                        <p className="text-[var(--color-coffee-600)]">ลูกค้าต้องการใบเสร็จหรือไม่?</p>

                        <div className="grid gap-3">
                            <Button onClick={handleShowQR} fullWidth variant="primary">
                                ใช่, แสดง QR ใบเสร็จ
                            </Button>
                            <Button onClick={handleClose} fullWidth variant="secondary">
                                ไม่รับใบเสร็จ
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            {user?.storeImage && (
                                <img src={user.storeImage} alt="Store Logo" className="w-16 h-16 rounded-full object-cover border border-[var(--color-coffee-200)]" />
                            )}
                            <h3 className="text-xl font-bold text-[var(--color-coffee-900)]">สแกนรับใบเสร็จ</h3>
                        </div>
                        <div className="bg-white mx-auto rounded-xl p-2 flex items-center justify-center border border-[var(--color-coffee-200)]">
                            {orderId ? (
                                <QRCode
                                    value={`${window.location.origin}/receipt?id=${orderId}`}
                                    size={160}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            ) : (
                                <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-xs">No Order ID</div>
                            )}
                        </div>
                        <p className="text-sm text-[var(--color-coffee-500)]">กรุณาให้ลูกค้าสแกน QR นี้เพื่อรับใบเสร็จ</p>
                        <Button onClick={handleClose} fullWidth variant="outline">
                            ปิด
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}
