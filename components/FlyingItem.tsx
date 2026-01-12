"use client";

import React, { useEffect, useState } from "react";

interface FlyingItemProps {
    src: string;
    startRect: DOMRect;
    targetRect: DOMRect;
    onComplete: () => void;
}

export function FlyingItem({ src, startRect, targetRect, onComplete }: FlyingItemProps) {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: "fixed",
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        borderRadius: "0.5rem", // rounded-lg
        zIndex: 9999,
        transition: "all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
        pointerEvents: "none",
        opacity: 1
    });

    useEffect(() => {
        // Trigger animation after mount
        requestAnimationFrame(() => {
            setStyle(prev => ({
                ...prev,
                top: targetRect.top + (targetRect.height / 2) - 20, // Center to target
                left: targetRect.left + (targetRect.width / 2) - 20,
                width: 40, // Shrink size
                height: 40,
                opacity: 0.5,
                borderRadius: "50%"
            }));
        });

        // Cleanup after animation
        const timer = setTimeout(onComplete, 800);
        return () => clearTimeout(timer);
    }, [targetRect, onComplete]);

    return <div style={style} />;
}
