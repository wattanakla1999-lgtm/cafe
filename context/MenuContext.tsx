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
    importGlobalMenuItem: (globalItem: any) => Promise<{ success: boolean; error?: string }>;
    bulkImportMenuItems: (items: { category: string; name: string; price: number; description?: string; image?: string }[]) => Promise<{ success: boolean; error?: string }>;
    // Pagination & Filtering
    loadMoreMenuItems: () => void;
    hasMore: boolean;
    refetchMenu: (params?: { category?: string; search?: string; includeUnavailable?: boolean }) => Promise<void>;
    isFetchingMore: boolean;
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
    const [currentFilters, setCurrentFilters] = useState({ category: "All", search: "", includeUnavailable: false });
    const ITEMS_PER_PAGE = 20;

    const fetchMenuData = useCallback(async (params: { page?: number; category?: string; search?: string; includeUnavailable?: boolean } = {}) => {
        const targetStoreId = user?.storeId || publicStoreId;
        if (!targetStoreId) {
            if (isLoading) setIsLoading(false);
            return;
        }

        // Determine effective params
        const nextPage = params.page ?? 0;
        const category = params.category ?? currentFilters.category;
        const search = params.search ?? currentFilters.search;
        const includeUnavailable = params.includeUnavailable ?? currentFilters.includeUnavailable;

        const isReset = nextPage === 0;

        // Don't set loading true for "load more" to avoid full screen spinner, maybe use a specialized state
        // But for safe reuse of existing isLoading UI:
        // But for safe reuse of existing isLoading UI:
        if (isReset) {
            setIsLoading(true);
        } else {
            setIsFetchingMore(true);
        }

        try {
            // 1. Fetch Categories (Always fetch all for tabs, maybe optimize later)
            // Only fetch if initial load or forced, but for now safe to fetch
            const { data: catsData, error: catError } = await supabase
                .from("categories")
                .select("id, name, sort_order")
                .eq("store_id", targetStoreId)
                .order("sort_order");

            if (catError) throw catError;

            const loadedCategories = Array.from(new Set(catsData?.map(c => c.name) || []));
            setCategories(loadedCategories);

            const categoryIdMap = new Map<string, string>(); // ID -> Name
            const nameToIdMap = new Map<string, string>(); // Name -> ID
            catsData?.forEach(c => {
                categoryIdMap.set(c.id, c.name);
                nameToIdMap.set(c.name, c.id);
            });

            // 2. Fetch Menu Items with Pagination
            let query = supabase
                .from("menu_items")
                .select("*")
                .eq("store_id", targetStoreId);

            if (!includeUnavailable) {
                query = query.eq("available", true);
            }

            if (category && category !== "All") {
                const catId = nameToIdMap.get(category);
                if (catId) {
                    query = query.eq("category_id", catId);
                } else {
                    // Category exists in UI but maybe not in map yet or special case?
                    // If name mismatch, query might return empty.
                }
            }

            if (search) {
                query = query.ilike("name", `%${search}%`);
            }

            // Order by name for consistent pagination
            query = query.order("name", { ascending: true })
                .range(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE - 1);

            const { data: menuData, error: menuError } = await query;

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
                allowedToppings: [],
                allowTypeSelection: false,
                allowBeanSelection: false,
                allowSweetnessSelection: false,
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
            if (isReset) {
                setCurrentFilters({ category, search, includeUnavailable });
            }

            // 3. Fetch Discounts (Only on initial load usually, but cheap)
            if (isReset) {
                const { data: discountData } = await supabase
                    .from("discounts")
                    .select("*")
                    .eq("store_id", targetStoreId);
                if (discountData) setDiscounts(discountData);
            }

        } catch (error) {
            console.error("Error fetching menu data:", error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [user?.storeId, publicStoreId, currentFilters]);

    // Initial load
    useEffect(() => {
        // Prevent double fetch if strict mode or other triggers
        // But we need initial data.
        fetchMenuData({ page: 0 });
    }, [user?.storeId, publicStoreId]); // Only when ID changes

    const loadMoreMenuItems = () => {
        if (!hasMore || isLoading || isFetchingMore) return;
        fetchMenuData({ page: page + 1 });
    };

    const refetchMenu = async (params?: { category?: string; search?: string; includeUnavailable?: boolean }) => {
        await fetchMenuData({ ...params, page: 0 });
    };

    const addMenuItem = async (item: Omit<MenuItem, "id">) => {
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
            is_recommended: item.isRecommended
        });
        if (!error) fetchMenuData();
    };

    const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
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

        const { error } = await supabase.from("menu_items").update(dbUpdates).eq("id", id);
        if (!error) fetchMenuData();
    };

    const deleteMenuItem = async (id: string) => {
        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (!error) fetchMenuData();
    };

    const addCategory = async (name: string) => {
        if (!user?.storeId) return;
        await supabase.from("categories").insert({
            store_id: user.storeId,
            name: name,
            sort_order: categories.length
        });
        fetchMenuData();
    };

    const updateCategory = async (oldName: string, newName: string) => {
        fetchMenuData();
    };

    const deleteCategory = async (name: string) => {
        fetchMenuData();
    };

    const addDiscount = async (d: Omit<Discount, "id">) => {
        if (!user?.storeId) return;
        await supabase.from("discounts").insert({ ...d, store_id: user.storeId });
        fetchMenuData();
    };
    const updateDiscount = async (id: string, d: Partial<Discount>) => {
        await supabase.from("discounts").update(d).eq("id", id);
        fetchMenuData();
    };
    const deleteDiscount = async (id: string) => {
        await supabase.from("discounts").delete().eq("id", id);
        fetchMenuData();
    };

    const addTopping = async () => { };
    const updateTopping = async () => { };
    const deleteTopping = async () => { };
    const addServingType = async () => { };
    const updateServingType = async () => { };
    const deleteServingType = async () => { };

    const fetchGlobalMenus = async (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
        const page = params?.page ?? 0;
        const limit = params?.limit ?? 20;
        const category = params?.category;
        const search = params?.search;

        let query = supabase.from("global_menus").select("*", { count: 'exact' });

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
    };

    const importGlobalMenuItem = async (globalItem: any) => {
        if (!user?.storeId) return { success: false, error: "No store" };
        return bulkImportMenuItems([{
            category: globalItem.category,
            name: globalItem.name,
            price: parseFloat(globalItem.suggested_price || 0),
            description: globalItem.description,
            image: globalItem.image
        }]);
    };

    const bulkImportMenuItems = async (items: { category: string; name: string; price: number; description?: string; image?: string }[]) => {
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
    };

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
            importGlobalMenuItem,
            bulkImportMenuItems,
            hasMore,
            loadMoreMenuItems,
            refetchMenu,
            isFetchingMore
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
