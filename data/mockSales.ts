import { Category, MENU_ITEMS } from "./mock";

export interface SalesSummary {
    totalSales: number;
    totalOrders: number;
    cupsSold: number;
    topItem: string;
}

export interface ChartData {
    name: string;
    sales: number;
    cups: number;
}

export interface SalesTransaction {
    id: string;
    time: string;
    date: string;
    menuName: string;
    quantity: number;
    price: number;
    total: number;
    channel: "QR" | "Counter";
}

export interface TopSeller {
    rank: number;
    name: string;
    cups: number;
    totalSales: number;
}

export interface ReportData {
    summary: SalesSummary;
    salesTrend: ChartData[];
    categoryDistribution: { name: string; value: number }[];
    topSellers: TopSeller[];
    recentTransactions: SalesTransaction[];
}

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateMockReportData = (range: "today" | "yesterday" | "7days" | "30days"): ReportData => {
    let salesTrend: ChartData[] = [];
    let transactions: SalesTransaction[] = [];
    let categoryMap: Record<string, number> = { "Coffee": 0, "Non-Coffee": 0, "Soda": 0 };
    let itemSalesMap: Record<string, { cups: number, revenue: number }> = {};

    // Helper to generate a day's sales
    const generateDaySales = (dateStr: string, isHourly = false) => {
        let dailyTotal = 0;
        let dailyCups = 0;

        // If hourly, we iterate 10am - 8pm
        if (isHourly) {
            for (let h = 10; h <= 20; h++) {
                const hourSales = getRandomInt(100, 1500); // Random sales per hour
                const hourCups = Math.floor(hourSales / 70);
                dailyTotal += hourSales;
                dailyCups += hourCups;

                salesTrend.push({
                    name: `${h}:00`,
                    sales: hourSales,
                    cups: hourCups
                });

                // Generate transactions for this hour
                for (let i = 0; i < hourCups; i++) {
                    const item = MENU_ITEMS[getRandomInt(0, MENU_ITEMS.length - 1)];
                    const qty = 1;
                    const total = item.price;

                    transactions.push({
                        id: Math.random().toString(36).substring(7).toUpperCase(),
                        time: `${h}:${getRandomInt(10, 59)}`,
                        date: dateStr,
                        menuName: item.name,
                        quantity: qty,
                        price: item.price,
                        total: total,
                        channel: Math.random() > 0.4 ? "Counter" : "QR"
                    });

                    // Update stats
                    categoryMap[item.category] += total;
                    if (!itemSalesMap[item.name]) itemSalesMap[item.name] = { cups: 0, revenue: 0 };
                    itemSalesMap[item.name].cups += qty;
                    itemSalesMap[item.name].revenue += total;
                }
            }
        } else {
            // For daily trends
            const daySales = getRandomInt(3000, 8000);
            const dayCups = Math.floor(daySales / 65);

            salesTrend.push({
                name: dateStr,
                sales: daySales,
                cups: dayCups
            });

            // We only generate a subset of transactions for long ranges to save memory/perf in mock
            // But for accurate totals in the mock, we can just approximate the loop count
            const sampleSize = Math.min(dayCups, 10); // just generating a few sample transactions per day
            for (let i = 0; i < sampleSize; i++) {
                const item = MENU_ITEMS[getRandomInt(0, MENU_ITEMS.length - 1)];
                transactions.push({
                    id: Math.random().toString(36).substring(7).toUpperCase(),
                    time: `${getRandomInt(10, 20)}:${getRandomInt(10, 59)}`,
                    date: dateStr,
                    menuName: item.name,
                    quantity: 1,
                    price: item.price,
                    total: item.price,
                    channel: Math.random() > 0.4 ? "Counter" : "QR"
                });
            }

            // Distribute approx stats
            Object.keys(categoryMap).forEach(k => {
                categoryMap[k] += Math.floor(daySales * 0.3); // Rough split
            });

            // Rough top sellers update
            MENU_ITEMS.forEach(item => {
                if (Math.random() > 0.5) {
                    if (!itemSalesMap[item.name]) itemSalesMap[item.name] = { cups: 0, revenue: 0 };
                    itemSalesMap[item.name].cups += getRandomInt(1, 5);
                    itemSalesMap[item.name].revenue += itemSalesMap[item.name].cups * item.price;
                }
            });
        }

        return { dailyTotal, dailyCups };
    };

    let totalSales = 0;
    let totalCups = 0;

    if (range === "today" || range === "yesterday") {
        const date = range === "today" ? new Date() : new Date(Date.now() - 86400000);
        const dateStr = date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' });
        const { dailyTotal, dailyCups } = generateDaySales(dateStr, true);
        totalSales = dailyTotal;
        totalCups = dailyCups;
    } else {
        const days = range === "7days" ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000);
            const dateStr = date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' });
            const { dailyTotal, dailyCups } = generateDaySales(dateStr, false);
            totalSales += dailyTotal;
            totalCups += dailyCups;
        }
    }

    // Sort transactions by latest
    transactions.sort((a, b) => b.time.localeCompare(a.time));

    // Process top sellers
    const topSellers: TopSeller[] = Object.entries(itemSalesMap)
        .map(([name, data]) => ({ name, cups: data.cups, totalSales: data.revenue, rank: 0 }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5)
        .map((item, index) => ({ ...item, rank: index + 1 }));

    // Format category distribution
    const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const topItemName = topSellers.length > 0 ? topSellers[0].name : "-";

    return {
        summary: {
            totalSales,
            cupsSold: totalCups,
            totalOrders: transactions.length, // Approximation for mock
            topItem: topItemName
        },
        salesTrend,
        categoryDistribution,
        topSellers,
        recentTransactions: transactions
    };
};
