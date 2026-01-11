"use client";

import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";
import { Option } from "../data/mock";

interface ServingTypeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ServingTypeManagerModal({ isOpen, onClose }: ServingTypeManagerModalProps) {
    const { servingTypes, addServingType, updateServingType, deleteServingType } = useMenu();

    const [mode, setMode] = useState<"list" | "edit" | "add">("list");
    const [editingType, setEditingType] = useState<Option | null>(null);
    const [formData, setFormData] = useState({ name: "", price: 0 });
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setMode("list");
            setEditingType(null);
            setError("");
            setFormData({ name: "", price: 0 });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartAdd = () => {
        setMode("add");
        setFormData({ name: "", price: 0 });
        setEditingType(null);
        setError("");
    };

    const handleStartEdit = (type: Option) => {
        setMode("edit");
        setFormData({ name: type.name, price: type.price });
        setEditingType(type);
        setError("");
    };

    const handleSave = async () => {
        const trimmedName = formData.name.trim();

        if (!trimmedName) {
            setError("Name is required");
            return;
        }

        if (mode === "add") {
            await addServingType({ name: trimmedName, price: formData.price });
        } else if (mode === "edit" && editingType) {
            await updateServingType(editingType.id, { name: trimmedName, price: formData.price });
        }

        setMode("list");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this serving type?")) {
            await deleteServingType(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[var(--color-coffee-50)] p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[var(--color-coffee-900)]">
                        {mode === "list" ? "จัดการรูปแบบการเสิร์ฟ" : mode === "add" ? "เพิ่มรูปแบบใหม่" : "แก้ไขรูปแบบ"}
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
                            {servingTypes.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">ยังไม่มีรูปแบบการเสิร์ฟ</p>
                            ) : (
                                servingTypes.map(type => (
                                    <div key={type.id} className="flex items-center justify-between p-3 bg-white border border-[var(--color-coffee-100)] rounded-xl shadow-sm">
                                        <div>
                                            <span className="font-bold text-[var(--color-coffee-800)]">{type.name}</span>
                                            <span className="text-sm text-[var(--color-coffee-500)] ml-2">
                                                {type.price > 0 ? `+฿${type.price}` : "ฟรี"}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStartEdit(type)}
                                                className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ชื่อรูปแบบ</label>
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ร้อน, เย็น"
                                    className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ราคาเพิ่ม (฿)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
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
                            <Button fullWidth onClick={handleStartAdd} variant="primary">เพิ่มรูปแบบใหม่</Button>
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
