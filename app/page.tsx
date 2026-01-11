"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { OrderQRModal } from "../components/OrderQRModal";

export default function Home() {
  const { user, logout } = useAuth();
  const [isQrOpen, setIsQrOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="max-w-md w-full text-center space-y-8 animate-scale-up">

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-primary)]">Cafe System</h1>
          <p className="text-[var(--color-coffee-500)]">
            {user ? `ยินดีต้อนรับสู่ ${user.storeName}` : "ระบบจัดการร้านค้า"}
          </p>
        </div>

        <div className="grid gap-4">

          {/* Public / Customer Area */}
          {/* <Link href="/menu">
            <Button fullWidth size="lg" variant="outline" className="border-dashed border-[var(--color-primary)] text-[var(--color-primary)]">
              สแกน QR Code (มุมมองลูกค้า)
            </Button>
          </Link> */}


          <div className="pt-4">
            <Button fullWidth variant="outline" onClick={() => setIsQrOpen(true)}>
              แสดง QRCode เพื่อสั่งเมนู
            </Button>
          </div>


          {!user ? (
            /* Guest View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/login">
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  เข้าสู่ระบบร้านค้า
                </Button>
              </Link>
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



              {/* <div className="grid grid-cols-2 gap-3">
                <Link href="/orders">
                  <Button fullWidth variant="secondary">
                    ครัว
                  </Button>
                </Link>
                <Link href="/call">
                  <Button fullWidth variant="secondary">
                    เรียกคิว
                  </Button>
                </Link>
              </div> */}

              <div className="pt-4">
                <Link href="/admin/menu">
                  <Button fullWidth variant="outline">
                    จัดการเมนู
                  </Button>
                </Link>
              </div>

              <div className="pt-4">
                <Button
                  onClick={logout}
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
    </div>
  );
}

