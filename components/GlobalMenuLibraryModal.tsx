"use client";

import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";

interface GlobalMenuLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalMenuLibraryModal({ isOpen, onClose }: GlobalMenuLibraryModalProps) {
    const { fetchGlobalMenus, bulkImportMenuItems } = useMenu();
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    // Selection & Import State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);

    // Filter State
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load menus when modal opens or filters change
    useEffect(() => {
        if (isOpen) {
            loadMenus(0, true);
            setSelectedItems(new Set());
        }
    }, [isOpen, activeCategory, debouncedSearch]);

    const loadMenus = async (pageNum: number = 0, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setPage(0);
        } else {
            setIsFetchingMore(true);
        }

        try {
            const result = await fetchGlobalMenus({
                page: pageNum,
                limit: 20,
                category: activeCategory !== "All" ? activeCategory : undefined,
                search: debouncedSearch || undefined
            });

            if (reset) {
                setMenus(result.data);
            } else {
                setMenus(prev => {
                    const newItems = [...prev, ...result.data];
                    const uniqueItems = Array.from(new Map(newItems.map(item => [item.id, item])).values());
                    return uniqueItems;
                });
            }

            setHasMore(result.data.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error("Error loading global menus:", error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const loadMore = () => {
        if (!hasMore || isFetchingMore || loading) return;
        loadMenus(page + 1, false);
    };

    const toggleSelection = (item: any) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(item.id)) {
            newSet.delete(item.id);
        } else {
            newSet.add(item.id);
        }
        setSelectedItems(newSet);
    };

    const handleBulkImport = async () => {
        if (selectedItems.size === 0) return;

        setIsImporting(true);
        try {
            const itemsToImport = menus.filter(m => selectedItems.has(m.id))
                .map(m => ({
                    category: m.category,
                    name: m.name,
                    price: m.suggested_price || 0,
                    description: m.description,
                    image: m.image
                }));

            const result = await bulkImportMenuItems(itemsToImport);

            if (result.success) {
                onClose();
            } else {
                alert(`Import failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Bulk import failed", error);
            alert("Failed to import selected items.");
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    // Get unique categories from loaded menus
    const categories = ["All", ...Array.from(new Set(menus.map(m => m.category)))];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl m-4 overflow-hidden flex flex-col max-h-[90vh] relative">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 bg-white z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">คลังเมนูกลาง (Global Menu Library)</h2>
                            <p className="text-sm text-gray-500">เลือกเมนูที่ต้องการเพิ่มลงในร้านของคุณ</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาเมนู (เช่น ลาเต้, ครัวซองต์)..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden pb-20 md:pb-0">
                    {/* Sidebar/Top Categories */}
                    <div className="w-full md:w-48 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 overflow-x-auto md:overflow-y-auto p-3 md:p-4 flex md:flex-col gap-2 flex-shrink-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat
                                    ? "bg-primary text-white bg-[var(--color-primary)]"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Menu Grid */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-gray-400">Loading library...</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">{" "}{/* Extra padding for bottom bar */}
                                    {menus.map((item: any) => {
                                        const isSelected = selectedItems.has(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleSelection(item)}
                                                className={`
                                                relative border rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer bg-white
                                                ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}
                                            `}
                                            >
                                                <div className="absolute top-4 right-4 z-10">
                                                    <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
                                                `}>
                                                        {isSelected && (
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden relative">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            No Image
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                        ฿{item.suggested_price}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800 pr-8">{item.name}</h3>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Infinite Scroll Trigger */}
                                {hasMore && (
                                    <div
                                        ref={(el) => {
                                            if (!el) return;
                                            const observer = new IntersectionObserver(
                                                (entries) => {
                                                    if (entries[0].isIntersecting && hasMore && !isFetchingMore && !loading) {
                                                        loadMore();
                                                    }
                                                },
                                                { threshold: 0.1 }
                                            );
                                            observer.observe(el);
                                            return () => observer.disconnect();
                                        }}
                                        className="py-8 flex justify-center w-full"
                                    >
                                        {isFetchingMore && (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Bar - Only visible when items selected */}
                {selectedItems.size > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between z-20 animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                {selectedItems.size}
                            </div>
                            <div className="text-sm">
                                <span className="font-bold text-gray-900">รายการที่เลือก</span>
                                <p className="text-xs text-gray-500">พร้อมนำเข้าสู่ร้านค้า</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleBulkImport}
                            isLoading={isImporting}
                            className="bg-primary text-white px-8"
                        >
                            นำเข้า {selectedItems.size} รายการ
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
