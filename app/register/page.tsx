"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { passwordSchema, sanitizeInput } from "../../lib/security";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [storeName, setStoreName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Security: Validate password strength
        try {
            passwordSchema.parse(password);
        } catch (err: any) {
            setError(err.errors[0].message);
            return;
        }

        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            return;
        }

        setIsLoading(true);

        try {
            // Security: Sanitize inputs
            const safeStoreName = sanitizeInput(storeName);
            const safeName = sanitizeInput(name);

            const result = await register(safeStoreName, safeName, email, password);
            if (result.success) {
                router.push("/");
            } else {
                setError(result.error || "Registration failed");
                setIsLoading(false);
            }
        } catch (err) {
            setError("Something went wrong");
            setIsLoading(false); // Only stop loading on error
        }
        // Do NOT stop loading on success, wait for router.push to complete
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 py-8">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-scale-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">สร้างบัญชี</h1>
                    <p className="text-[var(--color-coffee-500)]">เริ่มจัดการร้านค้าของคุณได้วันนี้</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ชื่อร้านค้า</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="เช่น คาเฟ่แสนสุข"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ชื่อเจ้าของร้าน</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="สมชาย ใจดี"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">อีเมล</label>
                        <input
                            type="email"
                            required
                            maxLength={255}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="owner@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">รหัสผ่าน</label>
                            <input
                                type="password"
                                required
                                maxLength={100}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">ยืนยันรหัสผ่าน</label>
                            <input
                                type="password"
                                required
                                maxLength={100}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="text-xs text-[var(--color-coffee-500)] space-y-1 bg-[var(--color-coffee-50)] p-3 rounded-lg border border-[var(--color-coffee-100)]">
                        <p className="font-bold mb-1">รหัสผ่านต้องประกอบด้วย:</p>
                        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600 font-medium' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                8 ตัวอักษรขึ้นไป
                            </li>
                            <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600 font-medium' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                ตัวพิมพ์ใหญ่ (A-Z)
                            </li>
                            <li className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-green-600 font-medium' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                ตัวพิมพ์เล็ก (a-z)
                            </li>
                            <li className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600 font-medium' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                ตัวเลข (0-9)
                            </li>
                            <li className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 font-medium' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                อักขระพิเศษ (!@#$%)
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="shadow-lg shadow-orange-200 mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? "กำลังสร้างร้านค้า..." : "ลงทะเบียนร้านค้า"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-[var(--color-coffee-600)]">
                    มีร้านค้าอยู่แล้ว?{" "}
                    <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
                        เข้าสู่ระบบ
                    </Link>
                </div>
            </div>
        </div>
    );
}
