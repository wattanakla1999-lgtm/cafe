import React, { useState, useRef, useEffect } from "react";

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    label?: string;
    required?: boolean;
    className?: string;
}

export function Combobox({
    value,
    onChange,
    options,
    placeholder = "Select or type...",
    label,
    required = false,
    className = ""
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync internal search state with external value prop
    useEffect(() => {
        setSearch(value);
    }, [value]);

    // Handle clicking outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // On close, ensure value matches what was typed if it's strictly free solo, 
                // but we are already updating on change, so this is fine.
                // If we wanted to revert to last valid value on blur if invalid, we'd do it here.
                // For "add new category" logic, keeping text is correct.
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(search.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearch(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelectOption = (option: string) => {
        setSearch(option);
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-bold text-[var(--color-coffee-700)] mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full p-2.5 pr-10 border border-[var(--color-coffee-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all shadow-sm"
                    required={required}
                />

                {/* Chevron / Toggle Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-0 top-0 bottom-0 px-3 text-[var(--color-coffee-400)] hover:text-[var(--color-primary)] transition-colors cursor-pointer flex items-center justify-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-coffee-100)] rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleSelectOption(option)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-coffee-50)] transition-colors flex items-center justify-between group ${option === value ? "bg-[var(--color-coffee-50)] font-bold text-[var(--color-primary)]" : "text-[var(--color-coffee-700)]"}`}
                            >
                                <span>{option}</span>
                                {option === value && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-[var(--color-coffee-400)] italic text-center">
                            Press Enter to add "{search}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
