"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [storeName, setStoreName] = useState("");
    const [storeImage, setStoreImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setStoreImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const success = await register(storeName, name, email, password, storeImage || undefined);
            if (success) {
                router.push("/");
            } else {
                setError("Registration failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 py-8">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-scale-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Create Account</h1>
                    <p className="text-[var(--color-coffee-500)]">Start managing your store today</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    {/* Store Image Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-24 h-24 rounded-full bg-[var(--color-coffee-50)] border-2 border-dashed border-[var(--color-coffee-200)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-colors relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {storeImage ? (
                                <img src={storeImage} alt="Store Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-[var(--color-coffee-400)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[10px] font-bold">Upload Logo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Store Name</label>
                        <input
                            type="text"
                            required
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="e.g. My Cool Cafe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Owner Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                            placeholder="owner@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">Confirm</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="shadow-lg shadow-orange-200 mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Store..." : "Register Store"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-[var(--color-coffee-600)]">
                    Already have a store?{" "}
                    <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
