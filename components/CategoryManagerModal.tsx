import React, { useState } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
    const { menuItems, categories, updateCategory, deleteCategory, addCategory } = useMenu();
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [newCategory, setNewCategory] = useState("");

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            addCategory(newCategory.trim());
            setNewCategory("");
        }
    };

    const handleStartEdit = (cat: string) => {
        setEditingCategory(cat);
        setEditValue(cat);
    };

    const handleSaveEdit = () => {
        if (editingCategory && editValue.trim() && editValue !== editingCategory) {
            updateCategory(editingCategory, editValue.trim());
        }
        setEditingCategory(null);
    };

    const handleDelete = (cat: string) => {
        const count = menuItems.filter(i => i.category === cat).length;
        if (confirm(`Are you sure? This will move ${count} items to "Uncategorized".`)) {
            deleteCategory(cat);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                <div className="p-6 border-b border-[var(--color-coffee-100)] flex justify-between items-center bg-[var(--color-coffee-50)]">
                    <h2 className="text-xl font-bold text-[var(--color-coffee-900)]">
                        Manage Categories
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-coffee-100)] rounded-full text-[var(--color-coffee-500)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Add New Category */}
                    <div className="flex gap-2 mb-6">
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New Category Name..."
                            className="flex-1 p-2.5 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                        />
                        <Button onClick={handleAddCategory}>Add</Button>
                    </div>

                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-coffee-100)]">
                                {editingCategory === cat ? (
                                    <div className="flex flex-1 gap-2">
                                        <input
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="flex-1 p-2 text-sm border border-[var(--color-coffee-300)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-[var(--color-coffee-800)]">{cat}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStartEdit(cat)}
                                                className="p-2 text-[var(--color-coffee-500)] hover:text-[var(--color-primary)] hover:bg-[var(--color-coffee-100)] rounded-full transition-colors"
                                                title="Rename"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                className="p-2 text-[var(--color-coffee-500)] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete (Uncategorize items)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm flex gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p>
                            To <strong>add a new category</strong>, simply type it into the "Category" field when adding or editing a menu item. It will appear here automatically.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--color-coffee-100)] bg-gray-50 flex justify-end">
                    <Button onClick={onClose} variant="ghost">Close</Button>
                </div>
            </div>
        </div>
    );
}
