export type Category = string;

export interface Option {
    id: string;
    name: string;
    price: number;
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: Category;
    description?: string;
    image?: string; // Placeholder for now
    available: boolean;
    allowedToppings?: string[]; // IDs of allowed toppings
    allowTypeSelection?: boolean; // Hot/Iced/Frappe
    allowBeanSelection?: boolean; // Dark/Medium/Light Roast
    allowSweetnessSelection?: boolean; // 0%/25%/50%/100%
    isRecommended?: boolean; // Admin-configurable recommended item
}

export const MENU_ITEMS: MenuItem[] = [
    // Coffee
    { id: "c1", name: "Iced Americano", price: 60, category: "Coffee", description: "Rich espresso with cold water", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "c2", name: "Iced Latte", price: 70, category: "Coffee", description: "Espresso with fresh milk", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "c3", name: "Cappuccino", price: 70, category: "Coffee", description: "Espresso with foamed milk", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "c4", name: "Mocha", price: 75, category: "Coffee", description: "Espresso with chocolate and milk", image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "c5", name: "Caramel Macchiato", price: 80, category: "Coffee", description: "Vanilla, milk, espresso and caramel", image: "https://images.unsplash.com/photo-1485808191679-5f8c7c8606f8?auto=format&fit=crop&w=500&q=60", available: true },

    // Non-Coffee
    { id: "n1", name: "Thai Tea", price: 60, category: "Non-Coffee", description: "Authentic Thai tea", image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "n2", name: "Green Tea Latte", price: 65, category: "Non-Coffee", description: "Premium Matcha", image: "https://images.unsplash.com/photo-1515823064-db61f6a2e6d7?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "n3", name: "Cocoa", price: 60, category: "Non-Coffee", description: "Rich cocoa", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=60", available: true },

    // Soda
    { id: "s1", name: "Red Soda Lime", price: 50, category: "Soda", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60", available: true },
    { id: "s2", name: "Honey Lemon Soda", price: 55, category: "Soda", image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=500&q=60", available: true },
];

export const SWEETNESS_LEVELS: Option[] = [
    { id: "sw0", name: "0% (ไม่หวาน)", price: 0 },
    { id: "sw25", name: "25% (หวานน้อย)", price: 0 },
    { id: "sw50", name: "50% (หวานปกติ)", price: 0 },
    { id: "sw100", name: "100% (หวานมาก)", price: 0 },
];

export const SERVING_TYPES: Option[] = [
    { id: "hot", name: "ร้อน", price: 0 },
    { id: "iced", name: "เย็น", price: 5 },
    { id: "frappe", name: "ปั่น", price: 10 },
];

export const COFFEE_BEANS: Option[] = [
    { id: "dark", name: "คั่วเข้ม", price: 0 },
    { id: "medium", name: "คั่วกลาง", price: 0 },
    { id: "light", name: "คั่วอ่อน", price: 0 },
];



export const TOPPINGS: Option[] = [
    { id: "t1", name: "Extra Shot", price: 15 },
    { id: "t2", name: "Whipped Cream", price: 15 },
];
