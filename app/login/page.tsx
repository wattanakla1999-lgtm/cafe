"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                router.push("/");
            } else {
                setError(result.error || "Invalid email or password");
                setIsLoading(false);
            }
        } catch (err) {
            setError("Something went wrong");
            setIsLoading(false); // Only stop loading on error
        }
        // Do NOT stop loading on success, wait for router.push to complete
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-scale-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Cafe System</h1>
                    <p className="text-[var(--color-coffee-500)]">เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">อีเมล</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="owner@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">รหัสผ่าน</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="shadow-lg shadow-orange-200"
                        disabled={isLoading}
                    >
                        {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-[var(--color-coffee-600)]">
                    ยังไม่มีร้านค้า?{" "}
                    <Link href="/register" className="font-bold text-[var(--color-primary)] hover:underline">
                        สร้างบัญชี
                    </Link>
                </div>
            </div>
        </div>
    );
}
