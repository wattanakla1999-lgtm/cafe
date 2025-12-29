"use client";

import React, { useState } from "react";
import { MenuItem, MILK_OPTIONS, Option, SWEETNESS_LEVELS, TOPPINGS } from "../data/mock";
import { Button } from "./Button";

interface OptionModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: MenuItem, options: Option[], quantity: number) => void;
}

export function OptionModal({ item, isOpen, onClose, onConfirm }: OptionModalProps) {
    const [sweetness, setSweetness] = useState<Option>(SWEETNESS_LEVELS[3]); // Default 100%
    const [milk, setMilk] = useState<Option>(MILK_OPTIONS[0]); // Default Whole Milk
    const [selectedToppings, setSelectedToppings] = useState<Option[]>([]);
    const [quantity, setQuantity] = useState(1);

    if (!isOpen || !item) return null;

    const toggleTopping = (topping: Option) => {
        if (selectedToppings.find(t => t.id === topping.id)) {
            setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
        } else {
            setSelectedToppings(prev => [...prev, topping]);
        }
    };

    const calculateTotal = () => {
        const base = item.price;
        const milkPrice = milk.price;
        const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        return (base + milkPrice + toppingPrice) * quantity;
    };

    const handleConfirm = () => {
        const allOptions = [sweetness, milk, ...selectedToppings];
        onConfirm(item, allOptions, quantity);
        // Reset state for next use (optional, but good practice)
        setQuantity(1);
        setSelectedToppings([]);
        setSweetness(SWEETNESS_LEVELS[3]);
        setMilk(MILK_OPTIONS[0]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-[var(--color-coffee-50)] p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-[var(--color-coffee-900)]">{item.name}</h3>
                        <p className="text-[var(--color-primary)] font-bold">฿{item.price}</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-coffee-400)] hover:text-[var(--color-coffee-700)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">

                    {/* Sweetness */}
                    <div>
                        <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">Level of Sweetness</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {SWEETNESS_LEVELS.map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => setSweetness(level)}
                                    className={`p-2 rounded-lg border text-sm transition-all ${sweetness.id === level.id
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                            : "border-[var(--color-coffee-200)] text-[var(--color-coffee-700)] bg-white"
                                        }`}
                                >
                                    {level.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Milk Options */}
                    {item.category === "Coffee" || item.category === "Non-Coffee" ? (
                        <div>
                            <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">Milk Option</h4>
                            <div className="space-y-2">
                                {MILK_OPTIONS.map(m => (
                                    <label key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-coffee-100)] active:bg-[var(--color-coffee-50)] cursor-pointer">
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="milk"
                                                checked={milk.id === m.id}
                                                onChange={() => setMilk(m)}
                                                className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                            <span className="ml-3 text-[var(--color-coffee-800)]">{m.name}</span>
                                        </div>
                                        {m.price > 0 && <span className="text-sm text-[var(--color-coffee-500)]">+฿{m.price}</span>}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Toppings */}
                    <div>
                        <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">Toppings</h4>
                        <div className="space-y-2">
                            {TOPPINGS.map(t => (
                                <label key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-coffee-100)] active:bg-[var(--color-coffee-50)] cursor-pointer">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedToppings.find(sel => sel.id === t.id)}
                                            onChange={() => toggleTopping(t)}
                                            className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                                        />
                                        <span className="ml-3 text-[var(--color-coffee-800)]">{t.name}</span>
                                    </div>
                                    <span className="text-sm text-[var(--color-coffee-500)]">+฿{t.price}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-coffee-100)]">
                        <span className="font-bold text-[var(--color-coffee-800)]">Quantity</span>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full bg-[var(--color-coffee-100)] text-[var(--color-coffee-700)] flex items-center justify-center font-bold"
                            >
                                -
                            </button>
                            <span className="text-xl font-bold text-[var(--color-coffee-900)] w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-[var(--color-coffee-100)]">
                    <Button fullWidth size="lg" onClick={handleConfirm}>
                        Add to Order - ฿{calculateTotal()}
                    </Button>
                </div>

            </div>
        </div>
    );
}
