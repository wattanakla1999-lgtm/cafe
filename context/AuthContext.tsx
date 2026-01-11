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

    // Fetch user profile (store info)
    const loadStoreProfile = async (authUser: SupabaseUser, retryCount = 0): Promise<User | null> => {
        // Dedup: If a fetch is already running for this user, return the existing promise
        // Only dedup on the first try to avoid locking out retries
        if (profileFetchPromiseRef.current && retryCount === 0) {
            return profileFetchPromiseRef.current;
        }

        const fetchOp = async (): Promise<User | null> => {
            try {
                console.log(`Loading store profile (Attempt ${retryCount + 1})...`);

                const { data: stores, error } = await supabase
                    .from("stores")
                    .select("id, name")
                    .eq("user_id", authUser.id)
                    .maybeSingle();

                if (error) {
                    console.error("Store fetch error:", error);
                    return null;
                }

                if (!stores) {
                    // RETRY LOGIC: If store not found, it might be because the Trigger is still running.
                    // Retry up to 3 times, waiting 1.5 seconds between tries.
                    if (retryCount < 3) {
                        console.warn(`Store not found for user ${authUser.id}, retrying in 1.5s... (${retryCount + 1}/3)`);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        return loadStoreProfile(authUser, retryCount + 1);
                    }
                    return null;
                }

                return {
                    id: authUser.id,
                    email: authUser.email!,
                    storeName: stores.name,
                    storeId: stores.id
                };
            } catch (e) {
                console.error("Profile fetch exception:", e);
                return null;
            } finally {
                // Clean up the lock only if we are the "root" caller
                if (retryCount === 0) {
                    profileFetchPromiseRef.current = null;
                }
            }
        };

        // Only cache the promise if it's the initial call
        if (retryCount === 0) {
            profileFetchPromiseRef.current = fetchOp();
            return profileFetchPromiseRef.current;
        } else {
            return fetchOp();
        }
    };

    // Initialize session with retry for AbortError (common on iOS Safari/Mobile Chrome)
    useEffect(() => {
        let mounted = true;

        const initSession = async (retryCount = 0): Promise<void> => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted && session?.user) {
                    const profile = await loadStoreProfile(session.user);
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
                        const profile = await loadStoreProfile(session.user);
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
            // Call Supabase directly without Promise.race timeout
            // Supabase client handles its own internal timeouts
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (error) {
                console.error("Login Supabase error:", error.message);
                return { success: false, error: error.message };
            }

            // Verify that the user actually has a store profile
            if (data?.user) {
                const profile = await loadStoreProfile(data.user);

                if (!profile) {
                    await supabase.auth.signOut();
                    return { success: false, error: "ไม่พบข้อมูลร้านค้า กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ" };
                }

                // Force update user immediately
                setUser(profile);
            }

            return { success: true };
        } catch (err: any) {
            console.error("Login fatal error:", err);
            // Return the actual error message, not a generic timeout message
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
