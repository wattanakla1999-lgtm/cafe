import React from "react";
import { MenuItem } from "../data/mock";

interface DrinkCardProps {
    item: MenuItem;
    onClick: () => void;
    showRecommendedBadge?: boolean;
    showBestSellerBadge?: boolean;
    bestSellerRank?: number;
    dataTour?: string;
}

export function DrinkCard({ item, onClick, showRecommendedBadge, showBestSellerBadge, bestSellerRank, dataTour }: DrinkCardProps) {
    return (
        <div
            onClick={onClick}
            data-tour={dataTour}
            className="group relative bg-white rounded-xl shadow-sm border border-[var(--color-coffee-100)] cursor-pointer hover:shadow-md hover:border-[var(--color-primary)] transition-all active:scale-95 flex flex-col h-full"
        >
            {/* Image Container */}
            <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-[var(--color-coffee-50)] relative">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-coffee-200)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Badge Overlays - Show both badges at different positions */}
                {/* Recommended Badge - Top LEFT */}
                {showRecommendedBadge && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>แนะนำ</span>
                    </div>
                )}

                {/* Best Seller Badge - Top RIGHT */}
                {showBestSellerBadge && bestSellerRank && (
                    <div className={`absolute top-2 right-2 ${bestSellerRank === 1 ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                        bestSellerRank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                            bestSellerRank === 3 ? 'bg-gradient-to-r from-amber-600 to-yellow-700' :
                                'bg-gradient-to-r from-orange-500 to-red-500'
                        } text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1`}>
                        {bestSellerRank <= 3 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span>#{bestSellerRank}</span>
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="p-3 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base lg:text-lg text-[var(--color-coffee-900)] leading-tight">{item.name}</h3>
                    <span className="font-bold text-[var(--color-primary)] text-lg whitespace-nowrap ml-2">
                        ฿{item.price}
                    </span>
                </div>
                {item.description && (
                    <p className="text-xs text-[var(--color-coffee-500)] line-clamp-2">{item.description}</p>
                )}
            </div>

            {/* Visual touch ripple/indicator */}
            <div className="absolute inset-0 rounded-xl ring-2 ring-[var(--color-primary)] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
        </div>
    );
}
