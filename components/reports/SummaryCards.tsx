import React from "react";
import { SalesSummary } from "../../data/mockSales";

interface SummaryCardsProps {
    summary: SalesSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
    const cards = [
        {
            label: "Total Sales",
            value: `฿${summary.totalSales.toLocaleString()}`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            bg: "bg-green-50"
        },
        {
            label: "Total Orders",
            value: summary.totalOrders.toLocaleString(),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            bg: "bg-blue-50"
        },
        {
            label: "Cups Sold",
            value: summary.cupsSold.toLocaleString(),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            bg: "bg-orange-50"
        },
        {
            label: "Best Seller",
            value: summary.topItem,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            bg: "bg-purple-50"
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-coffee-100)] flex items-center gap-4">
                    <div className={`p-3 rounded-full ${card.bg} shrink-0`}>
                        {card.icon}
                    </div>
                    <div>
                        <p className="text-xs text-[var(--color-coffee-500)] uppercase font-bold">{card.label}</p>
                        <p className="text-xl font-bold text-[var(--color-coffee-900)] truncate">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
