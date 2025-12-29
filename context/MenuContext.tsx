"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, MENU_ITEMS } from "../data/mock";

interface MenuContextType {
    menuItems: MenuItem[];
    categories: string[];
    addMenuItem: (item: Omit<MenuItem, "id">) => void;
    updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
    deleteMenuItem: (id: string) => void;
    updateCategory: (oldName: string, newName: string) => void;
    deleteCategory: (categoryName: string) => void;
    addCategory: (categoryName: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
    // Initialize categories from mock data, ensuring uniqueness
    const [categories, setCategories] = useState<string[]>(() => {
        const initialCats = new Set(MENU_ITEMS.map(item => item.category));
        // Ensure default mocks are there if not in items for some reason? 
        // Mock data covers it.
        return Array.from(initialCats);
    });

    const addMenuItem = (item: Omit<MenuItem, "id">) => {
        const newItem: MenuItem = {
            ...item,
            id: `m_${Date.now()}`,
        };
        setMenuItems((prev) => [...prev, newItem]);

        // Auto-add category if new
        if (!categories.includes(item.category)) {
            setCategories(prev => [...prev, item.category]);
        }
    };

    const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
        setMenuItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
        // If updating category, should we check/add? 
        // Yes, if category is changed to something new (via text input in modal)
        if (updates.category && !categories.includes(updates.category)) {
            setCategories(prev => [...prev, updates.category!]);
        }
    };

    const deleteMenuItem = (id: string) => {
        setMenuItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateCategory = (oldName: string, newName: string) => {
        // Update list
        setCategories(prev => prev.map(c => c === oldName ? newName : c));
        // Update items
        setMenuItems((prev) =>
            prev.map((item) => (item.category === oldName ? { ...item, category: newName } : item))
        );
    };

    const deleteCategory = (categoryName: string) => {
        // Remove from list
        setCategories(prev => prev.filter(c => c !== categoryName));
        // Uncategorize items
        setMenuItems((prev) =>
            prev.map((item) => (item.category === categoryName ? { ...item, category: "Uncategorized" } : item))
        );
    };

    const addCategory = (categoryName: string) => {
        if (!categories.includes(categoryName)) {
            setCategories(prev => [...prev, categoryName]);
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
            addCategory
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
