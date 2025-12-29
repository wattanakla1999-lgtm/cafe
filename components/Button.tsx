import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

export function Button({
    children,
    className = "",
    variant = "primary",
    size = "md",
    fullWidth = false,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
        primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-coffee-700)] focus:ring-[var(--color-coffee-400)] border border-transparent",
        secondary: "bg-[var(--color-secondary)] text-[var(--color-coffee-900)] hover:bg-[var(--color-coffee-200)] focus:ring-[var(--color-coffee-300)] border border-transparent",
        outline: "border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)] focus:ring-[var(--color-coffee-300)] bg-transparent",
        ghost: "bg-transparent text-[var(--color-coffee-700)] hover:bg-[var(--color-coffee-50)]",
    };

    const sizes = {
        sm: "h-8 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-14 px-6 text-lg",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
