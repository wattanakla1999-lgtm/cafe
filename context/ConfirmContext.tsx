"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning";
    inputConfig?: {
        placeholder?: string;
        required?: boolean;
    };
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    prompt: (options: ConfirmOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        message: ""
    });
    // For confirm: resolve boolean
    // For prompt: resolve string | null
    const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);

        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const prompt = useCallback((opts: ConfirmOptions): Promise<string | null> => {
        setOptions({ ...opts }); // inputConfig is passed here
        setIsOpen(true);

        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback((inputValue?: string) => {
        if (resolvePromise) {
            // Check if we were expecting output (prompt mode usually implies inputConfig presence or caller context)
            // But here we rely on what the promise expects. 
            // Since we use 'any' for the resolver setter, we can pass generic value.
            // If it was a confirm() call, it expects boolean true.
            // If it was a prompt() call, it expects the string.

            // To differentiate, we could check inputConfig existence in options state.
            if (options.inputConfig) {
                resolvePromise(inputValue || "");
            } else {
                resolvePromise(true);
            }
        }
        setIsOpen(false);
        setResolvePromise(null);
    }, [resolvePromise, options]);

    const handleCancel = useCallback(() => {
        if (resolvePromise) {
            if (options.inputConfig) {
                resolvePromise(null);
            } else {
                resolvePromise(false);
            }
        }
        setIsOpen(false);
        setResolvePromise(null);
    }, [resolvePromise, options]);

    return (
        <ConfirmContext.Provider value={{ confirm, prompt }}>
            {children}
            <ConfirmDialog
                isOpen={isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={options.title}
                message={options.message}
                confirmText={options.confirmText}
                cancelText={options.cancelText}
                variant={options.variant}
                inputConfig={options.inputConfig}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return { confirm: context.confirm, prompt: context.prompt };
}
