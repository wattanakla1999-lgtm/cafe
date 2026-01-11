"use client";

import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { MenuItem, Option, SWEETNESS_LEVELS, COFFEE_BEANS } from "../data/mock";
import { Button } from "./Button";

interface OptionModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: MenuItem, options: Option[], quantity: number) => void;
}

export function OptionModal({ item, isOpen, onClose, onConfirm }: OptionModalProps) {
    const { toppings, servingTypes } = useMenu();
    const [sweetness, setSweetness] = useState<Option>(SWEETNESS_LEVELS[3]); // Default 100%
    const [servingType, setServingType] = useState<Option | null>(null);
    const [coffeeBean, setCoffeeBean] = useState<Option>(COFFEE_BEANS[0]); // Default Dark
    const [selectedToppings, setSelectedToppings] = useState<Option[]>([]);
    const [quantity, setQuantity] = useState(1);

    // Set default serving type when types load or modal opens
    useEffect(() => {
        if (isOpen && servingTypes.length > 0 && !servingType) {
            setServingType(servingTypes[0]);
        }
    }, [isOpen, servingTypes, servingType]);

    if (!isOpen || !item) return null;

    // Filter toppings:
    // If filteredToppings is provided in item, show only those.
    // If empty/undefined, show ALL (legacy behavior) OR show NONE (strict).
    // Let's assume: if array is present, use it. If undefined (legacy data), show ALL.
    const filteredToppings = item.allowedToppings
        ? toppings.filter(t => item.allowedToppings?.includes(t.id))
        : toppings;

    const toggleTopping = (topping: Option) => {
        if (selectedToppings.find(t => t.id === topping.id)) {
            setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
        } else {
            setSelectedToppings(prev => [...prev, topping]);
        }
    };

    const calculateTotal = () => {
        const base = item.price;
        const typePrice = (item.allowTypeSelection && servingType) ? servingType.price : 0;
        const beanPrice = item.allowBeanSelection ? coffeeBean.price : 0;
        const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        return (base + typePrice + beanPrice + toppingPrice) * quantity;
    };

    const handleConfirm = () => {
        const allOptions = [sweetness];

        if (item.allowTypeSelection && servingType) {
            allOptions.push({ ...servingType, name: `Type: ${servingType.name}` });
        }

        if (item.allowBeanSelection) {
            allOptions.push({ ...coffeeBean, name: `Bean: ${coffeeBean.name}` });
        }

        allOptions.push(...selectedToppings);

        onConfirm(item, allOptions, quantity);
        // Reset state for next use (optional, but good practice)
        setQuantity(1);
        setSelectedToppings([]);
        setSweetness(SWEETNESS_LEVELS[3]);
        setCoffeeBean(COFFEE_BEANS[0]);
        // Don't verify servingType here, useEffect will handle it or keep current
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

                    <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">

                        {/* Serving Type Selection */}
                        {item.allowTypeSelection && (
                            <div>
                                <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">รูปแบบการเสิร์ฟ</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {servingTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setServingType(type)}
                                            className={`p-2 rounded-lg border text-sm transition-all flex flex-col items-center justify-center gap-1 ${servingType?.id === type.id
                                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                                : "border-[var(--color-coffee-200)] text-[var(--color-coffee-700)] bg-white"
                                                }`}
                                        >
                                            <span className="font-bold">{type.name}</span>
                                            {type.price > 0 && <span className="text-xs opacity-80">+฿{type.price}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coffee Bean Selection */}
                        {item.allowBeanSelection && (
                            <div>
                                <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">เมล็ดกาแฟ</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {COFFEE_BEANS.map(bean => (
                                        <button
                                            key={bean.id}
                                            onClick={() => setCoffeeBean(bean)}
                                            className={`p-2 rounded-lg border text-xs transition-all ${coffeeBean.id === bean.id
                                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                                : "border-[var(--color-coffee-200)] text-[var(--color-coffee-700)] bg-white"
                                                }`}
                                        >
                                            {bean.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sweetness */}
                        <div>
                            <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">ระดับความหวาน</h4>
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



                        {/* Toppings */}
                        {filteredToppings.length > 0 && (
                            <div>
                                <h4 className="font-bold text-[var(--color-coffee-800)] mb-2">ท็อปปิ้ง</h4>
                                <div className="space-y-2">
                                    {filteredToppings.map(t => (
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
                        )}

                        {/* Quantity */}
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-coffee-100)]">
                            <span className="font-bold text-[var(--color-coffee-800)]">จำนวน</span>
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
                            เพิ่มลงในออเดอร์ - ฿{calculateTotal()}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
