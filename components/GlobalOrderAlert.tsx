"use client";

import React, { useEffect, useState } from "react";
import { useOrder } from "../context/OrderContext";
import { Alert } from "./Alert";
import { useRouter, usePathname } from "next/navigation";

export function GlobalOrderAlert() {
    const { incomingOrder, setIncomingOrder } = useOrder();
    const [alertInfo, setAlertInfo] = useState<{ message: string; description?: string } | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (incomingOrder) {
            // Initial Alert Setup
            const initialDescription = `ลูกค้า: ${incomingOrder.customer_name || "-"} | ยอด: ฿${incomingOrder.total_amount}`;
            setAlertInfo({
                message: "ออเดอร์ใหม่มาแล้ว! 🎉",
                description: initialDescription
            });

            // Play Sound
            const audio = new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3");
            audio.play().catch(e => {
                console.error("Audio play failed", e);
                // If blocked, update the alert to warn the user
                if (e.name === 'NotAllowedError') {
                    setAlertInfo(prev => prev ? ({
                        ...prev,
                        description: `${initialDescription} (⚠️ กรุณาคลิกที่หน้าจอเพื่อให้เสียงเตือนทำงาน)`
                    }) : null);
                }
            });

            // Browser Notification (Backup)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New Order!", { body: `Order #${incomingOrder.id.substring(0, 6)} received.` });
            } else if ("Notification" in window && Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("New Order!", { body: `Order #${incomingOrder.id.substring(0, 6)} received.` });
                    }
                });
            }

            // Clear the context state to prevent re-triggering the same alert
            setIncomingOrder(null);
        }
    }, [incomingOrder, setIncomingOrder]);

    const handleAlertClick = () => {
        if (pathname !== '/counter') {
            router.push('/counter');
            setAlertInfo(null); // Dismiss after clicking
        }
    };

    if (!alertInfo) return null;

    return (
        <Alert
            severity="success"
            message={alertInfo.message}
            description={alertInfo.description}
            autoCloseDuration={5000}
            onClose={() => setAlertInfo(null)}
            onClick={pathname !== '/counter' ? handleAlertClick : undefined}
        />
    );
}
