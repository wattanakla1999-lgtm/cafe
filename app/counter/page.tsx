
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


import { FlyingItem } from "../../components/FlyingItem";
import { supabase } from "../../lib/supabase";
import { subDays } from "date-fns";
import { useAuth } from "../../context/AuthContext";

export default function CounterPage() {
    const { menuItems, categories: contextCategories, discounts, hasMore, loadMoreMenuItems, refetchMenu, isLoading, isFetchingMore } = useMenu();
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [orderNote, setOrderNote] = useState("");
    const [isReceiptPopupOpen, setIsReceiptPopupOpen] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(true);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"menu" | "cart" | "queue">("menu");

    const { addToCart, cart, removeFromCart, clearCart, submitOrder, orders, selectedDiscount, setDiscount, isSubmitting, incomingOrder, setIncomingOrder } = useOrder();
    const { user } = useAuth();

    // Best Seller State
    const [bestSellers, setBestSellers] = useState<Map<string, number>>(new Map());

    // Animation States
    const [flyingItems, setFlyingItems] = useState<{ id: number; src: string; startRect: DOMRect; targetRect: DOMRect }[]>([]);
    const [animationId, setAnimationId] = useState(0);
    const cartTargetRef = React.useRef<HTMLDivElement>(null);
    const queueTargetRef = React.useRef<HTMLDivElement>(null);
    const submitButtonRef = React.useRef<HTMLDivElement>(null);
    const mobileCartRef = React.useRef<HTMLButtonElement>(null);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    // Categories for filter
    const categories = useMemo(() => ["All", ...contextCategories], [contextCategories]);

    // Fetch Best Sellers (Top 10 for counter page)
    React.useEffect(() => {
        const fetchBestSellers = async () => {
            if (!user?.storeId) return;

            try {
                const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

                const { data: orderItems, error } = await supabase
                    .from("order_items")
                    .select(`
                        menu_item_id,
                        quantity,
                        order:orders!inner(
                            status,
                            store_id,
                            created_at
                        )
                    `)
                    .eq("order.store_id", user.storeId)
                    .gte("order.created_at", thirtyDaysAgo)
                    .in("order.status", ["completed", "pending", "cooking", "ready"]);

                if (error) throw error;

                const salesMap = new Map<string, number>();
                orderItems?.forEach((item: any) => {
                    const itemId = item.menu_item_id;
                    if (itemId) {
                        const existing = salesMap.get(itemId);
                        salesMap.set(itemId, (existing || 0) + (item.quantity || 0));
                    }
                });

                setBestSellers(salesMap);
            } catch (error) {
                console.error("Error fetching best sellers:", error);
            }
        };

        fetchBestSellers();

        // Reset menu view to public-safe state on mount
        refetchMenu({ includeUnavailable: false });
    }, [user?.storeId]);

    // Calculate best seller rankings
    const bestSellerRankings = useMemo(() => {
        const sorted = Array.from(bestSellers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        const rankings = new Map<string, number>();
        sorted.forEach(([id], index) => {
            rankings.set(id, index + 1);
        });
        return rankings;
    }, [bestSellers]);

    // Infinite Scroll Observer
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMoreMenuItems();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, loadMoreMenuItems]);

    // Handle Category Change
    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        refetchMenu({ category: cat });
    };

    const filteredItems = menuItems; // Context now handles filtering/pagination

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

    const afterDiscount = subtotal - discountAmount;

    // VAT Logic
    let vatAmount = 0;
    let finalTotal = afterDiscount;
    let beforeVat = afterDiscount;

    const taxType = user?.taxType || 'none';
    const vatRate = user?.vatRate || 7;

    if (taxType === 'include') {
        beforeVat = afterDiscount / (1 + vatRate / 100);
        vatAmount = afterDiscount - beforeVat;
    } else if (taxType === 'exclude') {
        beforeVat = afterDiscount;
        vatAmount = afterDiscount * (vatRate / 100);
        finalTotal = afterDiscount + vatAmount;
    } else {
        beforeVat = afterDiscount;
        vatAmount = 0;
        finalTotal = afterDiscount;
    }

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

        // Animation: Item -> Cart
        const isMobile = window.innerWidth < 1024;
        const targetRef = isMobile ? mobileCartRef : cartTargetRef;

        if (targetRef.current && item.image) {
            const targetRect = targetRef.current.getBoundingClientRect();
            const startRect = {
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 100,
                width: 200,
                height: 200,
                right: 0, bottom: 0, x: 0, y: 0, toJSON: () => { }
            } as DOMRect;

            setFlyingItems(prev => [...prev, {
                id: animationId,
                src: item.image!,
                startRect,
                targetRect
            }]);
            setAnimationId(prev => prev + 1);
        }
    };

    const mobileQueueRef = React.useRef<HTMLButtonElement>(null);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Animation: Submit Button -> Queue
        const isMobile = window.innerWidth < 1024;
        const targetRef = isMobile ? mobileQueueRef : queueTargetRef;

        if (targetRef.current && submitButtonRef.current && cart.length > 0) {
            const targetRect = targetRef.current.getBoundingClientRect();
            const startRect = submitButtonRef.current.getBoundingClientRect();
            // Use first item image or default
            const src = cart[0].menuItem.image || "https://img.icons8.com/color/48/coffee-to-go.png";

            setFlyingItems(prev => [...prev, {
                id: animationId,
                src,
                startRect,
                targetRect
            }]);
            setAnimationId(prev => prev + 1);
        }

        // Small delay to let animation start before processing (optional)
        await new Promise(r => setTimeout(r, 100));

        const orderId = await submitOrder(customerName.trim() || "-", "Counter", undefined, orderNote.trim());
        if (orderId) setLastOrderId(orderId);

        setCustomerName("");
        setOrderNote("");
        setIsReceiptPopupOpen(true);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row h-screen overflow-hidden relative">
                {/* Animation Layer */}
                {flyingItems.map(item => (
                    <FlyingItem
                        key={item.id}
                        src={item.src}
                        startRect={item.startRect}
                        targetRect={item.targetRect}
                        onComplete={() => setFlyingItems(prev => prev.filter(i => i.id !== item.id))}
                    />
                ))}

                {/* Left: Menu Area */}
                <div className={`flex-col h-full bg-[var(--color-coffee-50)] min-w-0 flex-1 ${activeTab === "menu" ? "flex" : "hidden lg:flex"} `}>
                    {/* Header */}
                    <div className="bg-white border-b border-[var(--color-coffee-100)] shrink-0">
                        {/* Top Row - Navigation */}
                        <div className="px-4 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Link href="/" className="text-sm font-bold text-[var(--color-coffee-500)] flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span>หน้าหลัก</span>
                                </Link>
                                <div className="h-4 w-px bg-[var(--color-coffee-200)]"></div>
                                <button
                                    onClick={() => setIsHistoryOpen(true)}
                                    className="text-sm font-bold text-[var(--color-primary)] flex items-center gap-2 hover:underline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <span>ประวัติ</span>
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row - Category Filters */}
                        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryChange(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                            ? "bg-[var(--color-primary)] text-white shadow-md"
                                            : "bg-white text-[var(--color-coffee-600)] border border-[var(--color-coffee-200)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                            } `}
                                    >
                                        {cat === "All" ? "ทั้งหมด" : cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredItems.map((item) => {
                                const bestSellerRank = bestSellerRankings.get(item.id);
                                return (
                                    <DrinkCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => handleItemClick(item)}
                                        showRecommendedBadge={item.isRecommended}
                                        showBestSellerBadge={!!bestSellerRank}
                                        bestSellerRank={bestSellerRank}
                                    />
                                );
                            })}
                        </div>

                        {/* Load More Trigger */}
                        {hasMore && (
                            <div ref={loadMoreRef} className="py-4 flex justify-center w-full">
                                {(isLoading || isFetchingMore) && (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Cart Sidebar */}
                <div className={`w-full lg:w-80 xl:w-96 bg-white border-l border-r border-[var(--color-coffee-200)] flex-col h-full shrink-0 shadow-lg z-20 ${activeTab === "cart" ? "flex" : "hidden lg:flex"} `}>
                    <div className="p-4 border-b border-[var(--color-coffee-100)] bg-white shrink-0 flex justify-between items-center">
                        <h2 ref={cartTargetRef} className="font-bold text-lg text-[var(--color-coffee-900)]">รายการสั่งซื้อปัจจุบัน</h2>
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

                    <div className="p-2 lg:p-4 bg-white border-t border-[var(--color-coffee-200)] space-y-1 lg:space-y-4 shrink-0 mb-24 lg:mb-0">
                        <div className="grid grid-cols-1 gap-1">
                            <div>
                                <label className="block text-[10px] lg:text-xs font-bold text-[var(--color-coffee-500)] uppercase mb-0 lg:mb-1">ชื่อลูกค้า</label>
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full p-1 lg:p-2 text-xs lg:text-sm border border-[var(--color-coffee-300)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="กรอกชื่อ..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] lg:text-xs font-bold text-[var(--color-coffee-500)] uppercase mb-0 lg:mb-1">หมายเหตุ</label>
                                <textarea
                                    value={orderNote}
                                    maxLength={135}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    className="w-full p-1 lg:p-2 text-xs lg:text-sm border border-[var(--color-coffee-300)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                                    placeholder="รายละเอียด..."
                                    rows={1}
                                />
                            </div>
                        </div>

                        {/* Discount Section */}
                        <div className="space-y-0.5 lg:space-y-2 py-0.5 lg:py-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] lg:text-xs font-bold text-[var(--color-coffee-500)] uppercase">ส่วนลด</label>
                                {selectedDiscount && (
                                    <button onClick={() => setDiscount(null)} className="text-[10px] text-red-500 hover:underline">ลบ</button>
                                )}
                            </div>
                            <div className="flex gap-1 lg:gap-2 flex-wrap">
                                {discounts.filter(d => d.active).map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDiscount(selectedDiscount?.id === d.id ? null : d)}
                                        className={`px-1.5 lg:px-3 py-0.5 lg:py-1.5 text-[10px] lg:text-xs rounded-lg border transition-all ${selectedDiscount?.id === d.id
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                            : 'bg-white text-[var(--color-coffee-600)] border-[var(--color-coffee-300)] hover:bg-[var(--color-coffee-50)]'
                                            }`}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                                {discounts.length === 0 && <span className="text-[10px] lg:text-xs text-gray-400">ไม่มีส่วนลด</span>}
                            </div>
                        </div>

                        <div className="pt-1 lg:pt-4 border-t border-[var(--color-coffee-100)] space-y-0.5 lg:space-y-1">
                            <div className="flex justify-between items-center text-[10px] lg:text-sm text-[var(--color-coffee-600)]">
                                <span>ยอดรวมย่อย</span>
                                <span>฿{subtotal}</span>
                            </div>
                            {selectedDiscount && (
                                <div className="flex justify-between items-center text-[10px] lg:text-sm text-[var(--color-primary)] font-medium">
                                    <span>ส่วนลด ({selectedDiscount.name})</span>
                                    <span>-฿{Math.floor(discountAmount)}</span>
                                </div>
                            )}

                            {taxType !== 'none' && (
                                <div className="flex justify-between items-center text-[10px] lg:text-xs text-[var(--color-coffee-500)]">
                                    <span>{taxType === 'include' ? `รวม VAT ${vatRate}%` : `VAT ${vatRate}%`}</span>
                                    <span>฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-base lg:text-xl font-bold text-[var(--color-coffee-900)] pt-0.5 lg:pt-2">
                                <span>ยอดรวม</span>
                                <span>฿{Math.floor(finalTotal)}</span>
                            </div>
                        </div>

                        <div ref={submitButtonRef}>
                            <Button
                                fullWidth
                                size="lg"
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isSubmitting}
                                className="py-1.5 lg:py-3 text-sm lg:text-base h-auto min-h-0 font-extrabold shadow-md"
                            >
                                {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันออเดอร์"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Order Queue */}
                {/* Wrap in div to handle mobile visibility + desktop flexible collapsing */}
                <div ref={queueTargetRef} className={`h-full shrink-0 z-30 transition-all duration-300 ${activeTab === "queue" ? "flex w-full" : "hidden lg:flex"} `}>
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
                        ref={mobileCartRef}
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
                        ref={mobileQueueRef}
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
