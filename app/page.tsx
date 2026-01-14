"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { OrderQRModal } from "../components/OrderQRModal";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // No need to set false, router will redirect
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="max-w-md w-full text-center space-y-8 animate-scale-up">

        {/* ... Header ... */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-primary)]">Cafe System</h1>
          <p className="text-[var(--color-coffee-500)]">
            {user ? `ยินดีต้อนรับสู่ ${user.storeName}` : "ระบบจัดการร้านค้า"}
          </p>
        </div>

        <div className="grid gap-4">

          {/* ... Public Area ... */}
          <div className="pt-4">
            <Button fullWidth variant="outline" onClick={() => setIsQrOpen(true)}>
              แสดง QRCode เพื่อสั่งเมนู
            </Button>
          </div>



          {!user ? (
            /* ... Guest View ... */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">

              <Link href="/login">
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  เข้าสู่ระบบร้านค้า
                </Button>
              </Link>
              <div>user{user}</div>
              <Link href="/register">
                <Button fullWidth variant="ghost">
                  สร้างร้านค้าใหม่
                </Button>
              </Link>
            </div>
          ) : (


            /* Logged In / Store View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/counter">
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  เปิดจุดชำระเงิน
                </Button>
              </Link>

              <div className="pt-4 gap-4">
                <Link href="/reports">
                  <Button fullWidth variant="outline">
                    รายงาน
                  </Button>
                </Link>
              </div>

              <div >
                <Link href="/admin/menu">
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
      </div>

      <OrderQRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
      )}
    </div>
  );
}

