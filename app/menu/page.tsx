"use client";

import React, { useState, useMemo } from "react";
import { DrinkCard } from "../../components/DrinkCard";
import { OptionModal } from "../../components/OptionModal";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import { FlyingItem } from "../../components/FlyingItem";
import Link from "next/link";
import { MenuItem, Option } from "../../data/mock";
import { useMenu } from "../../context/MenuContext";
import { RecommendedSection } from "../../components/menu/RecommendedSection";
import { BestSellerSection } from "../../components/menu/BestSellerSection";

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

import { supabase } from "../../lib/supabase";

import { subDays } from "date-fns";

function MenuContent() {
    const {
        menuItems,
        categories: contextCategories,
        setPublicStoreId,
        publicStoreId,
        loadMoreMenuItems,
        hasMore,
        isFetchingMore,
        isLoading,
        refetchMenu
    } = useMenu();
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

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);

    // Best Seller State
    const [bestSellers, setBestSellers] = useState<Map<string, number>>(new Map());


    const { addToCart, cart } = useOrder();



    // Refs for stable access in Subscriptions/Observers
    const latestPropsRef = React.useRef({ loadMoreMenuItems, hasMore, isLoading, isFetchingMore });

    // Update ref on every render so the observer can access the latest values
    React.useEffect(() => {
        latestPropsRef.current = { loadMoreMenuItems, hasMore, isLoading, isFetchingMore };
    });

    const observerTarget = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const { loadMoreMenuItems, hasMore, isLoading, isFetchingMore } = latestPropsRef.current;
                if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
                    loadMoreMenuItems();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, []); // Empty dependency array = Stable Observer

    // Debounce Search & Category Filter
    React.useEffect(() => {
        const timer = setTimeout(() => {
            refetchMenu({ category: activeCategory, search: searchTerm });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, refetchMenu]);

    // Fetch Suggestions
    React.useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            // We need storeId for suggestions. user.storeId might be undefined here if public.
            // Use publicStoreId if available
            const targetStoreId = publicStoreId;
            if (!targetStoreId) return;

            const { data } = await supabase
                .from("menu_items")
                .select("name")
                .eq("store_id", targetStoreId)
                .ilike("name", `%${searchTerm}%`)
                .limit(5);

            if (data) {
                const uniqueNames = Array.from(new Set(data.map(d => d.name)));
                setSuggestions(uniqueNames);
                setShowSuggestions(uniqueNames.length > 0);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, publicStoreId]);

    // Click outside to close suggestions
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Best Sellers (Top 10)
    React.useEffect(() => {
        const fetchBestSellers = async () => {
            // Use publicStoreId
            if (!publicStoreId) return;

            try {
                const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

                const { data: orderItems, error } = await supabase
                    .from("order_items")
                    .select(`
                        menu_item_id,
                        quantity,
                        order:orders!inner(
                            status,
                            store_id,
                            created_at
                        )
                    `)
                    .eq("order.store_id", publicStoreId)
                    .gte("order.created_at", thirtyDaysAgo)
                    .in("order.status", ["completed", "pending", "cooking", "ready"]);

                if (error) throw error;

                const salesMap = new Map<string, number>();
                orderItems?.forEach((item: any) => {
                    const itemId = item.menu_item_id;
                    if (itemId) {
                        const existing = salesMap.get(itemId);
                        salesMap.set(itemId, (existing || 0) + (item.quantity || 0));
                    }
                });

                setBestSellers(salesMap);
            } catch (error) {
                console.error("Error fetching best sellers:", error);
            }
        };

        fetchBestSellers();
    }, [publicStoreId]);

    // Calculate best seller rankings
    const bestSellerRankings = useMemo(() => {
        const sorted = Array.from(bestSellers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        const rankings = new Map<string, number>();
        sorted.forEach(([id], index) => {
            rankings.set(id, index + 1);
        });
        return rankings;
    }, [bestSellers]);

    // Sort items: Best sellers first (by rank), then others
    const filteredItems = useMemo(() => {
        return [...menuItems].sort((a, b) => {
            const rankA = bestSellerRankings.get(a.id);
            const rankB = bestSellerRankings.get(b.id);

            // Both have ranks - sort by rank ascending (1, 2, 3, ...)
            if (rankA && rankB) return rankA - rankB;

            // Only A has rank - A comes first
            if (rankA) return -1;

            // Only B has rank - B comes first
            if (rankB) return 1;

            // Neither has rank - maintain original order
            return 0;
        });
    }, [menuItems, bestSellerRankings]);


    const handleCategoryClick = (cat: string) => {
        if (cat === activeCategory) return;
        setActiveCategory(cat);
        // We let the useEffect below handle the refetch to avoid race conditions or double fetching
        // But wait, I didn't add the unified useEffect yet.
        // Let's add it now.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Unified Refetch Effect
    React.useEffect(() => {
        const timer = setTimeout(() => {
            refetchMenu({ category: activeCategory, search: searchTerm });
        }, 300);
        return () => clearTimeout(timer);
    }, [activeCategory, searchTerm]);


    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const [flyingItems, setFlyingItems] = useState<{ id: number; src: string; startRect: DOMRect; targetRect: DOMRect }[]>([]);
    const cartButtonRef = React.useRef<HTMLDivElement>(null);
    const [animationId, setAnimationId] = useState(0);

    const handleConfirm = (item: MenuItem, options: Option[], quantity: number) => {
        addToCart(item, options, quantity);
        setIsModalOpen(false);
        setSelectedItem(null);

        // Trigger Animation
        if (cartButtonRef.current && item.image) {
            const targetRect = cartButtonRef.current.getBoundingClientRect();
            // Start from center of screen (Modal position roughly)
            const startRect = {
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 100,
                width: 200,
                height: 200,
                right: 0, bottom: 0, x: 0, y: 0, toJSON: () => { }
            } as DOMRect;

            setFlyingItems(prev => [...prev, {
                id: animationId,
                src: item.image!,
                startRect,
                targetRect
            }]);
            setAnimationId(prev => prev + 1);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24">
            {/* Animations Layer */}
            {flyingItems.map(item => (
                <FlyingItem
                    key={item.id}
                    src={item.src}
                    startRect={item.startRect}
                    targetRect={item.targetRect}
                    onComplete={() => setFlyingItems(prev => prev.filter(i => i.id !== item.id))}
                />
            ))}

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-coffee-100)] p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="w-8"></div> {/* Spacer */}
                    <h1 className="text-xl font-bold text-center text-[var(--color-primary)]">เมนู</h1>
                    <Link href="/history" className="w-8 h-8 flex items-center justify-center text-[var(--color-coffee-600)] hover:text-[var(--color-primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative" ref={searchRef}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[var(--color-coffee-400)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-[var(--color-coffee-200)] rounded-full leading-5 bg-white text-[var(--color-coffee-900)] placeholder-[var(--color-coffee-400)] focus:outline-none focus:placeholder-[var(--color-coffee-300)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm transition-all shadow-sm"
                        placeholder="ค้นหาเมนู..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                    />
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-3 text-sm text-[var(--color-coffee-700)] hover:bg-[var(--color-coffee-50)] cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                        setSearchTerm(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>



            {/* Category Tabs (2 Rows) */}
            <div className="px-4 py-2 overflow-x-auto hide-scrollbar">
                <div className="grid grid-rows-2 grid-flow-col gap-2 w-max">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap text-sm ${activeCategory === cat
                                ? "bg-[var(--color-primary)] text-white shadow-md"
                                : "bg-white text-[var(--color-coffee-600)] border border-[var(--color-coffee-100)]"
                                }`}
                        >
                            {cat === "All" ? "ทั้งหมด" : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                    const bestSellerRank = bestSellerRankings.get(item.id);
                    return (
                        <DrinkCard
                            key={item.id}
                            item={item}
                            onClick={() => handleItemClick(item)}
                            showRecommendedBadge={item.isRecommended}
                            showBestSellerBadge={!!bestSellerRank}
                            bestSellerRank={bestSellerRank}
                        />
                    );
                })}
            </div>

            {/* Loading State & Height Spacer for Infinite Scroll */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center w-full mt-4">
                {(isLoading || isFetchingMore) && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-[var(--color-coffee-500)]">กำลังโหลด...</span>
                    </div>
                )}

            </div>

            {/* Floating Check Bill Button */}
            {cart.length > 0 && (
                <div ref={cartButtonRef} className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300">
                    <Link href="/cart">
                        <Button fullWidth size="lg" className="shadow-xl px-6">
                            <div className="flex justify-between items-center w-full">
                                <span className="font-bold">{cart.length} รายการ</span>
                                <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">ดูตะกร้า</span>
                                <span className="font-bold">฿{cart.reduce((sum, i) => sum + i.totalPrice, 0)}</span>
                            </div>
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
