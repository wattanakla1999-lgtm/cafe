"use client";

import React from "react";
import { MenuItem } from "../../data/mock";
import { DrinkCard } from "../DrinkCard";

interface RecommendedSectionProps {
    items: MenuItem[];
    onItemClick: (item: MenuItem) => void;
}

export function RecommendedSection({ items, onItemClick }: RecommendedSectionProps) {
    // Filter only recommended items that are available
    const recommendedItems = items.filter(item => item.isRecommended && item.available);

    // Don't render if no recommended items
    if (recommendedItems.length === 0) return null;

    return (
        <div className="px-4 py-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h2 className="text-lg font-bold">เมนูแนะนำ</h2>
                </div>
                <div className="h-1 flex-1 bg-gradient-to-r from-amber-200 to-transparent rounded-full"></div>
            </div>

            {/* Horizontal Scrollable Grid */}
            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
                <div className="flex gap-4 pb-2" style={{ minWidth: 'min-content' }}>
                    {recommendedItems.map((item) => (
                        <div key={item.id} className="relative" style={{ minWidth: '160px', maxWidth: '160px' }}>
                            {/* Recommended Badge */}
                            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                แนะนำ
                            </div>
                            <DrinkCard item={item} onClick={() => onItemClick(item)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
