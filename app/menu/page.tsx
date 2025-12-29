"use client";

import React, { useState, useMemo } from "react";
import { DrinkCard } from "../../components/DrinkCard";
import { OptionModal } from "../../components/OptionModal";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { MenuItem, Option } from "../../data/mock";
import { useMenu } from "../../context/MenuContext";

export default function MenuPage() {
    const { menuItems, categories: contextCategories } = useMenu();

    // Categories for filter (Dynamic + "All")
    const categories = useMemo(() => ["All", ...contextCategories], [contextCategories]);

    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { addToCart, cart } = useOrder();

    const filteredItems = menuItems.filter(item =>
        (activeCategory === "All" || item.category === activeCategory) &&
        item.available !== false
    );

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirm = (item: MenuItem, options: Option[], quantity: number) => {
        addToCart(item, options, quantity);
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-coffee-100)] p-4">
                <h1 className="text-xl font-bold text-center text-[var(--color-primary)]">Menu</h1>
            </div>

            {/* Category Tabs */}
            <div className="p-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${activeCategory === cat
                            ? "bg-[var(--color-primary)] text-white shadow-md"
                            : "bg-white text-[var(--color-coffee-600)] border border-[var(--color-coffee-100)]"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                    <DrinkCard
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                    />
                ))}
            </div>

            {/* Floating Check Bill Button */}
            {cart.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300">
                    <Link href="/cart">
                        <Button fullWidth size="lg" className="shadow-xl flex justify-between px-6">
                            <span>{cart.length} Items</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">View Cart</span>
                            <span>฿{cart.reduce((sum, i) => sum + i.totalPrice, 0)}</span>
                        </Button>
                    </Link>
                </div>
            )}

            {/* Modal */}
            <OptionModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
            />
        </div>
    );
}
