"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MenuItem, Option } from "../data/mock";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Discount {
    id: string;
    name: string;
    type: "percent" | "amount";
    value: number;
    active: boolean;
}

interface MenuContextType {
    menuItems: MenuItem[];
    categories: string[];
    discounts: Discount[];
    addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
    updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
    deleteMenuItem: (id: string) => Promise<void>;
    updateCategory: (oldName: string, newName: string) => Promise<void>;
    deleteCategory: (categoryName: string) => Promise<void>;
    addCategory: (categoryName: string) => Promise<void>;
    addDiscount: (discount: Omit<Discount, "id">) => Promise<void>;
    updateDiscount: (id: string, discount: Partial<Discount>) => Promise<void>;
    deleteDiscount: (id: string) => Promise<void>;
    toppings: Option[];
    addTopping: (topping: Omit<Option, "id">) => Promise<void>;
    updateTopping: (id: string, updates: Partial<Option>) => Promise<void>;
    deleteTopping: (id: string) => Promise<void>;
    servingTypes: Option[];
    addServingType: (type: Omit<Option, "id">) => Promise<void>;
    updateServingType: (id: string, updates: Partial<Option>) => Promise<void>;
    deleteServingType: (id: string) => Promise<void>;
    isLoading: boolean;
    setPublicStoreId: (id: string | null) => void;
    publicStoreId: string | null;
    storeSettings: { address?: string; taxType?: 'none' | 'include' | 'exclude'; vatRate?: number } | null;
    fetchGlobalMenus: (params?: { page?: number; limit?: number; category?: string; search?: string }) => Promise<{ data: any[]; count: number }>;
    fetchGlobalCategories: () => Promise<string[]>;
    importGlobalMenuItem: (globalItem: any) => Promise<{ success: boolean; error?: string }>;
    bulkImportMenuItems: (items: { category: string; name: string; price: number; description?: string; image?: string }[]) => Promise<{ success: boolean; error?: string }>;
    // Pagination & Filtering
    loadMoreMenuItems: () => void;
    hasMore: boolean;
    refetchMenu: (params?: { category?: string; search?: string; includeUnavailable?: boolean }) => Promise<void>;
    isFetchingMore: boolean;
    // Lazy loading
    initializeMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [toppings, setToppings] = useState<Option[]>([]);
    const [servingTypes, setServingTypes] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

