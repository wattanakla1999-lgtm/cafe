"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Allow public paths (redundant if usage is selective, but good safeguard)
        const publicPaths = ["/login", "/register", "/menu", "/"];
        if (publicPaths.includes(pathname)) {
            setIsAuthorized(true);
            return;
        }

        // Check authentication
        const checkAuth = () => {
            // We use localStorage check directly here for speed to avoid flickering
            // relying on AuthContext's initial load might have a slight delay
            const savedUser = localStorage.getItem("cafe_user");

            if (!savedUser && !user) {
                router.push("/login");
            } else {
                setIsAuthorized(true);
            }
        };

        checkAuth();
    }, [user, router, pathname]);

    if (!isAuthorized) {
        return null; // Don't render anything while checking
    }

    return <>{children}</>;
}
