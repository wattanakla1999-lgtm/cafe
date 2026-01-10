"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { generateMockReportData, ReportData } from "../../data/mockSales";
import { SummaryCards } from "../../components/reports/SummaryCards";
import { SalesCharts } from "../../components/reports/SalesCharts";
import { TopSellers } from "../../components/reports/TopSellers";
import { SalesTable } from "../../components/reports/SalesTable";

export default function ReportsPage() {
    // Range State: today, yesterday, 7days, 30days
    const [range, setRange] = useState<"today" | "yesterday" | "7days" | "30days">("today");
    const [data, setData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate network delay for realistic feel
        const timer = setTimeout(() => {
            const reportData = generateMockReportData(range);
            setData(reportData);
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [range]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-bg)] font-sans">
                {/* Navbar */}
                <nav className="bg-white border-b border-[var(--color-coffee-100)] sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/counter" className="p-2 hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors text-[var(--color-coffee-500)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <h1 className="text-xl font-bold text-[var(--color-coffee-900)]">Sales Dashboard</h1>
                        </div>

                        <div className="flex bg-[var(--color-coffee-50)] p-1 rounded-lg border border-[var(--color-coffee-100)] overflow-x-auto">
                            {(["today", "yesterday", "7days", "30days"] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${range === r
                                        ? "bg-white text-[var(--color-primary)] shadow-sm"
                                        : "text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)]"
                                        }`}
                                >
                                    {r === "today" ? "Today" : r === "yesterday" ? "Yesterday" : r === "7days" ? "Last 7 Days" : "Last 30 Days"}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {isLoading || !data ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <div className="w-12 h-12 border-4 border-[var(--color-coffee-200)] border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                            <p className="text-[var(--color-coffee-500)] text-sm font-bold">Loading dashboard data...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header Section */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-[var(--color-coffee-900)]">
                                    {range === "today" ? "Today's Performance" :
                                        range === "yesterday" ? "Yesterday's Performance" :
                                            range === "7days" ? "Last 7 Days Overview" : "Monthly Overview"}
                                </h2>
                                <p className="text-[var(--color-coffee-500)] text-sm mt-1">
                                    Data as of {new Date().toLocaleString()}
                                </p>
                            </div>

                            {/* Summary Cards */}
                            <SummaryCards summary={data.summary} />

                            {/* Charts Area */}
                            <SalesCharts
                                salesTrend={data.salesTrend}
                                categoryDistribution={data.categoryDistribution}
                                range={range}
                            />

                            {/* Detailed Data Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <SalesTable transactions={data.recentTransactions} />
                                </div>
                                <div className="lg:col-span-1">
                                    <TopSellers items={data.topSellers} />
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </ProtectedRoute>
    );
}
