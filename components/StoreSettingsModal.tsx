"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";
import { supabase } from "../lib/supabase";

interface StoreSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StoreSettingsModal({ isOpen, onClose }: StoreSettingsModalProps) {
    const { user, updateStoreSettings } = useAuth();
    const [storeName, setStoreName] = useState(user?.storeName || "");
    const [address, setAddress] = useState(user?.address || "");
    const [taxType, setTaxType] = useState<'none' | 'include' | 'exclude'>(user?.taxType || 'none');
    const [vatRate, setVatRate] = useState<number>(user?.vatRate || 7);

    const [imagePreview, setImagePreview] = useState<string | null>(user?.storeImage || null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state when modal opens or user changes
    React.useEffect(() => {
        if (isOpen && user) {
            setStoreName(user.storeName || "");
            setAddress(user.address || "");
            setTaxType(user.taxType || 'none');
            setVatRate(user.vatRate || 7);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload Logic
            if (user?.storeId) {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `store-${user.storeId}-${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // Upload to 'store-images' or 'menu-images' (using menu-images for now as likely available)
                    // Better to use dedicated bucket if possible, let's try 'menu-images' since we know it exists from MenuContext viewing
                    // Or check if user has 'store-images'. 
                    // Let's assume 'menu-images' works or fallback to just logic.
                    // Actually, 'menu-images' is public.

                    const { error: uploadError } = await supabase.storage
                        .from('menu-images')
                        .upload(filePath, file);

                    if (uploadError) {
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('menu-images')
                        .getPublicUrl(filePath);

                    // We will save this URL on 'Save' click or maybe immediately?
                    // Better to save immediately to state so handleSave picks it up, 
                    // but we need to distinguish between "preview blob" and "uploaded url".
                    // Let's store uploadedUrl in state.
                    setUploadedImageUrl(publicUrl);

                } catch (error) {
                    console.error("Error uploading image:", error);
                    alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
                }
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const updates: any = {
            storeName,
            address,
            taxType,
            vatRate
        };

        if (uploadedImageUrl) {
            updates.storeImage = uploadedImageUrl;
        }

        const result = await updateStoreSettings(updates);

        setIsSaving(false);
        if (result.success) {
            onClose();
        } else {
            alert("บันทึกไม่สำเร็จ: " + result.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">ตั้งค่าร้านค้า</h2>
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
                                    <span className="text-[10px] font-bold">อัปโหลดโลโก้</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">เปลี่ยน</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* Store Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)]">ชื่อร้านค้า</label>
                        <input
                            type="text"
                            maxLength={100}
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full p-3 rounded-lg border border-[var(--color-coffee-200)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="My Awesome Cafe"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)]">ที่อยู่ (สำหรับใบเสร็จ)</label>
                        <textarea
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-3 rounded-lg border border-[var(--color-coffee-200)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                            placeholder="123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110"
                        />
                    </div>

                    {/* Tax Settings */}
                    <div className="space-y-3 pt-4 border-t border-[var(--color-coffee-100)]">
                        <h3 className="text-sm font-bold text-[var(--color-coffee-900)]">การตั้งค่าภาษี (Tax & VAT)</h3>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTaxType('none')}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${taxType === 'none'
                                    ? 'bg-[var(--color-coffee-600)] text-white border-[var(--color-coffee-600)]'
                                    : 'bg-white text-[var(--color-coffee-600)] border-[var(--color-coffee-200)] hover:bg-[var(--color-coffee-50)]'}`}
                            >
                                ไม่มี VAT
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaxType('include')}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${taxType === 'include'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-coffee-600)] border-[var(--color-coffee-200)] hover:bg-[var(--color-coffee-50)]'}`}
                            >
                                รวม VAT (Include)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaxType('exclude')}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${taxType === 'exclude'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-coffee-600)] border-[var(--color-coffee-200)] hover:bg-[var(--color-coffee-50)]'}`}
                            >
                                แยก VAT (Exclude)
                            </button>
                        </div>

                        {taxType !== 'none' && (
                            <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-sm text-[var(--color-coffee-600)] font-medium">อัตราภาษี (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={vatRate}
                                    onChange={(e) => setVatRate(Number(e.target.value))}
                                    className="w-24 p-2 rounded-lg border border-[var(--color-coffee-200)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-center font-bold"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-[var(--color-coffee-50)] flex gap-3 justify-end sticky bottom-0 z-10 border-t border-[var(--color-coffee-100)]">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={isSaving || !storeName.trim()}>
                        {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
