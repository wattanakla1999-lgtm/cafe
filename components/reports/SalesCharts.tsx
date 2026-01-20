"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { ChartData } from "../../data/mockSales";

interface SalesChartsProps {
    salesTrend: ChartData[];
    categoryDistribution: { name: string; value: number }[];
    range: string;
}

const COLORS = ["#8B5E3C", "#A97142", "#D4A373", "#E9EDC9", "#CCD5AE"];

export function SalesCharts({ salesTrend, categoryDistribution, range }: SalesChartsProps) {
    const isToday = range === "today" || range === "yesterday";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Sales Trend Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-coffee-100)]">
                <h3 className="text-lg font-bold text-[var(--color-coffee-900)] mb-4">
                    แนวโน้มยอดขาย ({isToday ? "รายชั่วโมง" : "รายวัน"})
                </h3>
                <div className="h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `฿${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                formatter={(value: any) => [`฿${value.toLocaleString()}`, "ยอดขาย"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="var(--color-primary)"
                                strokeWidth={3}
                                dot={{ fill: "var(--color-primary)", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Distribution / Comparison */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-coffee-100)]">
                <h3 className="text-lg font-bold text-[var(--color-coffee-900)] mb-4">
                    ยอดขายตามหมวดหมู่
                </h3>
                <div className="h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`฿${value.toLocaleString()}`, "รายรับ"]} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
