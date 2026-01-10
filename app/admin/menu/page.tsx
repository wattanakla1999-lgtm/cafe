"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMenu } from "../../../context/MenuContext";
import { MenuItem, Category } from "../../../data/mock";
import { Button } from "../../../components/Button";
import { AdminMenuItemCard } from "../../../components/AdminMenuItemCard";
import { MenuFormModal } from "../../../components/MenuFormModal";
import { CategoryManagerModal } from "../../../components/CategoryManagerModal";
import { DiscountManagerModal } from "../../../components/DiscountManagerModal";
import { ToppingManagerModal } from "../../../components/ToppingManagerModal";
import { StoreSettingsModal } from "../../../components/StoreSettingsModal";
import { ProtectedRoute } from "../../../components/ProtectedRoute";

function MenuContent() {
    const { menuItems, categories: contextCategories, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
    const searchParams = useSearchParams();

    // UI State
    const [isAppMode, setIsAppMode] = useState(true);
    const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [isDiscountManagerOpen, setIsDiscountManagerOpen] = useState(false);
    const [isToppingManagerOpen, setIsToppingManagerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    useEffect(() => {
        if (searchParams.get("modal") === "discounts") {
            setIsDiscountManagerOpen(true);
        }
    }, [searchParams]);

    // Filter/Search State (Optional enhancement for "many menus")
    const [searchQuery, setSearchQuery] = useState("");

    // Filter items
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Categories for filter
    const categories = ["All", ...contextCategories];

    // Handlers
    const handleAddNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            deleteMenuItem(id);
        }
    };

    const handleToggleAvailability = (id: string, currentStatus: boolean) => {
        updateMenuItem(id, { available: !currentStatus });
    };

    const handleFormSubmit = (data: Omit<MenuItem, "id">) => {
        if (editingItem) {
            updateMenuItem(editingItem.id, data);
        } else {
            addMenuItem(data);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
                {/* Header */}
                <header className="bg-white px-6 py-4 shadow-sm border-b border-[var(--color-coffee-200)] flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" className="!p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold text-[var(--color-coffee-900)]">Manager</h1>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2" title="Store Settings">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                        </Button>
                        <Button variant="outline" onClick={() => setIsDiscountManagerOpen(true)} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Discounts</span>
                        </Button>
                        <Button variant="outline" onClick={() => setIsManagerOpen(true)} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span>Categories</span>
                        </Button>
                        <Button variant="outline" onClick={() => setIsToppingManagerOpen(true)} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Toppings</span>
                        </Button>
                        <Button variant="primary" onClick={handleAddNew} className="flex items-center gap-2 shadow-lg shadow-orange-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Add Item</span>
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md mx-auto md:mx-0">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-coffee-400)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--color-coffee-200)] rounded-full focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white shadow-sm transition-shadow"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                    ? "bg-[var(--color-primary)] text-white shadow-md shadow-orange-200"
                                    : "bg-white text-[var(--color-coffee-600)] border border-[var(--color-coffee-200)] hover:bg-[var(--color-coffee-50)]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item) => (
                            <AdminMenuItemCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleAvailability={handleToggleAvailability}
                            />
                        ))}

                        {/* Add New Placeholer Card (Optional, encouraging adding logic visual) */}
                        <div
                            onClick={handleAddNew}
                            className="border-2 border-dashed border-[var(--color-coffee-200)] rounded-xl flex flex-col items-center justify-center p-8 text-[var(--color-coffee-400)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] cursor-pointer transition-all h-full min-h-[320px] group"
                        >
                            <div className="w-16 h-16 rounded-full bg-[var(--color-coffee-100)] group-hover:bg-white flex items-center justify-center mb-4 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="font-bold">Add New Item</span>
                        </div>
                    </div>
                </main>

                {/* Modal */}
                <MenuFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingItem}
                    onSubmit={handleFormSubmit}
                />

                <CategoryManagerModal
                    isOpen={isManagerOpen}
                    onClose={() => setIsManagerOpen(false)}
                />

                <DiscountManagerModal
                    isOpen={isDiscountManagerOpen}
                    onClose={() => setIsDiscountManagerOpen(false)}
                />

                <ToppingManagerModal
                    isOpen={isToppingManagerOpen}
                    onClose={() => setIsToppingManagerOpen(false)}
                />

                <StoreSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </div>
        </ProtectedRoute>
    );
}

export default function AdminMenuPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MenuContent />
        </Suspense>
    );
}
