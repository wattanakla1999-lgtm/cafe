"use client";

import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";
import { Option } from "../data/mock";

interface ToppingManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ToppingManagerModal({ isOpen, onClose }: ToppingManagerModalProps) {
    const { toppings, addTopping, updateTopping, deleteTopping } = useMenu();
    const [editingTopping, setEditingTopping] = useState<Option | null>(null);
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [mode, setMode] = useState<"list" | "edit" | "add">("list");
    const [error, setError] = useState("");

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode("list");
            setEditingTopping(null);
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEdit = (topping: Option) => {
        setEditingTopping(topping);
        setNewName(topping.name);
        setNewPrice(topping.price.toString());
        setMode("edit");
        setError("");
    };

    const handleAdd = () => {
        setEditingTopping(null);
        setNewName("");
        setNewPrice("0");
        setMode("add");
        setError("");
    };

    const handleSave = () => {
        if (!newName.trim()) {
            setError("Topping name is required");
            return;
        }

        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            setError("Price must be a valid non-negative number");
            return;
        }

        if (mode === "edit" && editingTopping) {
            updateTopping(editingTopping.id, {
                name: newName.trim(),
                price: price
            });
        } else {
            const newTopping: Option = {
                id: `t_${Date.now()}`,
                name: newName.trim(),
                price: price
            };
            addTopping(newTopping);
        }

        setMode("list");
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this topping? This action cannot be undone.")) {
            deleteTopping(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[var(--color-coffee-50)] p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[var(--color-coffee-900)]">
                        {mode === "list" ? "Manage Toppings" : mode === "add" ? "New Topping" : "Edit Topping"}
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
                            {toppings.length === 0 ? (
                                <p className="text-center text-[var(--color-coffee-400)] py-8">No toppings yet</p>
                            ) : (
                                toppings.map(topping => (
                                    <div key={topping.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--color-coffee-100)] shadow-sm">
                                        <div>
                                            <p className="font-bold text-[var(--color-coffee-800)]">{topping.name}</p>
                                            <p className="text-sm text-[var(--color-coffee-500)]">+฿{topping.price}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(topping)}
                                                className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(topping.id)}
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
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Topping Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Extra Shot"
                                    className="w-full p-2 border border-[var(--color-coffee-200)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Price (฿)</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    placeholder="0"
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
                            <Button fullWidth variant="outline" onClick={onClose}>Close</Button>
                            <Button fullWidth onClick={handleAdd} variant="primary">Add New Topping</Button>
                        </>
                    ) : (
                        <>
                            <Button fullWidth variant="outline" onClick={() => setMode("list")}>Cancel</Button>
                            <Button fullWidth onClick={handleSave} variant="primary">Save Topping</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
