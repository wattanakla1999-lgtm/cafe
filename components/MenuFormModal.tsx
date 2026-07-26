import React, { useState, useEffect, useRef } from "react";
import { useMenu } from "../context/MenuContext";
import { MenuItem, Category } from "../data/mock";
import { Button } from "./Button";
import { useTour } from "../context/TourContext";
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
    const { menuItems, categories, toppings, addCategory, addTopping, servingTypes } = useMenu();
    const { isActive, currentTourStep, nextStep } = useTour();

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
        allowSweetnessSelection: false,
        isRecommended: false,
    });
    const [priceInput, setPriceInput] = useState<string>("");
    const [showQuickCategoryAdd, setShowQuickCategoryAdd] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showQuickToppingAdd, setShowQuickToppingAdd] = useState(false);
    const [newToppingName, setNewToppingName] = useState("");
    const [newToppingPrice, setNewToppingPrice] = useState("");

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
                    allowSweetnessSelection: initialData.allowSweetnessSelection || false,
                    isRecommended: initialData.isRecommended || false,
                });
                setPriceInput(initialData.price.toString());
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
                    allowSweetnessSelection: false,
                    isRecommended: false,
                });
                setPriceInput("");
                setPreviewUrl("");
            }
            setImageFile(null);
            setUploading(false);
        }
    }, [isOpen, initialData]);

    // Auto-advance tour when modal opens
    useEffect(() => {
        if (isOpen && currentTourStep?.id === 'add-menu') {
            setTimeout(() => {
                nextStep();
            }, 500);
        }

        // Auto-close if tour moves away from menu form steps
        if (isOpen && currentTourStep) {
            const menuSteps = ['add-menu', 'menu-name', 'menu-price', 'menu-category', 'create-category-start', 'create-category-input', 'create-category-confirm', 'menu-save'];
            if (!menuSteps.includes(currentTourStep.id) && currentTourStep.page === "/admin/menu") {
                onClose();
            }
        }
    }, [isOpen, currentTourStep, nextStep, onClose]);

    // Tour Integration: Auto-fill data for demo purposes
    useEffect(() => {
        if (!isActive || !currentTourStep || !isOpen) return;

        if (currentTourStep.id === "menu-name") {
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: "อเมริกาโน่เย็น" }));
            }
        }
        else if (currentTourStep.id === "menu-price") {
            if (!formData.price || formData.price === 0) {
                setFormData(prev => ({ ...prev, price: 60 }));
                setPriceInput("60");
            }
        }
        else if (currentTourStep.id === "create-category-input") {
            if (!newCategoryName) {
                setNewCategoryName("Coffee");
            }
        }
    }, [isActive, currentTourStep, isOpen, formData.name, formData.price, newCategoryName]);

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
                .upload(finalFileName, compressedFile, { upsert: true });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('menu-images')
                .getPublicUrl(finalFileName);

            return data.publicUrl;
        } catch (error: any) {
            console.error('Error uploading image:', error);
            const errorMsg = error?.message || '';
            if (errorMsg.toLowerCase().includes('bucket not found') || error?.statusCode === 400 || error?.status === 400) {
                alert("ไม่พบ Bucket 'menu-images' ใน Supabase Storage\n\nกรุณาสร้าง Bucket ชื่อ 'menu-images' (ตั้งเป็น Public) ใน Supabase Dashboard หรือรันคำสั่ง SQL ที่เตรียมไว้ให้ครับ");
            } else {
                alert(`อัปโหลดรูปไม่สำเร็จ: ${errorMsg || 'กรุณาลองใหม่อีกครั้ง'}`);
            }
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-insert default serving types if user enables it for the first time
        if (formData.allowTypeSelection && servingTypes.length === 0) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: storeData } = await supabase
                        .from("stores")
                        .select("id")
                        .eq("user_id", user.id)
                        .single();

                    if (storeData) {
                        await supabase.from("serving_types").insert([
                            { store_id: storeData.id, name: "ร้อน", price: 0 },
                            { store_id: storeData.id, name: "เย็น", price: 0 },
                            { store_id: storeData.id, name: "ปั่น", price: 0 }
                        ]);
                    }
                }
            } catch (error) {
                console.error("Error creating default serving types:", error);
            }
        }

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
                            maxLength={100}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="เช่น ลาเต้เย็น"
                            data-tour="menu-name-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ราคา (บาท)</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            maxLength={8}
                            required
                            value={priceInput}
                            onChange={e => {
                                const value = e.target.value;
                                // Allow empty, digits, and one decimal point
                                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                    setPriceInput(value);
                                    setFormData({ ...formData, price: parseFloat(value) || 0 });
                                }
                            }}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="ระบุราคา"
                            data-tour="menu-price-input"
                        />
                    </div>

                    <div data-tour="menu-category-select">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)]">หมวดหมู่</label>
                            {!showQuickCategoryAdd && (
                                <button
                                    type="button"
                                    onClick={() => setShowQuickCategoryAdd(true)}
                                    className="text-xs text-[var(--color-primary)] hover:text-[var(--color-coffee-800)] hover:underline font-medium flex items-center gap-1 transition-colors"
                                    data-tour="create-category-btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    สร้างหมวดหมู่ใหม่
                                </button>
                            )}
                        </div>

                        {showQuickCategoryAdd ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="ชื่อหมวดหมู่ใหม่"
                                        maxLength={50}
                                        className="flex-1 p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                        autoFocus
                                        data-tour="new-category-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmed = newCategoryName.trim();
                                            if (trimmed && !categories.includes(trimmed)) {
                                                addCategory(trimmed);
                                                setFormData({ ...formData, category: trimmed });
                                                setShowQuickCategoryAdd(false);
                                                setNewCategoryName("");
                                            } else if (categories.includes(trimmed)) {
                                                alert("หมวดหมู่นี้มีอยู่แล้ว");
                                            } else {
                                                alert("กรุณาระบุชื่อหมวดหมู่");
                                            }
                                        }}
                                        className="px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg cursor-pointer transition-colors font-medium"
                                        data-tour="new-category-confirm"
                                    >
                                        เพิ่ม
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowQuickCategoryAdd(false);
                                            setNewCategoryName("");
                                        }}
                                        className="px-4 py-2.5 border border-[var(--color-coffee-300)] text-[var(--color-coffee-700)] rounded-lg cursor-pointer hover:bg-[var(--color-coffee-50)] transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                                {categories.length > 0 && (
                                    <p className="text-xs text-[var(--color-coffee-500)]">
                                        หรือเลือกจากหมวดหมู่ที่มีอยู่:
                                    </p>
                                )}
                            </div>
                        ) : null}

                        {!showQuickCategoryAdd && (
                            <div className="relative">
                                <Combobox
                                    value={formData.category}
                                    onChange={(value) => setFormData({ ...formData, category: value })}
                                    options={categories}
                                    placeholder="เลือกหมวดหมู่"
                                />
                            </div>
                        )}

                        {categories.length === 0 && !showQuickCategoryAdd && (
                            <p className="text-xs text-[var(--color-coffee-500)] mt-1">
                                💡 ยังไม่มีหมวดหมู่ กดปุ่ม "สร้างหมวดหมู่ใหม่" ด้านบนเพื่อเพิ่ม
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">รายละเอียด</label>
                        <textarea
                            value={formData.description}
                            maxLength={500}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            rows={3}
                            placeholder="บรรยายรสชาติ ส่วนผสม ฯลฯ"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)]">ท็อปปิ้งที่เลือกได้</label>
                            {!showQuickToppingAdd && (
                                <button
                                    type="button"
                                    onClick={() => setShowQuickToppingAdd(true)}
                                    className="text-xs text-[var(--color-primary)] hover:text-[var(--color-coffee-800)] hover:underline font-medium flex items-center gap-1 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    สร้างท็อปปิ้งใหม่
                                </button>
                            )}
                        </div>

                        {showQuickToppingAdd && (
                            <div className="mb-3 p-3 bg-[var(--color-coffee-50)] border border-[var(--color-coffee-200)] rounded-lg space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newToppingName}
                                        onChange={e => setNewToppingName(e.target.value)}
                                        placeholder="ชื่อท็อปปิ้ง"
                                        maxLength={50}
                                        className="flex-1 p-2 text-sm border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={newToppingPrice}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                                setNewToppingPrice(value);
                                            }
                                        }}
                                        placeholder="ราคา"
                                        maxLength={6}
                                        className="w-20 p-2 text-sm border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmedName = newToppingName.trim();
                                            const price = parseFloat(newToppingPrice);

                                            if (trimmedName && !isNaN(price) && price >= 0) {
                                                addTopping({ name: trimmedName, price: price });
                                                setShowQuickToppingAdd(false);
                                                setNewToppingName("");
                                                setNewToppingPrice("");
                                            } else if (!trimmedName) {
                                                alert("กรุณาระบุชื่อท็อปปิ้ง");
                                            } else {
                                                alert("กรุณาระบุราคาที่ถูกต้อง");
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg cursor-pointer transition-colors font-medium text-sm"
                                    >
                                        เพิ่ม
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowQuickToppingAdd(false);
                                            setNewToppingName("");
                                            setNewToppingPrice("");
                                        }}
                                        className="px-3 py-1.5 border border-[var(--color-coffee-300)] text-[var(--color-coffee-700)] rounded-lg cursor-pointer hover:bg-[var(--color-coffee-50)] transition-colors text-sm"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        )}

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
                            {toppings.length === 0 && !showQuickToppingAdd && (
                                <p className="text-xs text-[var(--color-coffee-500)] col-span-2 text-center py-2">
                                    💡 ยังไม่มีท็อปปิ้ง กดปุ่ม "สร้างท็อปปิ้งใหม่" ด้านบนเพื่อเพิ่ม
                                </p>
                            )}
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

                        <div className="flex items-center gap-3 bg-[var(--color-coffee-50)] p-3 rounded-lg border border-[var(--color-coffee-100)]">
                            <div className="flex items-center h-5">
                                <input
                                    id="allowSweetness"
                                    type="checkbox"
                                    checked={formData.allowSweetnessSelection}
                                    onChange={e => setFormData({ ...formData, allowSweetnessSelection: e.target.checked })}
                                    className="w-5 h-5 text-[var(--color-primary)] border-[var(--color-coffee-300)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="allowSweetness" className="font-bold text-[var(--color-coffee-800)] cursor-pointer select-none">
                                    ระดับความหวาน
                                </label>
                                <p className="text-[var(--color-coffee-500)] text-xs">0%, 25%, 50%, 100%</p>
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

                    {/* Recommended Menu Checkbox */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border-2 border-amber-200">
                        <div className="flex items-center h-5">
                            <input
                                id="isRecommended"
                                type="checkbox"
                                checked={formData.isRecommended}
                                onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })}
                                className="w-5 h-5 text-amber-500 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
                            />
                        </div>
                        <div className="text-sm flex-1">
                            <label htmlFor="isRecommended" className="font-bold text-amber-900 cursor-pointer select-none flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                เมนูแนะนำ
                            </label>
                            <p className="text-amber-700 text-xs mt-0.5">แสดงเมนูนี้ในหมวด "แนะนำ" บนหน้าลูกค้า</p>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" fullWidth onClick={onClose} className="py-3" disabled={uploading}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" variant="primary" fullWidth className="py-3 shadow-lg shadow-orange-200" disabled={uploading} data-tour="menu-save">
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
