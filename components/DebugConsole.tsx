"use client";

import { useEffect } from "react";

export function DebugConsole() {
    useEffect(() => {
        // Only run on client-side
        if (typeof window !== "undefined") {
            // Import vConsole dynamically to avoid SSR issues
            import("vconsole").then((VConsoleModule) => {
                const VConsole = VConsoleModule.default;
                // Initialize vConsole
                new VConsole({ theme: "dark" });
            });
        }
    }, []);

    return null; // This component doesn't render any visible UI itself
}