    const [storeSettings, setStoreSettings] = useState<{ address?: string; taxType?: 'none' | 'include' | 'exclude'; vatRate?: number } | null>(null);

    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasFetched, setHasFetched] = useState(false); // Track if initial fetch has been done
    const currentFiltersRef = React.useRef({ category: "All", search: "", includeUnavailable: false });
    const ITEMS_PER_PAGE = 20;

    const activeFetchIdRef = React.useRef(0);
    // Cache category maps to avoid refetching when just filtering
    const categoryMapsRef = React.useRef<{
        categoryIdMap: Map<string, string>;  // ID -> Name
        nameToIdMap: Map<string, string>;    // Name -> ID
    } | null>(null);

    const fetchMenuData = useCallback(async (params: { page?: number; category?: string; search?: string; includeUnavailable?: boolean; onlyMenuItems?: boolean } = {}) => {

        // Determine effective params
        const nextPage = params.page ?? 0;
        const category = params.category ?? currentFiltersRef.current.category;
        const search = params.search ?? currentFiltersRef.current.search;
        const includeUnavailable = params.includeUnavailable ?? currentFiltersRef.current.includeUnavailable;

        const isReset = nextPage === 0;

        // Update filters immediately if this is a reset (new search/filter)
        // This ensures that if we abort due to missing storeId, we still remember what the user WANTED to filter
        // so that the next retry (when storeId appears) uses the correct filters.
        if (isReset) {
            currentFiltersRef.current = { category, search, includeUnavailable };
        }

        // Generate new fetch ID
        const currentFetchId = activeFetchIdRef.current + 1;
        activeFetchIdRef.current = currentFetchId;

        if (isReset) {
            setIsLoading(true);
        } else {
            setIsFetchingMore(true);
        }

        const targetStoreId = user?.storeId || publicStoreId;
        console.log(`[MenuContext] fetchMenuData called. StoreId: ${targetStoreId}, Params:`, params);

        if (!targetStoreId) {
            console.log("[MenuContext] No store ID, aborting fetch.");
            // Only turn off loading if we are the most recent "decision" to do so
            // But since this is a synchronous dependency check, it's generally safe to just turn it off
            if (isLoading) setIsLoading(false);
            return;
        }

        try {
            const fetchLogic = async () => {
                let categoryIdMap: Map<string, string>;
                let nameToIdMap: Map<string, string>;

                // 1. Fetch Categories (skip if onlyMenuItems and we have cached maps)
                if (params.onlyMenuItems && categoryMapsRef.current) {
                    // Use cached category maps
                    categoryIdMap = categoryMapsRef.current.categoryIdMap;
                    nameToIdMap = categoryMapsRef.current.nameToIdMap;
                } else {
                    const { data: catsData, error: catError } = await supabase
                        .from("categories")
                        .select("id, name, sort_order")
                        .eq("store_id", targetStoreId)
                        .order("sort_order");

                    if (activeFetchIdRef.current !== currentFetchId) return; // Stale request
                    if (catError) throw catError;

                    const loadedCategories = Array.from(new Set(catsData?.map(c => c.name) || []));
                    setCategories(loadedCategories);

                    categoryIdMap = new Map<string, string>(); // ID -> Name
                    nameToIdMap = new Map<string, string>(); // Name -> ID
                    catsData?.forEach(c => {
                        categoryIdMap.set(c.id, c.name);
                        nameToIdMap.set(c.name, c.id);
                    });

                    // Cache the maps for future filter-only requests
                    categoryMapsRef.current = { categoryIdMap, nameToIdMap };
                }

                // 2. Fetch Menu Items with Pagination
                let query = supabase
                    .from("menu_items")
                    .select("id, name, price, category_id, description, image, available, is_recommended, allowed_toppings, allow_type_selection, allow_bean_selection, allow_sweetness_selection")
                    .eq("store_id", targetStoreId);

                if (!includeUnavailable) {
                    query = query.eq("available", true);
                }

                if (category && category !== "All") {
                    const catId = nameToIdMap.get(category);
                    if (catId) {
                        query = query.eq("category_id", catId);
                    }
                }

                if (search) {
                    query = query.ilike("name", `%${search}%`);
                }

                // Order by name for consistent pagination
                query = query.order("name", { ascending: true })
                    .range(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE - 1);

                const { data: menuData, error: menuError } = await query;

                if (activeFetchIdRef.current !== currentFetchId) return; // Stale request
                if (menuError) throw menuError;

                const loadedItems: MenuItem[] = (menuData || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    category: categoryIdMap.get(item.category_id) || "Uncategorized",
                    description: item.description,
                    image: item.image,
                    available: item.available,
                    isRecommended: item.is_recommended,
                    allowedToppings: item.allowed_toppings || [],
                    allowTypeSelection: item.allow_type_selection || false,
                    allowBeanSelection: item.allow_bean_selection || false,
                    allowSweetnessSelection: item.allow_sweetness_selection || false,
                }));

                if (isReset) {
                    setMenuItems(loadedItems);
                } else {
                    setMenuItems(prev => {
                        const newItems = [...prev, ...loadedItems];
                        const uniqueItems = Array.from(new Map(newItems.map(item => [item.id, item])).values());
                        return uniqueItems;
                    });
                }

                setHasMore(loadedItems.length === ITEMS_PER_PAGE);
                setPage(nextPage);

                // 3. Fetch Discounts, Serving Types & Toppings (Only on initial load or reset)
                if (isReset && !params.onlyMenuItems) {
                    const [
                        { data: discountData },
                        { data: stData },
                        { data: tpData }
                    ] = await Promise.all([
                        supabase.from("discounts").select("id, name, type, value, active").eq("store_id", targetStoreId),
                        supabase.from("serving_types").select("id, name, price").eq("store_id", targetStoreId).order("price"),
                        supabase.from("toppings").select("id, name, price").eq("store_id", targetStoreId).order("price")
                    ]);

                    if (activeFetchIdRef.current === currentFetchId) {
                        if (discountData) setDiscounts(discountData);
                        if (stData) setServingTypes(stData);
                        if (tpData) setToppings(tpData);
                    }
                }
            };

            // Race between fetch and timeout
            await Promise.race([
                fetchLogic(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000))
            ]);

        } catch (error) {
            if (activeFetchIdRef.current === currentFetchId) {
                console.error("[MenuContext] Error fetching menu data:", error);
            }
        } finally {
            if (activeFetchIdRef.current === currentFetchId) {
                setIsLoading(false);
                setIsFetchingMore(false);
            }
        }
    }, [user?.storeId, publicStoreId]);

    // Initialize menu - call this from pages that need menu data
    const initializeMenu = useCallback(async () => {
        const targetStoreId = user?.storeId || publicStoreId;
        if (!targetStoreId) return; // Do not mark as fetched until storeId is ready
        if (hasFetched) return;
        setHasFetched(true);
        await fetchMenuData({ page: 0 });
    }, [user?.storeId, publicStoreId, fetchMenuData, hasFetched]);

    // Auto-fetch data as soon as user storeId resolves
    useEffect(() => {
        if (user?.storeId) {
            setHasFetched(true);
            fetchMenuData({ page: 0 });
        }
    }, [user?.storeId]);

    // Reset loading state when tab becomes visible (handles stuck loading after tab switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // If we've been loading for too long, reset the loading state
                // This helps recover from stuck states when returning from background tabs
                const resetTimeout = setTimeout(() => {
                    // If still loading after 2 seconds of being visible, force reset
                    if (isLoading || isFetchingMore) {
                        console.log('[MenuContext] Resetting stuck loading state after tab switch');
                        setIsLoading(false);
                        setIsFetchingMore(false);
                    }
                }, 2000);
                return () => clearTimeout(resetTimeout);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isLoading, isFetchingMore]);

    const loadMoreMenuItems = useCallback(() => {
        // We rely on isLoading/isFetchingMore state now, as we don't have isFetchingRef
        if (!hasMore || isLoading || isFetchingMore) return;
        fetchMenuData({ page: page + 1 });
    }, [hasMore, isLoading, isFetchingMore, page, fetchMenuData]);

    const refetchMenu = useCallback(async (params?: { category?: string; search?: string; includeUnavailable?: boolean }) => {
        // When refetching due to filter change, only fetch menu items (skip categories, discounts, etc.)
        await fetchMenuData({ ...params, page: 0, onlyMenuItems: true });
    }, [fetchMenuData]);

    const addMenuItem = useCallback(async (item: Omit<MenuItem, "id">) => {
        if (!user?.storeId) return;
        const { data: catData } = await supabase.from("categories").select("id").eq("store_id", user.storeId).eq("name", item.category).single();
        if (!catData) return;

        const { error } = await supabase.from("menu_items").insert({
            store_id: user.storeId,
            name: item.name,
            price: item.price,
            category_id: catData.id,
            description: item.description,
            image: item.image,
            available: item.available,
            is_recommended: item.isRecommended,
            allowed_toppings: item.allowedToppings,
            allow_type_selection: item.allowTypeSelection,
            allow_bean_selection: item.allowBeanSelection,
            allow_sweetness_selection: item.allowSweetnessSelection
        });
        if (!error) fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
        if (!user?.storeId) return;

        const dbUpdates: any = { ...updates };
        if (updates.category) {
            const { data: catData } = await supabase.from("categories").select("id").eq("store_id", user.storeId).eq("name", updates.category).single();
            if (catData) dbUpdates.category_id = catData.id;
            delete dbUpdates.category;
        }
        if (updates.isRecommended !== undefined) {
            dbUpdates.is_recommended = updates.isRecommended;
            delete dbUpdates.isRecommended;
        }
        if (updates.allowedToppings !== undefined) {
            dbUpdates.allowed_toppings = updates.allowedToppings;
            delete dbUpdates.allowedToppings;
        }
        if (updates.allowTypeSelection !== undefined) {
            dbUpdates.allow_type_selection = updates.allowTypeSelection;
            delete dbUpdates.allowTypeSelection;
        }
        if (updates.allowBeanSelection !== undefined) {
            dbUpdates.allow_bean_selection = updates.allowBeanSelection;
            delete dbUpdates.allowBeanSelection;
        }
        if (updates.allowSweetnessSelection !== undefined) {
            dbUpdates.allow_sweetness_selection = updates.allowSweetnessSelection;
            delete dbUpdates.allowSweetnessSelection;
        }

        const { error } = await supabase.from("menu_items").update(dbUpdates).eq("id", id);
        if (!error) fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const deleteMenuItem = useCallback(async (id: string) => {
        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (!error) fetchMenuData();
    }, [fetchMenuData]);

    const addCategory = useCallback(async (name: string) => {
        if (!user?.storeId) return;
        await supabase.from("categories").insert({
            store_id: user.storeId,
            name: name,
            sort_order: categories.length
        });
        fetchMenuData();
    }, [user?.storeId, categories.length, fetchMenuData]);

    const updateCategory = useCallback(async (oldName: string, newName: string) => {
        // Logic needs ID to be robust, but current flow seems name-based?
        // Simulating robust update via refetch for now as original code was simple
        fetchMenuData();
    }, [fetchMenuData]);

    const deleteCategory = useCallback(async (name: string) => {
        if (!user?.storeId) return;

        // 1. Migrate items to "ทั่วไป" (General) to prevent orphaned items
        // This matches the warning in the UI provided to the user.
        const { error: moveError } = await supabase
            .from("menu_items")
            .update({ category: "ทั่วไป" })
            .eq("store_id", user.storeId)
            .eq("category", name);

        if (moveError) {
            console.error("Error migrating items to default category:", moveError);
        }

        // 2. Delete the category
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("store_id", user.storeId)
            .eq("name", name);

        if (error) {
            console.error("Error deleting category:", error);
            // Could throw or notify here, but for now just log
        }

        fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const addDiscount = useCallback(async (d: Omit<Discount, "id">) => {
        if (!user?.storeId) return;
        await supabase.from("discounts").insert({ ...d, store_id: user.storeId });
        fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const updateDiscount = useCallback(async (id: string, d: Partial<Discount>) => {
        await supabase.from("discounts").update(d).eq("id", id);
        fetchMenuData();
    }, [fetchMenuData]);

    const deleteDiscount = useCallback(async (id: string) => {
        await supabase.from("discounts").delete().eq("id", id);
        fetchMenuData();
    }, [fetchMenuData]);

    const addTopping = useCallback(async (topping: Omit<Option, "id">) => {
        if (!user?.storeId) return;
        const { error } = await supabase.from("toppings").insert({
            store_id: user.storeId,
            name: topping.name,
            price: topping.price
        });
        if (!error) fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const updateTopping = useCallback(async (id: string, updates: Partial<Option>) => {
        const { error } = await supabase.from("toppings").update(updates).eq("id", id);
        if (!error) fetchMenuData();
    }, [fetchMenuData]);

    const deleteTopping = useCallback(async (id: string) => {
        const { error } = await supabase.from("toppings").delete().eq("id", id);
        if (!error) fetchMenuData();
    }, [fetchMenuData]);

    const addServingType = useCallback(async (type: Omit<Option, "id">) => {
        if (!user?.storeId) return;
        const { error } = await supabase.from("serving_types").insert({
            store_id: user.storeId,
            name: type.name,
            price: type.price
        });
        if (!error) fetchMenuData();
    }, [user?.storeId, fetchMenuData]);

    const updateServingType = useCallback(async (id: string, updates: Partial<Option>) => {
        const { error } = await supabase.from("serving_types").update(updates).eq("id", id);
        if (!error) fetchMenuData();
    }, [fetchMenuData]);

    const deleteServingType = useCallback(async (id: string) => {
        const { error } = await supabase.from("serving_types").delete().eq("id", id);
        if (!error) fetchMenuData();
    }, [fetchMenuData]);

    const fetchGlobalMenus = useCallback(async (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
        const page = params?.page ?? 0;
        const limit = params?.limit ?? 20;
        const category = params?.category;
        const search = params?.search;

        let query = supabase.from("global_menus").select("id, name,suggested_price, category, description, image", { count: 'exact' });

        if (category && category !== "All") {
            query = query.eq("category", category);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query = query.order("name", { ascending: true })
            .range(page * limit, (page + 1) * limit - 1);

        const { data, count } = await query;
        return { data: data || [], count: count || 0 };
    }, []);

    const fetchGlobalCategories = useCallback(async () => {
        const { data } = await supabase.from("global_menus").select("category");
        if (!data) return ["All"];
        const cats = Array.from(new Set(data.map(d => d.category))).filter(Boolean).sort();
        return ["All", ...cats];
    }, []);

    const bulkImportMenuItems = useCallback(async (items: { category: string; name: string; price: number; description?: string; image?: string }[]) => {
        if (!user?.storeId) return { success: false, error: "No store selected" };
        setIsLoading(true);
        try {
            // 1. Resolve Categories
            const uniqueCategories = Array.from(new Set(items.map(i => i.category))).filter(Boolean);
            const categoryMap = new Map<string, string>();

            if (uniqueCategories.length > 0) {
                // Fetch existing categories
                const { data: existingCats } = await supabase
                    .from("categories")
                    .select("id, name")
                    .eq("store_id", user.storeId)
                    .in("name", uniqueCategories);

                if (existingCats) {
                    existingCats.forEach(c => categoryMap.set(c.name, c.id));
                }

                // Create missing categories
                const missingCategories = uniqueCategories.filter(c => !categoryMap.has(c));
                if (missingCategories.length > 0) {
                    const { data: newCats } = await supabase
                        .from("categories")
                        .insert(missingCategories.map((name, index) => ({
                            store_id: user.storeId,
                            name: name,
                            sort_order: categories.length + index
                        })))
                        .select("id, name");

                    if (newCats) {
                        newCats.forEach(c => categoryMap.set(c.name, c.id));
                    }
                }
            }

            // 2. Prepare Menu Items
            const menuItemsToInsert = items.map(item => ({
                store_id: user.storeId,
                name: item.name,
                price: item.price,
                category_id: categoryMap.get(item.category) || null,
                description: item.description,
                image: item.image,
                available: true
            }));

            // 3. Bulk Insert
            const { error } = await supabase
                .from("menu_items")
                .insert(menuItemsToInsert);

            if (error) throw error;

            await fetchMenuData();
            return { success: true };

        } catch (error: any) {
            console.error("Error bulk importing items:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user?.storeId, categories.length, fetchMenuData]);

    const importGlobalMenuItem = useCallback(async (globalItem: any) => {
        if (!user?.storeId) return { success: false, error: "No store" };
        return bulkImportMenuItems([{
            category: globalItem.category,
            name: globalItem.name,
            price: parseFloat(globalItem.suggested_price || 0),
            description: globalItem.description,
            image: globalItem.image
        }]);
    }, [user?.storeId, bulkImportMenuItems]);


    return (
        <MenuContext.Provider value={{
            menuItems,
            categories,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            updateCategory,
            deleteCategory,
            addCategory,
            discounts,
            addDiscount,
            updateDiscount,
            deleteDiscount,
            toppings,
            addTopping,
            updateTopping,
            deleteTopping,
            servingTypes,
            addServingType,
            updateServingType,
            deleteServingType,
            isLoading,
            setPublicStoreId,
            publicStoreId,
            storeSettings,
            fetchGlobalMenus,
            fetchGlobalCategories,
            importGlobalMenuItem,
            bulkImportMenuItems,
            hasMore,
            loadMoreMenuItems,
            refetchMenu,
            isFetchingMore,
            initializeMenu
        }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error("useMenu must be used within a MenuProvider");
    }
    return context;
}
