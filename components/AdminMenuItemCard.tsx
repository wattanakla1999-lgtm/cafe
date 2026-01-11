import React from "react";
import { MenuItem } from "../data/mock";

interface AdminMenuItemCardProps {
    item: MenuItem;
    onEdit: (item: MenuItem) => void;
    onDelete: (id: string) => void;
    onToggleAvailability: (id: string, currentStatus: boolean) => void;
}

export function AdminMenuItemCard({ item, onEdit, onDelete, onToggleAvailability }: AdminMenuItemCardProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-[var(--color-coffee-200)] flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow ${!item.available ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            {/* Image Area - Fixed Height for Uniformity */}
            <div className="h-48 w-full bg-[var(--color-coffee-50)] relative overflow-hidden group">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-coffee-300)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Category Badge */}
                <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-[var(--color-coffee-700)] text-xs font-bold rounded-full shadow-sm z-10">
                    {item.category}
                </span>

                {/* Status Badge (Overlay) */}
                {!item.available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg transform -rotate-12 border-2 border-white">
                            ไม่พร้อมบริการ
                        </span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 relative">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-[var(--color-coffee-900)] leading-tight">{item.name}</h3>
                    <span className="font-bold text-[var(--color-primary)] text-lg whitespace-nowrap ml-2">
                        ฿{item.price}
                    </span>
                </div>

                <p className="text-sm text-[var(--color-coffee-600)] line-clamp-2 mb-4 flex-1">
                    {item.description || "ไม่มีรายละเอียด"}
                </p>

                {/* Status Toggle & Actions */}
                <div className="space-y-3 mt-auto pt-3 border-t border-[var(--color-coffee-100)]">

                    {/* Availability Switch */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--color-coffee-500)] uppercase tracking-wider">สถานะ</span>
                        <button
                            onClick={() => onToggleAvailability(item.id, item.available)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${item.available ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.available ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEdit(item)}
                            className="flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            แก้ไข
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ลบ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
