import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { MenuItem, Category } from "../data/mock";
import { Button } from "./Button";
import { Combobox } from "./Combobox";

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
        category: "Coffee",
        description: "",
        image: "",
        available: true,
        allowedToppings: [],
    });

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
                });
            } else {
                setFormData({
                    name: "",
                    price: 0,
                    category: "Coffee",
                    description: "",
                    image: "",
                    available: true,
                    allowedToppings: [],
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
                <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center bg-[var(--color-coffee-50)]">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">
                        {initialData ? "Edit Menu Item" : "Add New Item"}
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
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Item Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="e.g. Iced Latte"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Price (฿)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            />
                        </div>
                        <div>
                            <Combobox
                                label="Category"
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val })}
                                options={categories}
                                placeholder="Select or type new..."
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            rows={3}
                            placeholder="Describe the taste, ingredients, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Image URL</label>
                        <input
                            type="url"
                            value={formData.image}
                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                            className="w-full p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="https://images.unsplash.com/..."
                        />
                        <p className="text-xs text-[var(--color-coffee-400)] mt-1">Recommended aspect ratio: 4:3</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-2">Allowed Toppings</label>
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
                            {toppings.length === 0 && <p className="text-xs text-gray-500 col-span-2 text-center py-2">No toppings available</p>}
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
                                Available for Sale
                            </label>
                            <p className="text-[var(--color-coffee-500)] text-xs">Uncheck to hide this item from the menu temporarily.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" fullWidth onClick={onClose} className="py-3">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" fullWidth className="py-3 shadow-lg shadow-orange-200">
                            {initialData ? "Save Changes" : "Create Item"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
