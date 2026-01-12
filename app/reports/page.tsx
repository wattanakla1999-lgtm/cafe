"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { CustomDatePicker } from "../../components/CustomDatePicker";
// import { generateMockReportData, ReportData } from "../../data/mockSales"; // REMOVE
import { SummaryCards } from "../../components/reports/SummaryCards";
import { SalesCharts } from "../../components/reports/SalesCharts";
import { TopSellers } from "../../components/reports/TopSellers";
import { SalesTable } from "../../components/reports/SalesTable";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { startOfDay, subDays, startOfYesterday, endOfYesterday, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

// Types corresponding to the components
// (Ideally these should be shared, but for now we follow the component props)
interface ReportData {
    summary: {
        totalSales: number;
        totalOrders: number;
        avgOrderValue: number;
        cupsSold: number;
        topItem: string;
    };
    salesTrend: any[];
    categoryDistribution: any[];
    topSellers: any[];
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd")
    });
    const [data, setData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filter State
    const [idInput, setIdInput] = useState(""); // Immediate input for UI
    const [debouncedId, setDebouncedId] = useState(""); // Debounced value for API
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterChannel, setFilterChannel] = useState("all");

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedId(idInput);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [idInput]);

    // 1. Fetch Summary Data (Charts, Totals) - Runs on Date Change
    useEffect(() => {
        if (!user?.storeId) return;

        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const startDate = startOfDay(parseISO(dateRange.start));
                const endDateTime = new Date(parseISO(dateRange.end));
                endDateTime.setHours(23, 59, 59, 999);
                const startISO = startDate.toISOString();
                const endISO = endDateTime.toISOString();

                // 1. Fetch Orders for Summary
                const { data: orders, error: ordersError } = await supabase
                    .from("orders")
                    .select("id, total_amount, status, created_at, payment_method, channel")
                    .eq("store_id", user.storeId)
                    .gte("created_at", startISO)
                    .lte("created_at", endISO)
                    .neq("status", "cancelled");

                if (ordersError) throw ordersError;

                const validOrders = orders.filter(o => o.status === 'completed' || o.status === 'pending');

                // 2. Fetch Items for Summary (Top Sellers etc)
                const orderIds = validOrders.map(o => o.id);
                let orderItems: any[] = [];
                if (orderIds.length > 0) {
                    const { data: items, error: itemsError } = await supabase
                        .from("order_items")
                        .select(`
                            *,
                            menu_item:menu_items (
                                category_id,
                                category:categories(name)
                            )
                        `)
                        .in("order_id", orderIds);
                    if (itemsError) throw itemsError;
                    orderItems = items;
                }

                // --- CALCS ---
                const cupsSold = orderItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

                // Top Sellers
                const itemMap = new Map();
                orderItems.forEach(item => {
                    const name = item.name;
                    const qty = item.quantity;
                    const revenue = Number(item.total_price);
                    if (itemMap.has(name)) {
                        const existing = itemMap.get(name);
                        itemMap.set(name, { ...existing, sold: existing.sold + qty, revenue: existing.revenue + revenue });
                    } else {
                        itemMap.set(name, { id: item.menu_item_id || item.id, name, sold: qty, revenue });
                    }
                });
                const topSellers = Array.from(itemMap.values()).sort((a, b) => b.sold - a.sold).slice(0, 5).map((item, index) => ({
                    id: item.id, name: item.name, cups: item.sold, totalSales: item.revenue, rank: index + 1
                }));
                const topItem = topSellers.length > 0 ? topSellers[0].name : "N/A";

                const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
                const totalOrders = validOrders.length;
                const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

                const summary = { totalSales, totalOrders, avgOrderValue, cancelledOrders: 0, cupsSold, topItem };

                // Trend
                const trendMap = new Map();
                validOrders.forEach(o => {
                    const date = parseISO(o.created_at);
                    let key = dateRange.start === dateRange.end ? format(date, "HH:00") : format(date, "MMM dd");
                    trendMap.set(key, (trendMap.get(key) || 0) + Number(o.total_amount));
                });
                const salesTrend = Array.from(trendMap.entries()).map(([k, v]) => ({ name: k, sales: v })).sort((a, b) => a.name.localeCompare(b.name));

                // Categories
                const catMap = new Map();
                orderItems.forEach(item => {
                    const catName = item.menu_item?.category?.name || "Uncategorized";
                    catMap.set(catName, (catMap.get(catName) || 0) + Number(item.total_price));
                });
                const categoryDistribution = Array.from(catMap.entries()).map(([k, v]) => ({ name: k, value: v }));

                setData({ summary, salesTrend, categoryDistribution, topSellers });

            } catch (error) {
                console.error("Summary Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
        setCurrentPage(1); // Reset page when date changes
    }, [user?.storeId, dateRange]);

    // 2. Fetch Transactions (Paginated) - Runs on Page or Date Change
    useEffect(() => {
        if (!user?.storeId) return;

        const fetchTransactions = async () => {
            setIsTableLoading(true);
            try {
                const startDate = startOfDay(parseISO(dateRange.start));
                const endDateTime = new Date(parseISO(dateRange.end));
                endDateTime.setHours(23, 59, 59, 999);
                const startISO = startDate.toISOString();
                const endISO = endDateTime.toISOString();

                // Pagination Range
                const from = (currentPage - 1) * 10;
                const to = from + 9;

                // 1. Get Orders (Paginated)
                let query = supabase
                    .from("orders")
                    .select("id, created_at, total_amount, channel, status, payment_method, cancel_reason", { count: "exact" })
                    .eq("store_id", user.storeId)
                    .gte("created_at", startISO)
                    .lte("created_at", endISO)
                    .order("created_at", { ascending: false });

                // Apply Filters
                // Temporarily disabled: UUID search requires text casting which Supabase JS doesn't support well
                // Users can still filter by status and channel
                // TODO: Consider adding a separate indexed text column for order IDs if search is critical
                /* if (debouncedId) {
                    query = query.filter('id::text', 'ilike', `%${debouncedId}%`);
                } */
                if (filterStatus !== "all") {
                    if (filterStatus === "pending") {
                        // "pending" in filter means active orders (pending, cooking, ready)
                        // OR just literally 'pending'? User request said "Status", usually implies granular.
                        // But usually "Pending/Procesing" vs "Completed" vs "Cancelled".
                        // Let's assume matching the dropdown I made: "pending" value in dropdown -> match pending, cooking, ready?
                        // The dropdown has: Completed, Cancelled, Pending (waiting/cooking).
                        // Let's map "pending" filter to pending, cooking, ready.
                        query = query.in("status", ["pending", "cooking", "ready"]);
                    } else {
                        query = query.eq("status", filterStatus);
                    }
                }
                if (filterChannel !== "all") {
                    query = query.eq("channel", filterChannel);
                }

                // Range
                const { data: orders, count, error } = await query.range(from, to);

                if (error) throw error;
                setTotalCount(count || 0);

                if (orders && orders.length > 0) {
                    const orderIds = orders.map(o => o.id);
                    // Fetch items for specific page only
                    const { data: items } = await supabase
                        .from("order_items")
                        .select('order_id, name, quantity')
                        .in("order_id", orderIds);

                    const mappedOrders = orders.map(o => {
                        const myItems = items?.filter(i => i.order_id === o.id) || [];
                        const menuNames = myItems.slice(0, 3).map(i => i.name).join(", ") + (myItems.length > 3 ? "..." : "");
                        const totalQty = myItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
                        return {
                            id: o.id.substring(0, 8).toUpperCase(),
                            date: format(parseISO(o.created_at), "dd/MM/yyyy"),
                            time: format(parseISO(o.created_at), "HH:mm"),
                            menuName: menuNames || "Unknown",
                            quantity: totalQty,
                            total: Number(o.total_amount),
                            channel: o.channel || "Counter",
                            status: o.status,
                            paymentMethod: o.payment_method || "Cash",
                            cancelReason: o.cancel_reason
                        };
                    });
                    setTransactions(mappedOrders);
                } else {
                    setTransactions([]);
                }

            } catch (e) {
                console.error("Transactions Fetch Error:", e);
                setTransactions([]); // Clear on error to avoid showing misleading stale data
            } finally {
                setIsTableLoading(false);
            }
        };

        fetchTransactions();
    }, [user?.storeId, dateRange, currentPage, debouncedId, filterStatus, filterChannel]); // Re-fetch on debounced filter change

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-bg)] font-sans">
                {/* Navbar */}
                <nav className="bg-white border-b border-[var(--color-coffee-100)] sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0 md:h-16 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link href="/counter" className="p-2 hover:bg-[var(--color-coffee-50)] rounded-lg transition-colors text-[var(--color-coffee-500)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <h1 className="text-xl font-bold text-[var(--color-coffee-900)] whitespace-nowrap">แดชบอร์ดการขาย</h1>
                        </div>

                        <div className="flex items-center gap-2 bg-[var(--color-coffee-50)] p-2 rounded-lg border border-[var(--color-coffee-100)] w-full md:w-auto justify-center overflow-x-auto md:overflow-visible">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-[var(--color-coffee-600)] whitespace-nowrap">จาก:</span>
                                <CustomDatePicker
                                    selected={parseISO(dateRange.start)}
                                    onChange={(date) => date && setDateRange(prev => ({ ...prev, start: format(date, "yyyy-MM-dd") }))}
                                    selectsStart
                                    startDate={parseISO(dateRange.start)}
                                    endDate={parseISO(dateRange.end)}
                                    maxDate={new Date()} // Can't select future
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-[var(--color-coffee-600)] whitespace-nowrap">ถึง:</span>
                                <CustomDatePicker
                                    selected={parseISO(dateRange.end)}
                                    onChange={(date) => date && setDateRange(prev => ({ ...prev, end: format(date, "yyyy-MM-dd") }))}
                                    selectsEnd
                                    startDate={parseISO(dateRange.start)}
                                    endDate={parseISO(dateRange.end)}
                                    minDate={parseISO(dateRange.start)}
                                    maxDate={new Date()}
                                />
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


                    {isLoading || !data ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <div className="w-12 h-12 border-4 border-[var(--color-coffee-200)] border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                            <p className="text-[var(--color-coffee-500)] text-sm font-bold">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header Section */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-[var(--color-coffee-900)]">
                                    {dateRange.start === dateRange.end
                                        ? `ยอดขายประจำวันที่ ${format(parseISO(dateRange.start), 'dd MMMM yyyy', { locale: th })}`
                                        : `ยอดขายตั้งแต่วันที่ ${format(parseISO(dateRange.start), 'dd MMM', { locale: th })} ถึง ${format(parseISO(dateRange.end), 'dd MMM yyyy', { locale: th })}`
                                    }
                                </h2>
                                <p className="text-[var(--color-coffee-500)] text-sm mt-1">
                                    ข้อมูล ณ วันที่ {new Date().toLocaleString('th-TH')}
                                </p>
                            </div>

                            {/* Summary Cards */}
                            <SummaryCards summary={data.summary} />

                            {/* Charts Area */}
                            <SalesCharts
                                salesTrend={data.salesTrend}
                                categoryDistribution={data.categoryDistribution}
                                range={dateRange.start === dateRange.end ? "today" : "custom"}
                            />

                            {/* Detailed Data Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <SalesTable
                                        transactions={transactions}
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(totalCount / 10)}
                                        totalCount={totalCount}
                                        onPageChange={setCurrentPage}
                                        isLoading={isTableLoading}
                                        filterId={idInput}
                                        setFilterId={setIdInput}
                                        filterStatus={filterStatus}
                                        setFilterStatus={setFilterStatus}
                                        filterChannel={filterChannel}
                                        setFilterChannel={setFilterChannel}
                                    />
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
