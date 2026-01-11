"use client";

import React, { useState, useMemo } from "react";
import { DrinkCard } from "../../components/DrinkCard";
import { OptionModal } from "../../components/OptionModal";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { MenuItem, Option } from "../../data/mock";
import { useMenu } from "../../context/MenuContext";

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function MenuContent() {
    const { menuItems, categories: contextCategories, setPublicStoreId } = useMenu();
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId");

    // Capture storeId from URL and update context
    React.useEffect(() => {
        if (storeId) {
            setPublicStoreId(storeId);
        }
    }, [storeId, setPublicStoreId]);

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
                <div className="flex justify-between items-center">
                    <div className="w-8"></div> {/* Spacer */}
                    <h1 className="text-xl font-bold text-center text-[var(--color-primary)]">เมนู</h1>
                    <Link href="/history" className="w-8 h-8 flex items-center justify-center text-[var(--color-coffee-600)] hover:text-[var(--color-primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </Link>
                </div>
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
                        {cat === "All" ? "ทั้งหมด" : cat}
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
                            <span>{cart.length} รายการ</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">ดูตะกร้า</span>
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

export default function MenuPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <MenuContent />
        </Suspense>
    );
}
