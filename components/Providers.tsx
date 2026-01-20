"use client";

import { OrderProvider } from "../context/OrderContext";
import { MenuProvider } from "../context/MenuContext";
import { AuthProvider } from "../context/AuthContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import { TourProvider } from "../context/TourContext";

import { NetworkStatus } from "./NetworkStatus";
import { GlobalOrderAlert } from "./GlobalOrderAlert";
import { TourHighlight } from "./OnboardingModal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TourProvider>
                <MenuProvider>
                    <OrderProvider>
                        <ConfirmProvider>
                            <NetworkStatus />
                            <GlobalOrderAlert />
                            <TourHighlight />
                            {children}
                        </ConfirmProvider>
                    </OrderProvider>
                </MenuProvider>
            </TourProvider>
        </AuthProvider>
    );
}
