"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

interface StoreSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StoreSettingsModal({ isOpen, onClose }: StoreSettingsModalProps) {
    const { user, updateUser } = useAuth();
    const [storeName, setStoreName] = useState(user?.storeName || "");
    const [imagePreview, setImagePreview] = useState<string | null>(user?.storeImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate network delay
        setTimeout(() => {
            updateUser({
                storeName,
                storeImage: imagePreview || undefined
            });
            setIsSaving(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">Store Settings</h2>
                    <button onClick={onClose} className="text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-600)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Store Image Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-24 h-24 rounded-full bg-[var(--color-coffee-50)] border-2 border-dashed border-[var(--color-coffee-200)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-colors relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Store Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-[var(--color-coffee-400)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[10px] font-bold">Upload Logo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <p className="text-xs text-[var(--color-coffee-500)]">Recommended: Square image (PNG/JPG)</p>
                    </div>

                    {/* Store Name Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)]">Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full p-3 rounded-lg border border-[var(--color-coffee-200)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="My Awesome Cafe"
                        />
                    </div>
                </div>

                <div className="p-6 bg-[var(--color-coffee-50)] flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || !storeName.trim()}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
