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
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [toppings, setToppings] = useState<Option[]>([]);
    const [servingTypes, setServingTypes] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

    const fetchMenuData = useCallback(async () => {
        // Wait for auth to settle to avoid unnecessary public fallback fetches
        if (authLoading) return;

        setIsLoading(true);
        try {
            // Prioritize: 1. Auth User Store, 2. Public Store ID (from URL), 3. Fallback (First Store)
            let targetStoreId = user?.storeId || publicStoreId;

            // If no user/store and no public ID, try to find a public store (e.g., the first one)
            // Note: This fallback might be why users see "wrong" store if they visit /menu directly.
            if (!targetStoreId) {
                const { data: storeData } = await supabase
                    .from("stores")
                    .select("id")
                    .limit(1)
                    .single();

                if (storeData) {
                    targetStoreId = storeData.id;
                }
            }

            if (!targetStoreId) {
                // If still no store, we can't load anything
                setIsLoading(false);
                return;
            }

            // Parallel Data Fetching
            const [categoriesRes, toppingsRes, menuRes, servingTypesRes, discountsRes] = await Promise.all([
                // 1. Categories
                supabase
                    .from("categories")
                    .select("name")
                    .eq("store_id", targetStoreId)
                    .order("sort_order", { ascending: true }),

                // 2. Toppings
                supabase
                    .from("toppings")
                    .select("id, name, price")
                    .eq("store_id", targetStoreId),

                // 3. Menu Items
                supabase
                    .from("menu_items")
                    .select(`
                        id, name, price, description, image, available, allowed_toppings, allow_type_selection, allow_bean_selection, allow_sweetness_selection,
                        category:categories(name)
                    `)
                    .eq("store_id", targetStoreId),

                // 4. Serving Types
                supabase
                    .from("serving_types")
                    .select("id, name, price")
                    .eq("store_id", targetStoreId)
                    .order("price", { ascending: true }),

                // 5. Discounts
                supabase
                    .from("discounts")
                    .select("id, name, value, type, active")
                    .eq("store_id", targetStoreId)
            ]);

            // Process Results
            if (categoriesRes.data) {
                setCategories(categoriesRes.data.map(c => c.name));
            }

            if (toppingsRes.data) {
                setToppings(toppingsRes.data);
            }

            if (servingTypesRes.data) {
                setServingTypes(servingTypesRes.data);
            }

            if (discountsRes.data) {
                setDiscounts(discountsRes.data);
            }

            if (menuRes.data) {
                const mappedItems: MenuItem[] = menuRes.data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    category: item.category?.name || "Uncategorized",
                    description: item.description,
                    image: item.image,
                    available: item.available,
                    allowedToppings: item.allowed_toppings,
                    allowTypeSelection: item.allow_type_selection,
                    allowBeanSelection: item.allow_bean_selection,
                    allowSweetnessSelection: item.allow_sweetness_selection
                }));
                setMenuItems(mappedItems);
            }

        } catch (error) {
            console.error("Error fetching menu data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.storeId, authLoading, publicStoreId]);

    useEffect(() => {
        fetchMenuData();
    }, [fetchMenuData]);

    // --- Discounts ---
    const addDiscount = async (discount: Omit<Discount, "id">) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("discounts").insert([{
                store_id: user.storeId,
                name: discount.name,
                value: discount.value,
                type: discount.type,
                active: discount.active
            }]);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const updateDiscount = async (id: string, updates: Partial<Discount>) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("discounts").update(updates).eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDiscount = async (id: string) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("discounts").delete().eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    // --- Toppings ---
    const addTopping = async (topping: Omit<Option, "id">) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("toppings").insert([{
                store_id: user.storeId,
                name: topping.name,
                price: topping.price
            }]);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const updateTopping = async (id: string, updates: Partial<Option>) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("toppings").update(updates).eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteTopping = async (id: string) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("toppings").delete().eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    // --- Serving Types ---
    const addServingType = async (type: Omit<Option, "id">) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("serving_types").insert([{
                store_id: user.storeId,
                name: type.name,
                price: type.price
            }]);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const updateServingType = async (id: string, updates: Partial<Option>) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("serving_types").update(updates).eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteServingType = async (id: string) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            await supabase.from("serving_types").delete().eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    // --- Categories ---
    const addCategory = async (categoryName: string) => {
        if (!user?.storeId) return;
        // Check duplicate locally first to save request
        if (categories.includes(categoryName)) return;

        setIsLoading(true);
        try {
            await supabase.from("categories").insert([{
                store_id: user.storeId,
                name: categoryName,
                sort_order: categories.length // simple append order
            }]);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const updateCategory = async (oldName: string, newName: string) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            // Find ID of category (optimization: should probably store category IDs in state map)
            // For now, update by name query or simple fetch logic
            // But table structure uses ID. We need to find ID first.
            // Let's rely on name for now if unique, but SQL expects ID usually.
            // Actually RLS protects it.

            // Simple approach: get ID by name
            const { data } = await supabase.from("categories")
                .select("id")
                .eq("store_id", user.storeId)
                .eq("name", oldName)
                .single();

            if (data) {
                await supabase.from("categories").update({ name: newName }).eq("id", data.id);
                await fetchMenuData();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCategory = async (categoryName: string) => {
        if (!user?.storeId) return;
        setIsLoading(true);
        try {
            const { data } = await supabase.from("categories")
                .select("id")
                .eq("store_id", user.storeId)
                .eq("name", categoryName)
                .single();

            if (data) {
                await supabase.from("categories").delete().eq("id", data.id);
                // Items with CASCADE SET NULL will happen in DB, but we want them to stay or be safe?
                // Schema said: references public.categories(id) on delete set null
                // So items become category_id = null.
                // Client side mappedItems will see category: null -> "Uncategorized". Correct.
                await fetchMenuData();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- Menu Items ---
    const addMenuItem = async (item: Omit<MenuItem, "id">) => {
        console.log("addMenuItem called:", item);
        if (!user?.storeId) {
            console.warn("addMenuItem aborted: Missing user or storeId", user);
            return;
        }
        setIsLoading(true);
        try {
            // Ensure category exists, get its ID
            let categoryId = null;
            if (item.category && item.category !== "Uncategorized") {
                // Try convert name to ID
                const { data } = await supabase.from("categories")
                    .select("id")
                    .eq("store_id", user.storeId)
                    .eq("name", item.category)
                    .single();

                if (data) {
                    categoryId = data.id;
                } else {
                    // Determine if we should auto-create category?
                    // Let's assume User UI only allows picking existing, 
                    // but if manual input, we create it.
                    const { data: newCat } = await supabase.from("categories")
                        .insert([{ store_id: user.storeId, name: item.category }])
                        .select("id")
                        .single();
                    if (newCat) categoryId = newCat.id;
                }
            }

            await supabase.from("menu_items").insert([{
                store_id: user.storeId,
                name: item.name,
                price: item.price,
                category_id: categoryId,
                description: item.description,
                image: item.image,
                available: item.available,
                allowed_toppings: item.allowedToppings || [],
                allow_type_selection: item.allowTypeSelection || false,
                allow_bean_selection: item.allowBeanSelection || false,
                allow_sweetness_selection: item.allowSweetnessSelection || false
            }]);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
        console.log("updateMenuItem called:", id, updates);
        if (!user?.storeId) {
            console.warn("updateMenuItem aborted: Missing user or storeId", user);
            return;
        }
        setIsLoading(true);
        try {
            // Prepare DB update object
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.image !== undefined) dbUpdates.image = updates.image;
            if (updates.available !== undefined) dbUpdates.available = updates.available;
            if (updates.allowedToppings !== undefined) dbUpdates.allowed_toppings = updates.allowedToppings;
            if (updates.allowTypeSelection !== undefined) dbUpdates.allow_type_selection = updates.allowTypeSelection;
            if (updates.allowBeanSelection !== undefined) dbUpdates.allow_bean_selection = updates.allowBeanSelection;
            if (updates.allowSweetnessSelection !== undefined) dbUpdates.allow_sweetness_selection = updates.allowSweetnessSelection;

            // Handle category update
            if (updates.category) {
                const { data } = await supabase.from("categories")
                    .select("id")
                    .eq("store_id", user.storeId)
                    .eq("name", updates.category)
                    .single();
                if (data) {
                    dbUpdates.category_id = data.id;
                } else if (updates.category !== "Uncategorized") {
                    // create new
                    const { data: newCat } = await supabase.from("categories")
                        .insert([{ store_id: user.storeId, name: updates.category }])
                        .select("id")
                        .single();
                    if (newCat) dbUpdates.category_id = newCat.id;
                } else {
                    dbUpdates.category_id = null; // Uncategorized
                }
            }

            await supabase.from("menu_items").update(dbUpdates).eq("id", id);
            await fetchMenuData();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteMenuItem = async (id: string) => {
        console.log("deleteMenuItem called:", id);
        if (!user?.storeId) {
            console.warn("deleteMenuItem aborted: Missing user or storeId", user);
            return;
        }
        setIsLoading(true);
        try {
            // 1. Get the item to find its image URL
            const { data: item } = await supabase
                .from("menu_items")
                .select("image")
                .eq("id", id)
                .single();

            // 2. Delete the record
            const { error } = await supabase.from("menu_items").delete().eq("id", id);

            if (error) {
                console.error("Error deleting item:", error);
                throw error;
            }

            // 3. Delete the image from storage if it exists and is hosted by us
            if (item?.image) {
                const imageUrl = item.image;
                console.log("Attempting to delete image:", imageUrl);

                if (imageUrl.includes("menu-images")) {
                    try {
                        // Extract filename: take everything after the last '/'
                        // URL: .../menu-images/filename.ext
                        const fileNameWithParams = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);

                        // Remove query params if any
                        const fileName = fileNameWithParams.split('?')[0];
                        const decodedFileName = decodeURIComponent(fileName);

                        console.log("Attempting to delete file:", decodedFileName);

                        if (decodedFileName) {
                            const { data: removeData, error: storageError } = await supabase.storage
                                .from('menu-images')
                                .remove([decodedFileName]);

                            if (storageError) {
                                console.error("Failed to delete image from storage:", storageError);
                            } else {
                                console.log("Image deleted successfully:", removeData);
                            }
                        }
                    } catch (err) {
                        console.error("Error parsing/deleting image:", err);
                    }
                } else {
                    console.log("Image is not in 'menu-images' bucket, skipping storage delete.");
                }
            }

            await fetchMenuData();
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
            publicStoreId
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
