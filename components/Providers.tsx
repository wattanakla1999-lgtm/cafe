"use client";

import { OrderProvider } from "../context/OrderContext";
import { MenuProvider } from "../context/MenuContext";
import { AuthProvider } from "../context/AuthContext";

import { NetworkStatus } from "./NetworkStatus";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <MenuProvider>
                <OrderProvider>
                    <NetworkStatus />
                    {children}
                </OrderProvider>
            </MenuProvider>
        </AuthProvider>
    );
}
