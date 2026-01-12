"use client";

import React from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputValue?: string) => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning";
    inputConfig?: {
        placeholder?: string;
        required?: boolean;
    };
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "ยืนยันการดำเนินการ",
    message,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
    variant = "danger",
    inputConfig
}: ConfirmDialogProps) {
    const [inputValue, setInputValue] = React.useState("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputConfig?.required && !inputValue.trim()) {
            return; // Simple validation
        }
        onConfirm(inputValue); // Pass input value back
        setInputValue("");
        onClose();
    };

    const handleClose = () => {
        setInputValue("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Icon Header */}
                <div className={`p-6 text-center ${variant === "danger" ? "bg-red-50" : "bg-amber-50"}`}>
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${variant === "danger" ? "bg-red-100" : "bg-amber-100"}`}>
                        {variant === "danger" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--color-coffee-900)] mb-2 text-center">
                        {title}
                    </h3>
                    <p className="text-[var(--color-coffee-600)] text-center leading-relaxed">
                        {message}
                    </p>
                    {inputConfig && (
                        <div className="mt-4">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputConfig.placeholder || "กรุณากรอกข้อมูล..."}
                                className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none text-sm"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={handleClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleConfirm}
                        className={variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
