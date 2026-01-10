"use client";

import React, { useState, useEffect } from "react";
import { Discount, useMenu } from "../context/MenuContext";
import { Button } from "./Button";

interface DiscountManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DiscountManagerModal({ isOpen, onClose }: DiscountManagerModalProps) {
    const { discounts, addDiscount, updateDiscount, deleteDiscount } = useMenu();

    // State
    const [mode, setMode] = useState<"list" | "edit" | "add">("list");
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [name, setName] = useState("");
    const [value, setValue] = useState<number>(0);
    const [type, setType] = useState<"percent" | "amount">("percent");
    const [error, setError] = useState("");

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode("list");
            setEditingDiscount(null);
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartAdd = () => {
        setMode("add");
        setEditingDiscount(null);
        setName("");
        setValue(0);
        setType("percent");
        setError("");
    };

    const handleStartEdit = (discount: Discount) => {
        setMode("edit");
        setEditingDiscount(discount);
        setName(discount.name);
        setValue(discount.value);
        setType(discount.type);
        setError("");
    };

    const handleSave = () => {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (value < 0) {
            setError("Value must be non-negative");
            return;
        }

        if (mode === "add") {
            addDiscount({
                name: name.trim(),
                value: value,
                type: type,
                active: true
            });
        } else if (mode === "edit" && editingDiscount) {
            updateDiscount(editingDiscount.id, {
                name: name.trim(),
                value: value,
                type: type
            });
        }

        setMode("list");
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this discount?")) {
            deleteDiscount(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center bg-[var(--color-coffee-50)]">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">
                        {mode === "list" ? "Manage Discounts" : mode === "add" ? "New Discount" : "Edit Discount"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-coffee-100)] rounded-full transition-colors text-[var(--color-coffee-500)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {mode === "list" ? (
                        <div className="space-y-2">
                            {discounts.length === 0 ? (
                                <div className="text-center text-[var(--color-coffee-400)] text-sm py-8">No discounts created</div>
                            ) : (
                                discounts.map((discount) => (
                                    <div key={discount.id} className="flex items-center justify-between p-3 bg-white border border-[var(--color-coffee-100)] rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${discount.type === 'percent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {discount.type === 'percent' ? '%' : '฿'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[var(--color-coffee-800)]">{discount.name}</div>
                                                <div className="text-xs text-[var(--color-coffee-500)]">
                                                    {discount.type === 'percent' ? `${discount.value}% Off` : `฿${discount.value} Off`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStartEdit(discount)}
                                                className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(discount.id)}
                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="bg-[var(--color-coffee-50)] p-4 rounded-xl space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 10% Off"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Value</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={value}
                                        onChange={(e) => setValue(Number(e.target.value))}
                                        className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as "percent" | "amount")}
                                        className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    >
                                        <option value="percent">% Off</option>
                                        <option value="amount">฿ Off</option>
                                    </select>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[var(--color-coffee-100)] bg-[var(--color-coffee-50)] flex gap-3">
                    {mode === "list" ? (
                        <>
                            <Button fullWidth variant="outline" onClick={onClose}>Close</Button>
                            <Button fullWidth onClick={handleStartAdd} variant="primary">Add New Discount</Button>
                        </>
                    ) : (
                        <>
                            <Button fullWidth variant="outline" onClick={() => setMode("list")}>Cancel</Button>
                            <Button fullWidth onClick={handleSave} variant="primary">Save Discount</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
