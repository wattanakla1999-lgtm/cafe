"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
    name: string;
    email: string;
    storeName: string;
    storeImage?: string; // Base64 image
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (storeName: string, name: string, email: string, password: string, storeImage?: string) => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    // Check for persisted session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem("cafe_user");
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user session", e);
                localStorage.removeItem("cafe_user");
            }
        }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulating API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock validation: In a real app, this would verify with backend
                if (email && password) {
                    const mockUser: User = {
                        name: "Demo Owner",
                        email: email, // Use provided email
                        storeName: "My Demo Cafe", // Default for direct login
                    };

                    // If we have a registered user in memory/storage (mock), we should use that
                    // For now, let's just create a session.

                    // Check if there's a registered user in localStorage for demo purposes
                    const registeredStore = localStorage.getItem("registered_store");
                    if (registeredStore) {
                        const parsed = JSON.parse(registeredStore);
                        if (parsed.email === email) {
                            mockUser.name = parsed.name;
                            mockUser.storeName = parsed.storeName;
                        }
                    }

                    setUser(mockUser);
                    localStorage.setItem("cafe_user", JSON.stringify(mockUser));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 800);
        });
    };

    const register = async (storeName: string, name: string, email: string, password: string, storeImage?: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newUser: User = {
                    name,
                    email,
                    storeName,
                    storeImage
                };
                setUser(newUser);
                localStorage.setItem("cafe_user", JSON.stringify(newUser));
                // Save for login simulation
                localStorage.setItem("registered_store", JSON.stringify({ ...newUser, password })); // Insecure, but fine for mock demo
                resolve(true);
            }, 1000);
        });
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("cafe_user", JSON.stringify(updatedUser));

        // Also update registered store entry for persistence across re-logins in this mock
        const registeredStore = localStorage.getItem("registered_store");
        if (registeredStore) {
            const parsed = JSON.parse(registeredStore);
            if (parsed.email === user.email) {
                localStorage.setItem("registered_store", JSON.stringify({ ...parsed, ...updates }));
            }
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("cafe_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            updateUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
