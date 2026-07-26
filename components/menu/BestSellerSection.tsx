"use client";

import React, { useState, useEffect } from "react";
import { MenuItem } from "../../data/mock";
import { DrinkCard } from "../DrinkCard";
import { supabase } from "../../lib/supabase";
import { subDays } from "date-fns";

interface BestSellerItem {
    item: MenuItem;
    soldCount: number;
    rank: number;
}

interface BestSellerSectionProps {
    items: MenuItem[];
    onItemClick: (item: MenuItem) => void;
    storeId: string | null;
}

export function BestSellerSection({ items, onItemClick, storeId }: BestSellerSectionProps) {
    const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBestSellers = async () => {
            if (!storeId) {
                setIsLoading(false);
                return;
            }

            try {
                // Get sales data from last 30 days
                const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

                // Fetch order items from the last 30 days
                const { data: orderItems, error } = await supabase
                    .from("order_items")
                    .select(`
                        menu_item_id,
                        quantity,
                        name,
                        order:orders!inner(
                            status,
                            store_id,
                            created_at
                        )
                    `)
                    .eq("order.store_id", storeId)
                    .gte("order.created_at", thirtyDaysAgo)
                    .in("order.status", ["completed", "pending", "cooking", "ready"]);

                if (error) throw error;

                // Aggregate quantities by menu_item_id
                const salesMap = new Map<string, { name: string; count: number }>();

                orderItems?.forEach((item: any) => {
                    const itemId = item.menu_item_id;
                    if (itemId) {
                        const existing = salesMap.get(itemId);
                        if (existing) {
                            existing.count += item.quantity || 0;
                        } else {
                            salesMap.set(itemId, {
                                name: item.name,
                                count: item.quantity || 0
                            });
                        }
                    }
                });

                // Sort by count and get top 5
                const sortedSales = Array.from(salesMap.entries())
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // Match with menu items
                const bestSellerItems: BestSellerItem[] = sortedSales
                    .map((sale, index) => {
                        const menuItem = items.find(item => item.id === sale.id);
                        if (menuItem && menuItem.available) {
                            return {
                                item: menuItem,
                                soldCount: sale.count,
                                rank: index + 1
                            };
                        }
                        return null;
                    })
                    .filter((item): item is BestSellerItem => item !== null);

                setBestSellers(bestSellerItems);
            } catch (error) {
                console.error("Error fetching best sellers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBestSellers();
    }, [storeId, items]);

    // Don't render if loading or no best sellers
    if (isLoading || bestSellers.length === 0) return null;

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return "from-red-500 to-pink-600"; // Gold-ish red
            case 2: return "from-gray-400 to-gray-600"; // Silver
            case 3: return "from-amber-600 to-yellow-700"; // Bronze
            default: return "from-[var(--color-primary)] to-orange-600";
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank <= 3) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div className="px-4 py-6 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-lg font-bold">เมนูขายดี</h2>
                </div>
                <div className="h-1 flex-1 bg-gradient-to-r from-red-200 to-transparent rounded-full"></div>
            </div>

            {/* Horizontal Scrollable Grid */}
            <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="flex gap-4 pb-2" style={{ minWidth: 'min-content' }}>
                    {bestSellers.map((bestSeller) => (
                        <div key={bestSeller.item.id} className="relative" style={{ minWidth: '160px', maxWidth: '160px' }}>
                            {/* Rank Badge */}
                            <div className={`absolute top-2 left-2 z-10 bg-gradient-to-r ${getRankColor(bestSeller.rank)} text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1`}>
                                {getRankIcon(bestSeller.rank)}
                                #{bestSeller.rank}
                            </div>
                            <DrinkCard item={bestSeller.item} onClick={() => onItemClick(bestSeller.item)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
