"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
    showLoading: (text?: string) => void;
    hideLoading: () => void;
    isLoading: boolean;
    loadingText: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("กำลังโหลด...");
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Auto-hide loading popup on route change
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    const showLoading = (text: string = "กำลังโหลด...") => {
        setLoadingText(text);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading, loadingText }}>
            {children}

            {/* Global Loading Popup Modal */}
            {isLoading && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full text-center animate-scale-up border border-[var(--color-coffee-100)]">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-[var(--color-coffee-200)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                            <span className="text-2xl animate-bounce">☕</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--color-coffee-900)]">{loadingText}</h3>
                            <p className="text-xs text-[var(--color-coffee-500)] mt-1 animate-pulse">กรุณารอสักครู่...</p>
                        </div>
                    </div>
                </div>
            )}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
}
