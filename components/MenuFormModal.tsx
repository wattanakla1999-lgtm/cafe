import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { MenuItem, Category } from "../data/mock";
import { Button } from "./Button";
import { Combobox } from "./Combobox";
import { supabase } from "../lib/supabase";
import { compressImage } from "../lib/image-utils";
import { validateFile, sanitizeInput } from "../lib/security";

interface MenuFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: MenuItem | null;
    onSubmit: (data: Omit<MenuItem, "id">) => void;
}

export function MenuFormModal({ isOpen, onClose, initialData, onSubmit }: MenuFormModalProps) {
    const { menuItems, categories, toppings } = useMenu();

    const [formData, setFormData] = useState<Omit<MenuItem, "id">>({
        name: "",
        price: 0,
        category: "",
        description: "",
        image: "",
        available: true,
        allowedToppings: [],
        allowTypeSelection: false,
        allowBeanSelection: false,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    price: initialData.price,
                    category: initialData.category,
                    description: initialData.description || "",
                    image: initialData.image || "",
                    available: initialData.available !== undefined ? initialData.available : true,
                    allowedToppings: initialData.allowedToppings || [],
                    allowTypeSelection: initialData.allowTypeSelection || false,
                    allowBeanSelection: initialData.allowBeanSelection || false,
                });
                setPreviewUrl(initialData.image || "");
            } else {
                setFormData({
                    name: "",
                    price: 0,
                    category: "",
                    description: "",
                    image: "",
                    available: true,
                    allowedToppings: [],
                    allowTypeSelection: false,
                    allowBeanSelection: false,
                });
                setPreviewUrl("");
            }
            setImageFile(null);
            setUploading(false);
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Security: Validate file
            const { valid, error } = validateFile(file);
            if (!valid) {
                alert(error);
                // Clear input
                e.target.value = "";
                return;
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            // Security: Ensure random filename to prevent overwrites/predictability
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const finalFileName = fileName.replace(/\.[^/.]+$/, ".jpg");

            // Compress image if needed (limit 5MB)
            const compressedFile = await compressImage(file, 5);

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(finalFileName, compressedFile);

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('menu-images')
                .getPublicUrl(finalFileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert("Failed to upload image. Please try again.");
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalImageUrl = formData.image;

        if (imageFile) {
            setUploading(true);
            const uploadedUrl = await uploadImage(imageFile);
            setUploading(false);

            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            } else {
                return; // Stop submission on upload failure
            }
        }

        // Security: Sanitize inputs before submitting
        onSubmit({
            ...formData,
            name: sanitizeInput(formData.name),
            description: sanitizeInput(formData.description || ""),
            category: sanitizeInput(formData.category),
            image: finalImageUrl
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center bg-[var(--color-coffee-50)] sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">
                        {initialData ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-coffee-100)] rounded-full text-[var(--color-coffee-500)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-full h-48 bg-[var(--color-coffee-50)] border-2 border-dashed border-[var(--color-coffee-200)] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors cursor-pointer">
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-bold">เปลี่ยนรูปภาพ</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-[var(--color-coffee-400)] flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>คลิกเพื่ออัปโหลดรูปภาพ</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-[var(--color-coffee-400)] mt-2">แนะนำ: รูปสี่เหลี่ยมจัตุรัส หรือ 4:3, ขนาดไม่เกิน 5MB</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ชื่อเมนู</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="เช่น ลาเต้เย็น"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ราคา (บาท)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">หมวดหมู่</label>
                        <div className="relative">
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all appearance-none bg-white"
                            >
                                <option value="" disabled>เลือกหมวดหมู่</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-[var(--color-coffee-500)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">รายละเอียด</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            rows={3}
                            placeholder="บรรยายรสชาติ ส่วนผสม ฯลฯ"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-2">ท็อปปิ้งที่เลือกได้</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-[var(--color-coffee-100)] rounded-lg bg-[var(--color-coffee-50)]">
                            {toppings.map(t => (
                                <label key={t.id} className="flex items-center space-x-2 bg-white p-2 rounded border border-[var(--color-coffee-100)] cursor-pointer hover:border-[var(--color-primary)]">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowedToppings?.includes(t.id)}
                                        onChange={e => {
                                            const current = formData.allowedToppings || [];
                                            if (e.target.checked) {
                                                setFormData({ ...formData, allowedToppings: [...current, t.id] });
                                            } else {
                                                setFormData({ ...formData, allowedToppings: current.filter(id => id !== t.id) });
                                            }
                                        }}
                                        className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="text-sm text-[var(--color-coffee-700)]">{t.name}</span>
                                </label>
                            ))}
                            {toppings.length === 0 && <p className="text-xs text-gray-500 col-span-2 text-center py-2">ไม่มีท็อปปิ้ง</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-[var(--color-coffee-50)] p-3 rounded-lg border border-[var(--color-coffee-100)]">
                            <div className="flex items-center h-5">
                                <input
                                    id="allowType"
                                    type="checkbox"
                                    checked={formData.allowTypeSelection}
                                    onChange={e => setFormData({ ...formData, allowTypeSelection: e.target.checked })}
                                    className="w-5 h-5 text-[var(--color-primary)] border-[var(--color-coffee-300)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="allowType" className="font-bold text-[var(--color-coffee-800)] cursor-pointer select-none">
                                    รูปแบบการเสิร์ฟ
                                </label>
                                <p className="text-[var(--color-coffee-500)] text-xs">ร้อน, เย็น, ปั่น</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-[var(--color-coffee-50)] p-3 rounded-lg border border-[var(--color-coffee-100)]">
                            <div className="flex items-center h-5">
                                <input
                                    id="allowBean"
                                    type="checkbox"
                                    checked={formData.allowBeanSelection}
                                    onChange={e => setFormData({ ...formData, allowBeanSelection: e.target.checked })}
                                    className="w-5 h-5 text-[var(--color-primary)] border-[var(--color-coffee-300)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="allowBean" className="font-bold text-[var(--color-coffee-800)] cursor-pointer select-none">
                                    เมล็ดกาแฟ
                                </label>
                                <p className="text-[var(--color-coffee-500)] text-xs">คั่วเข้ม, คั่วกลาง, คั่วอ่อน</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[var(--color-coffee-50)] p-3 rounded-lg border border-[var(--color-coffee-100)]">
                        <div className="flex items-center h-5">
                            <input
                                id="available"
                                type="checkbox"
                                checked={formData.available}
                                onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                className="w-5 h-5 text-[var(--color-primary)] border-[var(--color-coffee-300)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                            />
                        </div>
                        <div className="text-sm">
                            <label htmlFor="available" className="font-bold text-[var(--color-coffee-800)] cursor-pointer select-none">
                                เปิดขาย
                            </label>
                            <p className="text-[var(--color-coffee-500)] text-xs">เอาติ๊กออกเพื่อซ่อนเมนูนี้ชั่วคราว</p>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" fullWidth onClick={onClose} className="py-3" disabled={uploading}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" variant="primary" fullWidth className="py-3 shadow-lg shadow-orange-200" disabled={uploading}>
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังอัปโหลด...
                                </span>
                            ) : (
                                initialData ? "บันทึกการเปลี่ยนแปลง" : "สร้างเมนู"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
