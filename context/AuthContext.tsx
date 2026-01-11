"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
    id: string;
    email: string;
    storeName: string;
    storeId: string;
    storeImage?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (storeName: string, name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Keep a ref to the current user to avoid stale closures in the subscription callback
    const userRef = React.useRef<User | null>(null);
    useEffect(() => { userRef.current = user; }, [user]);

    // Fetch user profile (store info)
    const loadStoreProfile = async (authUser: SupabaseUser) => {
        try {
            console.log("Loading store profile..."); // Debug log to confirm new code
            const { data: stores, error } = await supabase
                .from("stores")
                .select("id, name")
                .eq("user_id", authUser.id)
                .maybeSingle(); // Suppress error for missing store

            if (error) {
                // If any error occurs (e.g. multiple rows, connection issue), treat as no store found
                return null;
            }

            // If no store found (stores is null), usually means data integrity issue or new user not set up
            if (!stores) return null;

            if (stores) {
                return {
                    id: authUser.id,
                    email: authUser.email!,
                    storeName: stores.name,
                    storeId: stores.id
                };
            }
        } catch (e) {
            console.error("Profile fetch error:", e);
        }
        return null;
    };

    // Initialize session
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted && session?.user) {
                    const profile = await loadStoreProfile(session.user);
                    if (mounted) setUser(profile);
                }
            } catch (error) {
                console.error("Session init error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.id);

            if (session?.user) {
                // Check against ref to avoid stale closure
                const currentUser = userRef.current;

                // If we don't have a user, OR the auth user changed, fetch profile
                if (!currentUser || currentUser.id !== session.user.id) {
                    const profile = await loadStoreProfile(session.user);
                    if (mounted) setUser(profile);
                }
            } else {
                if (mounted) setUser(null);
            }

            if (event === "SIGNED_OUT") {
                router.push("/login");
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Verify that the user actually has a store profile
        if (data.user) {
            const profile = await loadStoreProfile(data.user);
            if (!profile) {
                await supabase.auth.signOut();
                return { success: false, error: "ไม่พบข้อมูลร้านค้า (Store not found)" };
            }
        }

        // Profile will be loaded by onAuthStateChange
        return { success: true };
    };

    const register = async (storeName: string, name: string, email: string, password: string) => {
        // 1. Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    full_name: name,
                    store_name: storeName
                },
                emailRedirectTo: `${window.location.origin}/login`
            }
        });

        if (authError) {
            return { success: false, error: authError.message };
        }

        // Store creation is now handled by a Database Trigger (see setup_trigger.sql)
        // We don't need to manually insert into 'stores' anymore.

        return { success: true };

        return { success: false, error: "Registration failed" };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/login"); // Force redirect
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
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
