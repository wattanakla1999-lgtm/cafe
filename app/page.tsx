"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { OrderQRModal } from "../components/OrderQRModal";
import { useTour } from "../context/TourContext";
import { useLoading } from "../context/LoadingContext";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const { isActive, startTour, currentTourStep } = useTour();
  const { showLoading, hideLoading } = useLoading();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if should show welcome modal to start tour
  useEffect(() => {
    if (user && !user.onboardingCompleted && !isActive) {
      // Check if we haven't started tour yet
      const savedStep = localStorage.getItem('cafe_tour_step');
      if (savedStep === null) {
        setShowWelcome(true);
      } else if (savedStep !== 'skipped' && savedStep !== 'completed') {
        startTour(); // Resume tour
      }
    }
  }, [user, isActive, startTour]);

  const handleStartTour = () => {
    setShowWelcome(false);
    startTour();
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
    // Mark as completed without starting
    localStorage.setItem('cafe_tour_step', 'skipped');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    showLoading("กำลังออกจากระบบ...");
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--color-coffee-600)] animate-pulse">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[var(--color-background)]">
      <div className="max-w-md w-full mx-auto text-center space-y-8 animate-scale-up">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-primary)]">Cafe System</h1>
          <p className="text-[var(--color-coffee-500)]">
            {user ? `ยินดีต้อนรับสู่ ${user.storeName}` : "ระบบจัดการร้านค้า"}
          </p>
        </div>

        <div className="grid gap-4">

          {/* Public Area */}
          <div className="pt-4">
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                showLoading("กำลังโหลด QRCode...");
                setTimeout(() => {
                  hideLoading();
                  setIsQrOpen(true);
                }, 300);
              }}
            >
              แสดง QRCode เพื่อสั่งเมนู
            </Button>
          </div>

          {!user ? (
            /* Guest View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/login" onClick={() => showLoading("กำลังโหลดหน้าเข้าสู่ระบบ...")}>
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  เข้าสู่ระบบร้านค้า
                </Button>
              </Link>
              <Link href="/register" onClick={() => showLoading("กำลังโหลดหน้าสมัครสมาชิก...")}>
                <Button fullWidth variant="ghost">
                  สร้างร้านค้าใหม่
                </Button>
              </Link>
            </div>
          ) : (
            /* Logged In / Store View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/counter" data-tour="counter-button" onClick={() => showLoading("กำลังเปิดจุดชำระเงิน...")}>
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  เปิดจุดชำระเงิน
                </Button>
              </Link>

              <div className="pt-4 gap-4" data-tour="reports-button">
                <Link href="/reports" onClick={() => showLoading("กำลังโหลดรายงาน...")}>
                  <Button fullWidth variant="outline">
                    รายงาน
                  </Button>
                </Link>
              </div>

              <div data-tour="menu-button">
                <Link href="/admin/menu" onClick={() => showLoading("กำลังโหลดหน้าจัดการเมนู...")}>
                  <Button fullWidth variant="outline">
                    จัดการเมนู
                  </Button>
                </Link>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setShowLogoutConfirm(true)}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-600"
                >
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div >

      <OrderQRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />

      {/* Welcome Modal - Start Tour */}
      {
        showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
              <div className="p-6 text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-4xl shadow-lg shadow-orange-200 mx-auto">
                  ☕
                </div>
                <h2 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับ! 🎉</h2>
                <p className="text-gray-600">
                  ขอบคุณที่เลือกใช้ <span className="font-bold text-orange-600">Cafe POS</span>
                </p>
                <p className="text-gray-500 text-sm">
                  มาเรียนรู้การใช้งานเบื้องต้นกัน!
                  <br />
                  เราจะพาคุณตั้งค่าร้านทีละขั้นตอน ✨
                </p>
              </div>
              <div className="p-6 pt-0 space-y-3">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleStartTour}
                  className="shadow-lg shadow-orange-200"
                >
                  เริ่มกันเลย! 🚀
                </Button>
                <button
                  onClick={handleSkipTour}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ข้ามการแนะนำ
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Logout Confirmation Modal */}
      {
        showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-scale-up">
              <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการออกจากระบบ</h3>
              <p className="text-gray-600 mb-6">คุณต้องการออกจากระบบใช่หรือไม่?</p>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                >
                  ยกเลิก
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
