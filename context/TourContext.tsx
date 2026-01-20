"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export interface TourStep {
    id: string;
    page: string;
    targetSelector: string;
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
    action?: "click" | "input" | "navigate";
    nextPath?: string;
    waitForElement?: boolean;
    allowSkip?: boolean;
    mobileOnly?: boolean; // If true, skip this step on desktop
}

interface TourContextType {
    isActive: boolean;
    currentStep: number;
    currentTourStep: TourStep | null;
    steps: TourStep[];
    startTour: () => void;
    nextStep: () => void;
    skipStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
    modalCloseEvent: number; // Increments when modals should close
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Detailed tour steps - field by field guidance
const TOUR_STEPS: TourStep[] = [
    // === HOME ===
    {
        id: "welcome",
        page: "/",
        targetSelector: "[data-tour='menu-button']",
        title: "ยินดีต้อนรับ! 🎉",
        content: "มาเริ่มตั้งค่าร้านกัน! กดปุ่มนี้เพื่อจัดการเมนู",
        position: "bottom",
        action: "click",
        nextPath: "/admin/menu",
        allowSkip: true
    },

    // === STORE SETTINGS (Mobile: 2 steps) ===
    {
        id: "open-dropdown",
        page: "/admin/menu",
        targetSelector: "[data-tour='open-dropdown'], [data-tour='settings-button-desktop']",
        title: "เปิดเมนูตั้งค่า",
        content: "กดปุ่ม 3 จุด หรือเลือกเมนูตั้งค่าร้านค้าด้านบน",
        position: "bottom",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "open-settings",
        page: "/admin/menu",
        targetSelector: "[data-tour='settings-button-mobile'], [data-tour='settings-button-desktop']",
        title: "ตั้งค่าร้านค้า ⚙️",
        content: "เลือก 'ตั้งค่าร้านค้า' เพื่อตั้งค่าข้อมูลร้าน",
        position: "bottom",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "store-name",
        page: "/admin/menu",
        targetSelector: "[data-tour='store-name-input']",
        title: "ชื่อร้านค้า 🏪",
        content: "กรอกชื่อร้านของคุณ เช่น 'Coffee House'",
        position: "bottom",
        action: "input",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "store-address",
        page: "/admin/menu",
        targetSelector: "[data-tour='store-address-input']",
        title: "ที่อยู่ร้าน 📍",
        content: "กรอกที่อยู่ร้าน (จะแสดงบนใบเสร็จ)",
        position: "bottom",
        action: "input",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "store-vat",
        page: "/admin/menu",
        targetSelector: "[data-tour='store-vat-setting']",
        title: "ตั้งค่า VAT 💰",
        content: "เลือกรูปแบบภาษี: ไม่มี VAT, รวม VAT, หรือแยก VAT",
        position: "right",
        action: "input",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "settings-save",
        page: "/admin/menu",
        targetSelector: "[data-tour='settings-save']",
        title: "บันทึกการตั้งค่า ✅",
        content: "กดบันทึกเพื่อเก็บข้อมูลร้าน",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },

    // === ADD MENU ===
    {
        id: "add-menu",
        page: "/admin/menu",
        targetSelector: "[data-tour='add-menu-button']",
        title: "เพิ่มเมนูแรก 🍰",
        content: "กดเพื่อเพิ่มเมนูสินค้าแรกของคุณ",
        position: "bottom",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "menu-name",
        page: "/admin/menu",
        targetSelector: "[data-tour='menu-name-input']",
        title: "ชื่อเมนู 📝",
        content: "ตั้งชื่อเมนู เช่น 'ลาเต้เย็น', 'อเมริกาโน่'",
        position: "bottom",
        action: "input",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "menu-price",
        page: "/admin/menu",
        targetSelector: "[data-tour='menu-price-input']",
        title: "ราคา 💵",
        content: "ระบุราคาเมนูนี้ (ตัวเลขเท่านั้น)",
        position: "bottom",
        action: "input",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "menu-category",
        page: "/admin/menu",
        targetSelector: "[data-tour='menu-category-select']",
        title: "หมวดหมู่ 📁",
        content: "สังเกตว่ายังไม่มีหมวดหมู่ งั้นเรามาสร้างใหม่กัน!",
        position: "bottom",
        action: "input",
        waitForElement: true,
        allowSkip: false
    },
    {
        id: "create-category-start",
        page: "/admin/menu",
        targetSelector: "[data-tour='create-category-btn']",
        title: "สร้างหมวดหมู่ใหม่ ✨",
        content: "กดปุ่มนี้เพื่อเริ่มสร้างหมวดหมู่",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: false
    },
    {
        id: "create-category-input",
        page: "/admin/menu",
        targetSelector: "[data-tour='new-category-input']",
        title: "ตั้งชื่อหมวดหมู่ 🏷️",
        content: "เช่น 'Coffee', 'Bakery' (เดี๋ยวเรากรอกให้ดูเป็นตัวอย่าง)",
        position: "top",
        action: "input",
        waitForElement: true,
        allowSkip: false
    },
    {
        id: "create-category-confirm",
        page: "/admin/menu",
        targetSelector: "[data-tour='new-category-confirm']",
        title: "ยืนยันการสร้าง ✅",
        content: "กดปุ่ม 'เพิ่ม' เพื่อสร้างหมวดหมู่เลย",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: false
    },
    {
        id: "menu-save",
        page: "/admin/menu",
        targetSelector: "[data-tour='menu-save']",
        title: "สร้างเมนู ✅",
        content: "กดสร้างเมนูเพื่อบันทึก!",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },

    // === TRY COUNTER ===
    {
        id: "go-counter",
        page: "/admin/menu",
        targetSelector: "[data-tour='back-button']",
        title: "ไปลองรับออเดอร์! 🧾",
        content: "พร้อมแล้ว! กลับหน้าหลักเพื่อไปรับออเดอร์",
        position: "right",
        action: "click",
        nextPath: "/",
        allowSkip: true
    },
    {
        id: "counter",
        page: "/",
        targetSelector: "[data-tour='counter-button']",
        title: "เปิดจุดชำระเงิน",
        content: "กดปุ่มนี้เพื่อไปหน้ารับออเดอร์",
        position: "bottom",
        action: "click",
        nextPath: "/counter",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "select-item",
        page: "/counter",
        targetSelector: "[data-tour='menu-item']",
        title: "เลือกเมนู 🛒",
        content: "กดที่เมนูเพื่อดูรายละเอียดและเลือก options",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "add-to-order",
        page: "/counter",
        targetSelector: "[data-tour='add-to-order']",
        title: "เพิ่มลงออเดอร์ ➕",
        content: "เลือก options ที่ต้องการแล้วกดปุ่มนี้เพื่อเพิ่มลงตะกร้า",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    // === CONFIRM ORDER (2 steps: cart tab then confirm button) ===
    {
        id: "go-to-cart",
        page: "/counter",
        targetSelector: "[data-tour='cart-tab']",
        title: "ไปที่ตะกร้า 🛒",
        content: "กดที่ตะกร้าเพื่อดูรายการสินค้าที่เลือกและยืนยันออเดอร์",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true,
        mobileOnly: true // Skip on desktop (cart is always visible)
    },
    {
        id: "confirm-order",
        page: "/counter",
        targetSelector: "[data-tour='confirm-order-button']",
        title: "ยืนยันออเดอร์ ✅",
        content: "กดยืนยันเพื่อส่งออเดอร์เข้าคิว!",
        position: "center",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "queue",
        page: "/counter",
        targetSelector: "[data-tour='queue-button']",
        title: "ดูคิวออเดอร์ 📋",
        content: "กดดูคิวที่กำลังทำอยู่ได้ที่นี่ จากนั้นลองกด 'เริ่มทำ' → 'พร้อมเสิร์ฟ' → 'เสิร์ฟแล้ว' เพื่อเปลี่ยนสถานะออเดอร์",
        position: "top",
        action: "click",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "go-reports",
        page: "/",
        targetSelector: "[data-tour='reports-button']",
        title: "ดูรายงานยอดขาย 📊",
        content: "กดที่นี่เพื่อดูสรุปยอดขายและรายการทั้งหมด",
        position: "bottom",
        action: "click",
        nextPath: "/reports",
        waitForElement: true,
        allowSkip: true
    },
    {
        id: "complete",
        page: "/reports",
        targetSelector: "body",
        title: "🎉 เสร็จสิ้น!",
        content: "คุณพร้อมใช้งานระบบ POS แล้ว! หากต้องการดู Tour อีกครั้ง สามารถรีเซ็ตได้ในตั้งค่า",
        position: "bottom",
        action: "click",
        waitForElement: false,
        allowSkip: false
    }
];

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [modalCloseEvent, setModalCloseEvent] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const { user, completeOnboarding } = useAuth();

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            const savedStep = localStorage.getItem('cafe_tour_step');

            // If tour was completed or skipped, don't restart
            if (savedStep === 'completed' || savedStep === 'skipped') {
                setIsActive(false);
                return;
            }

            if (savedStep !== null) {
                const step = parseInt(savedStep, 10);
                if (!isNaN(step) && step < TOUR_STEPS.length) {
                    setCurrentStep(step);
                    setIsActive(true);
                }
            } else {
                // New user (or cleared cache) + onboarding incomplete = Auto Start
                setCurrentStep(0);
                setIsActive(true);
            }
        }
    }, [user]);

    // Check if we are on the correct page for the current step
    const isOnCorrectPage = useCallback((step: TourStep) => {
        if (!step) return false;
        if (step.page === "*") return true;
        return step.page === pathname;
    }, [pathname]);

    // Only expose current tour step if we are on the correct page
    const currentTourStep = isActive && currentStep < TOUR_STEPS.length && isOnCorrectPage(TOUR_STEPS[currentStep])
        ? TOUR_STEPS[currentStep]
        : null;

    // Auto-complete tour when reaching the "complete" step
    useEffect(() => {
        if (isActive && TOUR_STEPS[currentStep]?.id === "complete") {
            // Immediately mark as completed
            setIsActive(false);
            setCurrentStep(0);
            localStorage.setItem('cafe_tour_step', 'completed');
            completeOnboarding();
        }
    }, [isActive, currentStep, completeOnboarding]);

    // Note: We intentionally do NOT auto-navigate. The user should click
    // the highlighted buttons to navigate. The tour will simply wait
    // (show nothing) until they are on the correct page.

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
        localStorage.setItem('cafe_tour_step', '0');
    }, []);

    const goToStep = useCallback((nextIdx: number) => {
        if (nextIdx >= TOUR_STEPS.length) {
            setIsActive(false);
            setCurrentStep(0);
            setCurrentStep(0);
            localStorage.setItem('cafe_tour_step', 'completed');
            completeOnboarding();
        } else {
            setCurrentStep(nextIdx);
            localStorage.setItem('cafe_tour_step', nextIdx.toString());
            // align with useEffect: don't push here, let effect handle it
        }
    }, [completeOnboarding]);

    const nextStep = useCallback(() => {
        goToStep(currentStep + 1);
    }, [currentStep, goToStep]);

    const skipStep = useCallback(() => {
        // Identify step groups (modals) that should be skipped together
        const settingsStepIds = ["open-dropdown", "open-settings", "store-name", "store-address", "store-vat", "settings-save"];
        const menuFormStepIds = ["add-menu", "menu-name", "menu-price", "menu-category", "create-category-start", "create-category-input", "create-category-confirm", "menu-save"];

        const currentStepId = TOUR_STEPS[currentStep]?.id;

        // If current step is in settings modal, skip to step after all settings steps
        if (settingsStepIds.includes(currentStepId)) {
            const lastSettingsIndex = TOUR_STEPS.findIndex(s => s.id === "settings-save");
            setModalCloseEvent(prev => prev + 1); // Signal modals to close
            goToStep(lastSettingsIndex + 1);
            return;
        }

        // If current step is in menu form modal, skip to step after all menu form steps
        if (menuFormStepIds.includes(currentStepId)) {
            const lastMenuFormIndex = TOUR_STEPS.findIndex(s => s.id === "menu-save");
            setModalCloseEvent(prev => prev + 1); // Signal modals to close
            goToStep(lastMenuFormIndex + 1);
            return;
        }

        // Default: just skip to next step
        goToStep(currentStep + 1);
    }, [currentStep, goToStep]);

    const skipTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        localStorage.setItem('cafe_tour_step', 'completed');
        completeOnboarding();
    }, [completeOnboarding]);

    const completeTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        localStorage.setItem('cafe_tour_step', 'completed');
        completeOnboarding();
    }, [completeOnboarding]);

    return (
        <TourContext.Provider
            value={{
                isActive,
                currentStep,
                currentTourStep,
                steps: TOUR_STEPS,
                startTour,
                nextStep,
                skipStep,
                skipTour,
                completeTour,
                modalCloseEvent
            }}
        >
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error("useTour must be used within a TourProvider");
    }
    return context;
}
