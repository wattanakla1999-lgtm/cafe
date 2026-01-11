import React from "react";
import { SalesTransaction } from "../../data/mockSales";

interface SalesTableProps {
    transactions: any[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function SalesTable({ transactions, currentPage, totalPages, totalCount, onPageChange, isLoading = false }: SalesTableProps) {
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    // No internal slicing - transactions passed in should be the current page's data

    const handlePrev = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-coffee-100)] overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-[var(--color-coffee-900)]">ธุรกรรมล่าสุด</h3>
                <button className="text-sm text-[var(--color-primary)] font-bold hover:underline">
                    ดาวน์โหลด CSV
                </button>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--color-coffee-50)] text-[var(--color-coffee-600)] uppercase text-xs font-bold border-b border-[var(--color-coffee-100)]">
                        <tr>
                            <th className="px-6 py-4">เวลา</th>
                            <th className="px-6 py-4">รหัสออเดอร์</th>
                            <th className="px-6 py-4">เมนู</th>
                            <th className="px-6 py-4 text-center">จำนวน</th>
                            <th className="px-6 py-4 text-right">รวม</th>
                            <th className="px-6 py-4 text-center">ช่องทาง</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-coffee-50)]">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-coffee-400)]">
                                    <div className="flex justify-center">
                                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[var(--color-coffee-50)] transition-colors">
                                        <td className="px-6 py-4 text-[var(--color-coffee-500)] whitespace-nowrap">
                                            {tx.time} <span className="text-xs opacity-50 ml-1">{tx.date}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[var(--color-coffee-600)] font-medium">
                                            #{tx.id}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[var(--color-coffee-900)]">
                                            {tx.menuName}
                                        </td>
                                        <td className="px-6 py-4 text-center text-[var(--color-coffee-700)]">
                                            {tx.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[var(--color-primary)]">
                                            ฿{tx.total}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${tx.channel === "QR"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-orange-50 text-orange-700 border-orange-200"
                                                }`}>
                                                {tx.channel}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-coffee-400)]">
                                            ไม่พบธุรกรรมในช่วงเวลานี้
                                        </td>
                                    </tr>
                                )}
                                {transactions.length < itemsPerPage && transactions.length > 0 && (
                                    // Fill empty space to keep table height consistent if desired, or leave it dynamic.
                                    // For minimal design, dynamic is fine.
                                    <></>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {transactions.length > 0 && (
                <div className="p-4 bg-[var(--color-coffee-50)] border-t border-[var(--color-coffee-100)] flex justify-between items-center text-sm shrink-0">
                    <div className="text-[var(--color-coffee-500)]">
                        แสดง {startIndex + 1} ถึง {startIndex + transactions.length} จาก {totalCount} รายการ
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border transition-colors ${currentPage === 1
                                ? "border-[var(--color-coffee-200)] text-[var(--color-coffee-400)] cursor-not-allowed"
                                : "border-[var(--color-coffee-300)] bg-white text-[var(--color-coffee-700)] hover:bg-[var(--color-coffee-100)]"
                                }`}
                        >
                            ก่อนหน้า
                        </button>
                        <span className="flex items-center px-2 font-bold text-[var(--color-coffee-700)]">
                            หน้า {currentPage} จาก {totalPages}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border transition-colors ${currentPage === totalPages
                                ? "border-[var(--color-coffee-200)] text-[var(--color-coffee-400)] cursor-not-allowed"
                                : "border-[var(--color-coffee-300)] bg-white text-[var(--color-coffee-700)] hover:bg-[var(--color-coffee-100)]"
                                }`}
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
