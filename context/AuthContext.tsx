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
    address?: string | null;
    taxType?: 'none' | 'include' | 'exclude';
    vatRate?: number;
    storeImage?: string | null;
    accessToken?: string;
    onboardingCompleted?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (storeName: string, name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateStoreSettings: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    completeOnboarding: () => Promise<{ success: boolean; error?: string }>;
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
    const loadStoreProfile = async (
        authUser: SupabaseUser,
        accessToken: string
    ): Promise<User | null> => {
        // REQUEST DEDUPLICATION
        if (profileFetchPromiseRef.current) {
            return profileFetchPromiseRef.current;
        }

        const fetchLogic = async () => {
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    console.log(`[Profile] 📥 Loading store (Attempt ${retryCount + 1})...`);

                    let storesData: any[] | null = null;

                    // Try to fetch with new columns first
                    const { data: stores, error } = await supabase
                        .from('stores')
                        .select('id,name,address,tax_type,vat_rate,store_image,onboarding_completed')
                        .eq('user_id', authUser.id);

                    if (error) {
                        console.warn(`[Profile] ⚠️ Primary query failed (likely missing column), trying fallback...`, error);

                        // Fallback: Fetch without 'onboarding_completed'
                        const { data: storesFallback, error: errorFallback } = await supabase
                            .from('stores')
                            .select('id,name,address,tax_type,vat_rate,store_image')
                            .eq('user_id', authUser.id);

                        if (errorFallback) {
                            if (errorFallback.code === 'PGRST301' || errorFallback.message?.includes('JWT')) {
                                throw new Error(`Auth error: ${errorFallback.message}`);
                            }
                            console.error(`[Profile] ❌ Fallback query failed:`, JSON.stringify(errorFallback, null, 2));
                            return null;
                        }
                        storesData = storesFallback;
                    } else {
                        storesData = stores;
                    }

                    if (!storesData || storesData.length === 0) {
                        console.warn(`[Profile] ⏳ Store not found yet, retrying...`);
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    // Success!
                    const store = storesData[0];

                    // Check local cache if we fell back (DB column missing) or if DB says false (update failed)
                    let finalOnboardingCompleted = store.onboarding_completed ?? false;

                    // TRUST LOCAL: If DB says false/undefined, but we have a local "true", respect the local "true"
                    // to prevent the tour from reappearing if the DB update failed or column is missing.
                    if (!finalOnboardingCompleted) {
                        try {
                            const cachedUserStr = localStorage.getItem('cafe_user');
                            if (cachedUserStr) {
                                const cached = JSON.parse(cachedUserStr);
                                if (cached.id === authUser.id && cached.onboardingCompleted) {
                                    console.log("[Profile] ⚠️ Using cached onboarding status (DB says false/missing)");
                                    finalOnboardingCompleted = true;
                                }
                            }
                        } catch (e) { /* ignore json parse error */ }
                    }

                    const profile: User = {
                        id: authUser.id,
                        email: authUser.email!,
                        storeName: store.name || "Unknown Store",
                        storeId: store.id,
                        accessToken: accessToken,
                        address: store.address,
                        taxType: store.tax_type as 'none' | 'include' | 'exclude',
                        vatRate: store.vat_rate,
                        storeImage: store.store_image,
                        onboardingCompleted: finalOnboardingCompleted
                    };

                    console.log("[Profile] ✅ Success:", profile.email);
                    return profile;

                } catch (error: any) {
                    console.error(`[Profile] ❌ Exception:`, error);
                    if (retryCount < maxRetries - 1) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return null;
                }
            }
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
        // CRITICAL: DO NOT use async/await inside onAuthStateChange callback!
        // This causes Supabase client deadlock when browser tab returns from inactive state.
        // See: https://github.com/supabase/supabase-js/issues/...
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log(`[Auth] 🔔 Event: ${event}, has session:`, !!session);
                if (!mounted) return;

                if (event === "SIGNED_OUT") {
                    console.log("[Auth] User signed out, clearing state");
                    setUser(null);
                    localStorage.removeItem('cafe_user');
                    router.push("/login");
                    return;
                }

                // Handle token expiry - redirect to login
                if (event === "TOKEN_REFRESHED" && !session) {
                    console.log("[Auth] 🔐 Token refresh failed (expired), redirecting to login");
                    setUser(null);
                    localStorage.removeItem('cafe_user');
                    router.push("/login");
                    return;
                }

                // Handle all session-present events: login, refresh, and CRITICAL: initial session on mount
                // Use setTimeout to defer async operations OUTSIDE the callback to prevent deadlock
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
                    if (session?.user && session?.access_token) {
                        console.log(`[Auth] Event ${event}: Deferring profile load to avoid deadlock...`);

                        // DEFER the async operation outside the callback
                        setTimeout(async () => {
                            if (!mounted) return;
                            try {
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
                            } catch (err) {
                                console.error(`[Auth] Exception loading profile via ${event}:`, err);
                            }
                        }, 0);
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
        phone: string,
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
                        phone: phone,
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

    const updateStoreSettings = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
        if (!user?.storeId) return { success: false, error: "No store ID found" };

        try {
            console.log("[Auth] Updating store settings...", updates);

            // Map camelCase to snake_case for DB
            const dbUpdates: any = {};
            if (updates.storeName !== undefined) dbUpdates.name = updates.storeName;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.taxType !== undefined) dbUpdates.tax_type = updates.taxType;
            if (updates.vatRate !== undefined) dbUpdates.vat_rate = updates.vatRate;
            if (updates.storeImage !== undefined) dbUpdates.store_image = updates.storeImage;

            const { error } = await supabase
                .from('stores')
                .update(dbUpdates)
                .eq('id', user.storeId);

            if (error) {
                console.error("[Auth] Update failed:", error);
                return { success: false, error: error.message };
            }

            // Update local state and cache
            const newUser = { ...user, ...updates };
            setUser(newUser);
            localStorage.setItem('cafe_user', JSON.stringify(newUser));

            return { success: true };
        } catch (error: any) {
            console.error("[Auth] Update exception:", error);
            return { success: false, error: error.message };
        }
    };

    const completeOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
        if (!user?.storeId) return { success: false, error: "No store ID found" };

        try {
            console.log("[Auth] Completing onboarding...");

            const { error } = await supabase
                .from('stores')
                .update({ onboarding_completed: true })
                .eq('id', user.storeId);

            if (error) {
                console.error("[Auth] Onboarding complete failed (DB):", error);
                // Fallback: Continue to update local state
            }

            // CRITICAL: Create a completely new object reference to ensure React triggers re-renders
            // explicitly spreading properties and ensuring onboardingCompleted is the LAST override
            const updatedUser: User = {
                ...user,
                onboardingCompleted: true
            };

            // 1. Update State
            setUser(updatedUser);

            // 2. Update Local Storage
            localStorage.setItem('cafe_user', JSON.stringify(updatedUser));

            // Force a small timeout to ensure propagation if needed (rarely needed but safe)
            setTimeout(() => {
                const checkUser = localStorage.getItem('cafe_user');
                console.log("[Auth] Double checking storage:", checkUser);
            }, 100);

            console.log("[Auth] ✅ Onboarding completed (Local state updated force)");
            return { success: true };
        } catch (error: any) {
            console.error("[Auth] Onboarding exception:", error);

            // Even on exception, try to update local state
            if (user) {
                const updatedUser: User = { ...user, onboardingCompleted: true };
                setUser(updatedUser);
                localStorage.setItem('cafe_user', JSON.stringify(updatedUser));
            }
            return { success: false, error: error.message };
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
                updateStoreSettings,
                completeOnboarding,
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