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
            {user ? `Welcome to ${user.storeName}` : "Store Management System"}
          </p>
        </div>

        <div className="grid gap-4">

          {/* Public / Customer Area */}
          <Link href="/menu">
            <Button fullWidth size="lg" variant="outline" className="border-dashed border-[var(--color-primary)] text-[var(--color-primary)]">
              Scan QR (Customer View)
            </Button>
          </Link>

          {!user ? (
            /* Guest View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/login">
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  Login to Store
                </Button>
              </Link>
              <Link href="/register">
                <Button fullWidth variant="ghost">
                  Create New Store
                </Button>
              </Link>
            </div>
          ) : (
            /* Logged In / Store View */
            <div className="space-y-4 pt-4 border-t border-[var(--color-coffee-200)]">
              <Link href="/counter">
                <Button fullWidth size="lg" variant="primary" className="shadow-lg shadow-orange-200">
                  Open Counter
                </Button>
              </Link>

              <Button fullWidth variant="outline" onClick={() => setIsQrOpen(true)}>
                Show Table QR
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/orders">
                  <Button fullWidth variant="secondary">
                    Kitchen
                  </Button>
                </Link>
                <Link href="/call">
                  <Button fullWidth variant="secondary">
                    Calling
                  </Button>
                </Link>
              </div>

              <Link href="/admin/menu">
                <Button fullWidth variant="outline">
                  Manager
                </Button>
              </Link>

              <div className="pt-4">
                <button
                  onClick={logout}
                  className="text-sm text-red-500 hover:underline font-medium"
                >
                  Logout of {user.storeName}
                </button>
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

