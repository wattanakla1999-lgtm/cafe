
"use client";

import React, { useState, useMemo } from "react";
import { Category, MenuItem, Option } from "../../data/mock";
import { DrinkCard } from "../../components/DrinkCard";
import { OptionModal } from "../../components/OptionModal";
import { useOrder } from "../../context/OrderContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { ReceiptPopup } from "@/components/ReceiptPopup";
import { OrderHistoryPopup } from "../../components/OrderHistoryPopup";
import { OrderQueue } from "../../components/OrderQueue";
import { useMenu } from "../../context/MenuContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";


export default function CounterPage() {
    const { menuItems, categories: contextCategories, discounts } = useMenu();
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [isReceiptPopupOpen, setIsReceiptPopupOpen] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(true);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"menu" | "cart" | "queue">("menu");

    const { addToCart, cart, removeFromCart, clearCart, submitOrder, orders, selectedDiscount, setDiscount, isSubmitting, incomingOrder, setIncomingOrder } = useOrder();

    // Notification Logic moved to GlobalOrderAlert


    // Categories for filter
    const categories = useMemo(() => ["All", ...contextCategories], [contextCategories]);

    const filteredItems = menuItems.filter(item =>
        (activeCategory === "All" || item.category === activeCategory) &&
        item.available !== false
    );

    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate display values
    let discountAmount = 0;
    if (selectedDiscount) {
        if (selectedDiscount.type === "percent") {
            discountAmount = subtotal * (selectedDiscount.value / 100);
        } else {
            discountAmount = selectedDiscount.value;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
    }
    const finalTotal = subtotal - discountAmount;

    // Calculate pending orders for badge
    const pendingCount = orders.filter(o => o.status === "pending").length;

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirmOption = (item: MenuItem, options: Option[], quantity: number) => {
        addToCart(item, options, quantity);
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        // submitOrder returns the ID or we need to refactor it to return ID
        // Currently submitOrder is void/Promise<void> and optimistic updates.
        // We will need to check if submitOrder can return the new ID or if we can get it from optimistic state.

        // Refactoring handleCheckout to be async and capture ID if possible, 
        // OR simply finding the 'optimistic' ID we just made. 
        // Based on logic, submitOrder does optimistic update.
        // Let's modify logic to generate ID here or assume submitOrder returns it.
        // Checking Context... submitOrder is defined to return void.
        // Let's assume we need to update submitOrder to return string | null first?
        // Actually, submitOrder in Context has optimistic update that PUSHES to orders.
        // We can just Peek the latest order? Or better, refactor submitOrder to return ID.

        // For now, let's assume I'll update submitOrder in next step.
        const orderId = await submitOrder(customerName.trim() || "-", "Counter");
        if (orderId) setLastOrderId(orderId);

        setCustomerName("");
        setIsReceiptPopupOpen(true);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row h-screen overflow-hidden relative">

                {/* Left: Menu Area */}
                <div className={`flex-col h-full bg-[var(--color-coffee-50)] min-w-0 flex-1 ${activeTab === "menu" ? "flex" : "hidden lg:flex"} `}>
                    {/* Header */}
                    <div className="bg-white p-4 border-b border-[var(--color-coffee-100)] flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-sm font-bold text-[var(--color-coffee-500)] flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">หน้าหลัก</span>
                            </Link>
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="text-sm font-bold text-[var(--color-primary)] flex items-center gap-2 hover:underline"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">ประวัติ</span>
                            </button>
                            <div className="h-4 w-px bg-[var(--color-coffee-300)] mx-2 hidden sm:block"></div>
                            <Link href="/reports" className="text-sm font-bold text-[var(--color-coffee-600)] flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                <span className="hidden sm:inline">รายงาน</span>
                            </Link>
                        </div>

                        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                        ? "bg-[var(--color-primary)] text-white shadow"
                                        : "bg-white text-[var(--color-coffee-600)] border border-[var(--color-coffee-200)]"
                                        } `}
                                >
                                    {cat === "All" ? "ทั้งหมด" : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredItems.map((item) => (
                                <DrinkCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle: Cart Sidebar */}
                <div className={`w-full lg:w-80 xl:w-96 bg-white border-l border-r border-[var(--color-coffee-200)] flex-col h-full shrink-0 shadow-lg z-20 ${activeTab === "cart" ? "flex" : "hidden lg:flex"} `}>
                    <div className="p-4 border-b border-[var(--color-coffee-100)] bg-white shrink-0 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-[var(--color-coffee-900)]">รายการสั่งซื้อปัจจุบัน</h2>
                        <button
                            onClick={() => setIsQueueOpen(!isQueueOpen)}
                            className={`p-2 rounded-lg transition-colors hidden lg:block ${isQueueOpen ? "bg-[var(--color-coffee-100)] text-[var(--color-primary)]" : "text-[var(--color-coffee-400)] hover:bg-[var(--color-coffee-50)]"} `}
                            title="Toggle Queue"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-background)] pb-20 lg:pb-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[var(--color-coffee-400)] text-sm">
                                ตะกร้าว่างเปล่า
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.itemId} className="bg-white p-3 rounded-lg border border-[var(--color-coffee-100)] shadow-sm flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        {item.menuItem.image && (
                                            <img
                                                src={item.menuItem.image}
                                                alt={item.menuItem.name}
                                                className="w-12 h-12 rounded-md object-cover border border-[var(--color-coffee-50)] shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-bold text-[var(--color-coffee-800)] truncate">{item.menuItem.name}</div>
                                            <div className="text-xs text-[var(--color-coffee-500)] truncate">
                                                {item.options.map(o => o.name).join(", ")}
                                            </div>
                                            <div className="mt-1 text-xs font-bold text-[var(--color-coffee-600)]">
                                                x{item.quantity} · ฿{item.totalPrice}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.itemId)} className="text-red-400 hover:text-red-600 p-2 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-[var(--color-coffee-200)] space-y-4 shrink-0 mb-16 lg:mb-0">
                        <div>
                            <label className="block text-xs font-bold text-[var(--color-coffee-500)] uppercase mb-1">ชื่อลูกค้า</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full p-2 border border-[var(--color-coffee-300)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                placeholder="กรอกชื่อ..."
                            />
                        </div>

                        {/* Discount Section */}
                        <div className="space-y-2 py-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-[var(--color-coffee-500)] uppercase">ส่วนลด</label>
                                {selectedDiscount && (
                                    <button onClick={() => setDiscount(null)} className="text-[10px] text-red-500 hover:underline">ลบ</button>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {discounts.filter(d => d.active).map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDiscount(selectedDiscount?.id === d.id ? null : d)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedDiscount?.id === d.id
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                            : 'bg-white text-[var(--color-coffee-600)] border-[var(--color-coffee-300)] hover:bg-[var(--color-coffee-50)]'
                                            }`}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                                {discounts.length === 0 && <span className="text-xs text-gray-400">ไม่มีส่วนลด</span>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--color-coffee-100)] space-y-1">
                            <div className="flex justify-between items-center text-sm text-[var(--color-coffee-600)]">
                                <span>ยอดรวมย่อย</span>
                                <span>฿{subtotal}</span>
                            </div>
                            {selectedDiscount && (
                                <div className="flex justify-between items-center text-sm text-[var(--color-primary)] font-medium">
                                    <span>ส่วนลด ({selectedDiscount.name})</span>
                                    <span>-฿{Math.floor(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-bold text-[var(--color-coffee-900)] pt-2">
                                <span>ยอดรวม</span>
                                <span>฿{Math.floor(finalTotal)}</span>
                            </div>
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันออเดอร์"}
                        </Button>
                    </div>
                </div>

                {/* Right: Order Queue */}
                {/* Wrap in div to handle mobile visibility + desktop flexible collapsing */}
                <div className={`h-full shrink-0 z-30 transition-all duration-300 ${activeTab === "queue" ? "flex w-full" : "hidden lg:flex"} `}>
                    <OrderQueue isOpen={isQueueOpen || activeTab === "queue"} onClose={() => setIsQueueOpen(false)} />
                </div>

                {/* Mobile Bottom Navigation - Visible on screens smaller than LG (1024px) */}
                <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-[var(--color-coffee-200)] flex justify-around p-3 z-[100]">

                    <button
                        onClick={() => setActiveTab("menu")}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${activeTab === "menu" ? "text-[var(--color-primary)] bg-[var(--color-coffee-50)] shadow-sm scale-105" : "text-[var(--color-coffee-400)] hover:bg-gray-50"} `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="text-xs font-bold">เมนู</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("cart")}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 relative ${activeTab === "cart" ? "text-[var(--color-primary)] bg-[var(--color-coffee-50)] shadow-sm scale-105" : "text-[var(--color-coffee-400)] hover:bg-gray-50"} `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs font-bold">ตะกร้า</span>
                        {cart.length > 0 && (
                            <span className="absolute top-1 right-8 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] text-center shadow-sm">
                                {cart.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("queue")}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 relative ${activeTab === "queue" ? "text-[var(--color-primary)] bg-[var(--color-coffee-50)] shadow-sm scale-105" : "text-[var(--color-coffee-400)] hover:bg-gray-50"} `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold">คิว</span>
                        {pendingCount > 0 && (
                            <span className="absolute top-1 right-8 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] text-center shadow-sm">
                                {pendingCount}
                            </span>
                        )}
                    </button>

                </div>

                <OptionModal
                    item={selectedItem}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmOption}
                />

                <ReceiptPopup
                    isOpen={isReceiptPopupOpen}
                    onClose={() => setIsReceiptPopupOpen(false)}
                    orderId={lastOrderId}
                />

                <OrderHistoryPopup
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                />



            </div>
        </ProtectedRoute>
    );
}
