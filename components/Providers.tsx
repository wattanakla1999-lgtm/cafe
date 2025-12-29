"use client";

import { OrderProvider } from "../context/OrderContext";
import { MenuProvider } from "../context/MenuContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MenuProvider>
            <OrderProvider>
                {children}
            </OrderProvider>
        </MenuProvider>
    );
}
