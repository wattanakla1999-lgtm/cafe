"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        // Allow public paths
        const publicPaths = ["/login", "/register", "/menu", "/", "/receipt", "/cart", "/receipt-selection", "/history"];
        if (publicPaths.includes(pathname)) return;

        // Redirect if not authenticated
        if (!user) {
            router.push("/login");
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <div className="w-8 h-8 border-4 border-[var(--color-coffee-200)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    const publicPaths = ["/login", "/register", "/menu", "/", "/receipt", "/cart", "/receipt-selection", "/history"];
    if (!user && !publicPaths.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
