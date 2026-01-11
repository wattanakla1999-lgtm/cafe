import React from "react";
import { TopSeller } from "../../data/mockSales";

interface TopSellersProps {
    items: TopSeller[];
}

export function TopSellers({ items }: TopSellersProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-coffee-100)] p-6 h-full">
            <h3 className="text-lg font-bold text-[var(--color-coffee-900)] mb-4">5 อันดับสินค้าขายดี</h3>
            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 p-3 hover:bg-[var(--color-coffee-50)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-coffee-100)]">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                            ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                item.rank === 2 ? 'bg-gray-100 text-gray-700' :
                                    item.rank === 3 ? 'bg-orange-50 text-orange-700' :
                                        'bg-[var(--color-coffee-100)] text-[var(--color-coffee-600)]'}
                        `}>
                            {item.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[var(--color-coffee-900)] truncate">{item.name}</h4>
                            <p className="text-xs text-[var(--color-coffee-500)]">{item.cups} แก้ว</p>
                        </div>
                        <div className="text-right font-bold text-[var(--color-primary)]">
                            ฿{item.totalSales.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-coffee-100)] text-center">
                <button className="text-sm text-[var(--color-primary)] font-bold hover:underline">
                    ดูวิเคราะห์เมนูทั้งหมด
                </button>
            </div>
        </div>
    );
}
