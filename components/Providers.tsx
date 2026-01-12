"use client";

import { OrderProvider } from "../context/OrderContext";
import { MenuProvider } from "../context/MenuContext";
import { AuthProvider } from "../context/AuthContext";
import { ConfirmProvider } from "../context/ConfirmContext";

import { NetworkStatus } from "./NetworkStatus";
import { GlobalOrderAlert } from "./GlobalOrderAlert";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <MenuProvider>
                <OrderProvider>
                    <ConfirmProvider>
                        <NetworkStatus />
                        <GlobalOrderAlert />
                        {children}
                    </ConfirmProvider>
                </OrderProvider>
            </MenuProvider>
        </AuthProvider>
    );
}
