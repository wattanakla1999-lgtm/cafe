"use client";

import React from "react";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";

interface OrderQRModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderQRModal({ isOpen, onClose }: OrderQRModalProps) {
    const { user } = useAuth();

    if (!isOpen) return null;

    // Use a public QR code generator API for the mock
    // In a real app, this would be generated locally or by the backend
    // The target URL is the menu page
    const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleSimulateScan = () => {
        window.open(targetUrl, "_blank");
        onClose();
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(qrApiUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cafe-qr-code.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download QR code:', error);
            alert('Failed to download QR code');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-600)] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        {user?.storeImage && (
                            <img src={user.storeImage} alt="Store Logo" className="w-16 h-16 rounded-full object-cover border border-[var(--color-coffee-200)] shadow-sm" />
                        )}
                        <h3 className="text-2xl font-bold text-[var(--color-coffee-900)]">Scan to Order</h3>
                        <p className="text-[var(--color-coffee-600)] text-sm">Table 1</p>
                    </div>

                    <div
                        className="bg-white p-4 rounded-xl border-2 border-dashed border-[var(--color-coffee-200)] mx-auto w-fit cursor-pointer hover:border-[var(--color-primary)] transition-colors group relative"
                        onClick={handleSimulateScan}
                        title="Click to simulate client scan"
                    >
                        <img src={qrApiUrl} alt="Order QR Code" className="w-48 h-48 block" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-[var(--color-primary)] shadow-sm">Click to Test</span>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--color-coffee-500)]">
                        Show this QR code to customers to let them order from their phone.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={handleDownload}
                            fullWidth
                            variant="primary"
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            {isDownloading ? "Downloading..." : "Download QR Image"}
                        </Button>
                        <Button onClick={onClose} fullWidth variant="outline">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
