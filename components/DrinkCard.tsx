import React from "react";
import { MenuItem } from "../data/mock";

interface DrinkCardProps {
    item: MenuItem;
    onClick: () => void;
}

export function DrinkCard({ item, onClick }: DrinkCardProps) {
    return (
        <div
            onClick={onClick}
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
                {/* Gradient overlay for better text readability if we put text on image, but here we keep text below */}
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
