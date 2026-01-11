import React, { useEffect, useState } from 'react';

type AlertVariant = 'filled' | 'outlined';
type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

interface AlertProps {
    variant?: AlertVariant;
    severity?: AlertSeverity;
    message: string;
    description?: string;
    onClose?: () => void;
    onClick?: () => void;
    autoCloseDuration?: number; // ms
}

const severityConfig = {
    success: {
        bgColor: 'bg-green-600',
        textColor: 'text-white',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )
    },
    info: {
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    warning: {
        bgColor: 'bg-orange-500',
        textColor: 'text-white',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        )
    },
    error: {
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    }
};

export function Alert({ variant = 'filled', severity = 'info', message, description, onClose, onClick, autoCloseDuration }: AlertProps) {
    const config = severityConfig[severity];
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (autoCloseDuration) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) setTimeout(onClose, 300); // Wait for animation
            }, autoCloseDuration);
            return () => clearTimeout(timer);
        }
    }, [autoCloseDuration, onClose]);

    if (!visible) return null;

    return (
        <div className={`fixed top-6 right-6 z-[9999] transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}`}>
            <div
                onClick={onClick}
                className={`flex items-center p-6 rounded-xl shadow-2xl ${config.bgColor} ${config.textColor} max-w-lg w-full border-2 border-white/20 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            >
                <div className="flex-shrink-0 mr-4">
                    {config.icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold leading-tight">{message}</h3>
                    {description && <div className="mt-1 text-lg opacity-95 leading-snug">{description}</div>}
                </div>
                {onClose && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering onClick of the card
                            setVisible(false);
                            if (onClose) onClose();
                        }}
                        className="ml-4 text-white/70 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
