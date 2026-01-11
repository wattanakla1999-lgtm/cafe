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
    accessToken: string; // Added for direct REST API calls
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

    // Track ongoing profile fetch promise to prevent race conditions and deduplicate requests
    const profileFetchPromiseRef = React.useRef<Promise<User | null> | null>(null);

    // Fetch user profile from stores table (using direct fetch to avoid client state issues)
    // Fetch user profile from stores table (using direct fetch to avoid client state issues)
    const loadStoreProfile = async (
        authUser: SupabaseUser,
        accessToken: string
    ): Promise<User | null> => {
        // REQUEST DEDUPLICATION: If a fetch is already in progress, return that promise
        if (profileFetchPromiseRef.current) {
            console.log(`[Profile] ♻️ Reusing existing profile fetch promise for ${authUser.id}`);
            return profileFetchPromiseRef.current;
        }

        const fetchLogic = async () => {
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    console.log(`[Profile] 📥 Loading store (Attempt ${retryCount + 1})...`);

                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/stores?user_id=eq.${authUser.id}&select=id,name`,
                        {
                            method: 'GET',
                            headers: {
                                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                        }
                    );

                    if (!response.ok) {
                        // 5xx errors should be retried, 4xx (except 429) usually fatal
                        if (response.status >= 500 || response.status === 429) {
                            throw new Error(`Server error: ${response.status}`);
                        }
                        console.error(`[Profile] ❌ Fetch failed: ${response.status} ${response.statusText}`);
                        return null; // Fatal error (e.g. 401, 403)
                    }

                    const stores = await response.json();

                    if (!stores || stores.length === 0) {
                        // Store not found. Might be latency in replication? Retry.
                        console.warn(`[Profile] ⏳ Store not found yet, retrying... (${retryCount + 1}/${maxRetries})`);
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    // Success!
                    const store = stores[0];
                    const profile: User = {
                        id: authUser.id,
                        email: authUser.email!,
                        storeName: store.name || "Unknown Store",
                        storeId: store.id,
                        accessToken: accessToken
                    };

                    console.log("[Profile] ✅ Success:", profile.email);
                    return profile;

                } catch (error: any) {
                    console.error(`[Profile] ❌ Exception (Attempt ${retryCount + 1}):`, error);
                    // Check if we should retry (e.g. network error)
                    if (retryCount < maxRetries - 1) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return null;
                }
            }

            console.error("[Profile] ❌ Failed after max retries");
            return null;
        };

        const fetchPromise = fetchLogic().finally(() => {
            profileFetchPromiseRef.current = null;
        });

        profileFetchPromiseRef.current = fetchPromise;
        return fetchPromise;
    };

    // Initialize session via listener mostly
    // Initialize session
    useEffect(() => {
        let mounted = true;

        // 1. Safety timer: guaranteed stop loading after 3s
        const safetyTimer = setTimeout(() => {
            if (mounted) {
                console.log("[Auth] ⚠️ Force-stopping loading state (safety timeout)");
                setIsLoading(false);
            }
        }, 3000);

        const init = async () => {
            // IMMEDIATE: Load from localStorage cache first (instant UI)
            try {
                const cachedUser = localStorage.getItem('cafe_user');
                if (cachedUser) {
                    const parsed = JSON.parse(cachedUser);
                    console.log("[Auth] 💾 Restored user from cache:", parsed.email);
                    setUser(parsed);
                    setIsLoading(false); // Stop loading immediately with cached data
                }
            } catch (err) {
                console.warn("[Auth] Failed to restore from cache:", err);
            }

            // THEN: Verify with server in background (best effort, not required)
            await new Promise(r => setTimeout(r, 200));

            try {
                console.log("[Auth] Verifying session with server...");

                const { data, error } = await supabase.auth.getSession();

                if (mounted && !error && data.session?.user && data.session?.access_token) {
                    console.log("[Auth] ✅ Session verified, refreshing profile...");
                    const profile = await loadStoreProfile(data.session.user, data.session.access_token);
                    if (mounted && profile) {
                        setUser(profile);
                        localStorage.setItem('cafe_user', JSON.stringify(profile)); // Update cache
                    }
                } else if (mounted && !data.session) {
                    // No session exists - clear cache and logout
                    console.log("[Auth] No active session - clearing cache");
                    localStorage.removeItem('cafe_user');
                    setUser(null);
                    setIsLoading(false);
                }
                // If error (like AbortError), just ignore and keep using cached user
            } catch (err) {
                console.warn("[Auth] Session verification failed, using cached data:", err);
                // Keep cached user, don't logout
            }
        };

        init();

        // 3. Listen for changes (runs in parallel/subsequent)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`[Auth] 🔔 Event: ${event}, has session:`, !!session);
                if (!mounted) return;

                if (event === "SIGNED_OUT") {
                    console.log("[Auth] User signed out, clearing state");
                    setUser(null);
                    localStorage.removeItem('cafe_user');
                    return;
                }

                // Handle all session-present events: login, refresh, and CRITICAL: initial session on mount
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
                    if (session?.user && session?.access_token) {
                        console.log(`[Auth] Event ${event}: Loading profile from listener...`);
                        const profile = await loadStoreProfile(session.user, session.access_token);
                        if (mounted) {
                            if (profile) {
                                console.log(`[Auth] ✅ Profile loaded via ${event}`);
                                setUser(profile);
                                localStorage.setItem('cafe_user', JSON.stringify(profile));
                            } else {
                                console.error(`[Auth] ❌ Profile load failed via ${event}`);
                            }
                        }
                    }
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []); // Empty deps - only run once on mount

    const login = async (email: string, password: string) => {
        try {
            console.log("[Login] 🔐 Attempting login:", email.trim());

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (error) {
                console.error("[Login] ❌ Error:", error.message);
                return { success: false, error: error.message };
            }

            if (!data?.user || !data?.session) {
                return { success: false, error: "No user data returned" };
            }

            console.log("[Login] ✅ Auth successful, loading profile...");

            // Load profile immediately after successful login
            const profile = await loadStoreProfile(data.user, data.session.access_token);

            if (!profile) {
                console.error("[Login] ❌ Failed to load profile");
                return { success: false, error: "ไม่สามารถโหลดข้อมูลร้านค้าได้" };
            }

            setUser(profile);
            localStorage.setItem('cafe_user', JSON.stringify(profile)); // Cache for refresh
            console.log("[Login] ✅ Login complete");

            return { success: true };
        } catch (err: any) {
            console.error("[Login] ❌ Fatal error:", err);
            return {
                success: false,
                error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
            };
        }
    };

    const register = async (
        storeName: string,
        name: string,
        email: string,
        password: string
    ) => {
        try {
            const { error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: name,
                        store_name: storeName,
                    },
                    emailRedirectTo: `${window.location.origin}/login`
                }
            });

            if (authError) {
                return { success: false, error: authError.message };
            }

            return { success: true };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || "Registration failed"
            };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error: any) {
            // Ignore AbortError which happens on rapid navigation/logout
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                // console.warn("[Logout] Aborted (expected)");
                return;
            }
            console.error("[Logout] Error:", error);
        } finally {
            // Always clear local state and redirect, even if server request fails
            setUser(null);
            localStorage.removeItem('cafe_user'); // Clear cache
            router.push("/login"); // or /
        }
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                updateUser,
                isAuthenticated: !!user
            }}
        >
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