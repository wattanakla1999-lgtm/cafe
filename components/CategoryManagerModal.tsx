"use client";

import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";
import { useConfirm } from "../context/ConfirmContext";

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
    const { menuItems, categories, updateCategory, deleteCategory, addCategory } = useMenu();
    const { confirm } = useConfirm();

    // State
    const [mode, setMode] = useState<"list" | "edit" | "add">("list");
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [error, setError] = useState("");

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode("list");
            setEditingCategory(null);
            setError("");
            setCategoryName("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartAdd = () => {
        setMode("add");
        setCategoryName("");
        setEditingCategory(null);
        setError("");
    };

    const handleStartEdit = (cat: string) => {
        setMode("edit");
        setCategoryName(cat);
        setEditingCategory(cat);
        setError("");
    };

    const handleSave = () => {
        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setError("Category name is required");
            return;
        }

        if (mode === "add") {
            if (categories.includes(trimmedName)) {
                setError("Category already exists");
                return;
            }
            addCategory(trimmedName);
        } else if (mode === "edit" && editingCategory) {
            if (trimmedName !== editingCategory && categories.includes(trimmedName)) {
                setError("Category already exists");
                return;
            }
            updateCategory(editingCategory, trimmedName);
        }

        setMode("list");
    };

    const handleDelete = async (cat: string) => {
        const count = menuItems.filter(i => i.category === cat).length;
        const confirmed = await confirm({
            title: "ลบหมวดหมู่นี้?",
            message: `คุณแน่ใจหรือไม่? รายการ ${count} รายการจะถูกย้ายไปที่ "Uncategorized"`,
            confirmText: "ลบหมวดหมู่",
            cancelText: "ยกเลิก",
            variant: "warning"
        });

        if (confirmed) {
            deleteCategory(cat);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[var(--color-coffee-50)] p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[var(--color-coffee-900)]">
                        {mode === "list" ? "จัดการหมวดหมู่" : mode === "add" ? "เพิ่มหมวดหมู่ใหม่" : "แก้ไขหมวดหมู่"}
                    </h3>
                    <button onClick={onClose} className="text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-700)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {mode === "list" ? (
                        <div className="space-y-3">
                            {categories.map(cat => (
                                <div key={cat} className="flex items-center justify-between p-3 bg-white border border-[var(--color-coffee-100)] rounded-xl shadow-sm">
                                    <span className="font-bold text-[var(--color-coffee-800)]">{cat}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStartEdit(cat)}
                                            className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ชื่อหมวดหมู่</label>
                                <input
                                    type="text"
                                    value={categoryName}
                                    maxLength={50}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder="เช่น กาแฟ"
                                    className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[var(--color-coffee-50)] border-t border-[var(--color-coffee-100)] flex gap-3">
                    {mode === "list" ? (
                        <>
                            <Button fullWidth variant="outline" onClick={onClose}>ปิด</Button>
                            <Button fullWidth onClick={handleStartAdd} variant="primary">เพิ่มหมวดหมู่</Button>
                        </>
                    ) : (
                        <>
                            <Button fullWidth variant="outline" onClick={() => setMode("list")}>ยกเลิก</Button>
                            <Button fullWidth onClick={handleSave} variant="primary">บันทึก</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
