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

    // Keep track of ongoing profile fetches to prevent race conditions/double-fetching
    const profileFetchPromiseRef = React.useRef<Promise<any> | null>(null);

    // Fetch user profile (store info) using direct fetch to bypass Supabase client state issues
    const loadStoreProfile = async (authUser: SupabaseUser, accessToken?: string, retryCount = 0): Promise<User | null> => {
        try {
            console.log(`Loading store profile (Attempt ${retryCount + 1})...`);

            // Get current session for access token
            const { data: { session } } = await supabase.auth.getSession();
            console.log("Session for store query:", session ? "exists" : "null");

            if (!session) {
                console.error("No session available for store query");
                return null;
            }

            // Use direct fetch instead of Supabase client to avoid potential state issues
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const response = await fetch(
                `${supabaseUrl}/rest/v1/stores?user_id=eq.${authUser.id}&select=id,name`,
                {
                    method: 'GET',
                    headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log("Store fetch response status:", response.status);

            if (!response.ok) {
                console.error("Store fetch failed:", response.status, response.statusText);
                return null;
            }

            const stores = await response.json();
            console.log("Store query result:", stores);

            if (!stores || stores.length === 0) {
                // RETRY LOGIC: If store not found, it might be because the Trigger is still running.
                if (retryCount < 3) {
                    console.warn(`Store not found for user ${authUser.id}, retrying in 1.5s... (${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    return loadStoreProfile(authUser, accessToken, retryCount + 1);
                }
                console.error("Store not found after 3 retries");
                return null;
            }

            const store = stores[0];
            const profile = {
                id: authUser.id,
                email: authUser.email!,
                storeName: store.name,
                storeId: store.id
            };
            console.log("Profile loaded successfully:", profile.email);
            return profile;
        } catch (e) {
            console.error("Profile fetch exception:", e);
            return null;
        }
    };

    // Initialize session with retry for AbortError (common on iOS Safari/Mobile Chrome)
    useEffect(() => {
        let mounted = true;

        const initSession = async (retryCount = 0): Promise<void> => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted && session?.user) {
                    const profile = await loadStoreProfile(session.user, session.access_token);
                    if (mounted) setUser(profile);
                }
            } catch (error: any) {
                // Handle AbortError with retry (common on mobile browsers)
                if (error?.name === 'AbortError' && retryCount < 2) {
                    console.warn(`Session init aborted, retrying... (${retryCount + 1}/2)`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return initSession(retryCount + 1);
                }
                console.error("Session init error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.id);

            if (session?.user) {
                const currentUser = userRef.current;
                // Only load if user changed or we don't have one
                if (!currentUser || currentUser.id !== session.user.id) {
                    try {
                        const profile = await loadStoreProfile(session.user, session.access_token);
                        if (mounted) setUser(profile);
                    } catch (e: any) {
                        // Silently handle AbortError in auth state change
                        if (e?.name !== 'AbortError') {
                            console.error("Profile load error:", e);
                        }
                    }
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
        try {
            console.log("Login attempt for:", email.trim());

            // Call Supabase directly
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            console.log("Login response:", { data: !!data?.user, error: error?.message });

            if (error) {
                console.error("Login Supabase error:", error.message);
                return { success: false, error: error.message };
            }

            // Don't load store profile here - let onAuthStateChange handle it
            // This avoids race conditions between login() and onAuthStateChange both calling loadStoreProfile
            if (data?.user) {
                console.log("Login successful, auth ID:", data.user.id);
                // The onAuthStateChange callback will handle loading the profile
            }

            return { success: true };
        } catch (err: any) {
            console.error("Login fatal error:", err);
            return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
        }
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
