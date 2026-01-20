"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../context/TourContext';
import { Button } from './Button';

export function TourHighlight() {
    const { isActive, currentTourStep, nextStep, skipStep, skipTour } = useTour();
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    // Check for mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Prevent scrolling when tour is active
    useEffect(() => {
        if (isActive) {
            const originalOverflowX = document.body.style.overflowX;
            const originalHtmlOverflowX = document.documentElement.style.overflowX;

            // Initial scroll to left 0
            window.scrollTo({ left: 0 });

            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflowX = 'hidden';

            return () => {
                document.body.style.overflowX = originalOverflowX;
                document.documentElement.style.overflowX = originalHtmlOverflowX;
            };
        }
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !currentTourStep) {
            setIsVisible(false);
            return;
        }

        // Auto-skip mobileOnly steps on desktop
        if (currentTourStep.mobileOnly && !isMobile) {
            nextStep();
            return;
        }

        const findAndHighlight = () => {
            // Find all matching elements and select the first VISIBLE one
            const targets = document.querySelectorAll(currentTourStep.targetSelector);
            const target = Array.from(targets).find(el => {
                const style = window.getComputedStyle(el);
                // Check if element is visible: not display:none, not visibility:hidden, and has layout
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    (el as HTMLElement).offsetParent !== null;
            }) as HTMLElement;

            if (target) {
                // Find scrollable parent (for modals and other scrollable containers)
                const findScrollableParent = (element: HTMLElement): HTMLElement | null => {
                    let parent = element.parentElement;
                    while (parent) {
                        const style = window.getComputedStyle(parent);
                        const overflowY = style.overflowY;
                        if (overflowY === 'auto' || overflowY === 'scroll') {
                            return parent;
                        }
                        parent = parent.parentElement;
                    }
                    return null;
                };

                const scrollableParent = findScrollableParent(target);

                if (scrollableParent) {
                    // For modal content - scroll the parent container
                    const targetRect = target.getBoundingClientRect();
                    const parentRect = scrollableParent.getBoundingClientRect();
                    const targetOffsetInParent = target.offsetTop;

                    // Scroll to center the element in the scrollable container
                    const scrollTo = targetOffsetInParent - (scrollableParent.clientHeight / 2) + (target.clientHeight / 2);
                    scrollableParent.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
                } else {
                    // For page content - use scrollIntoView
                    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
                }

                // Reset horizontal scroll after a short delay
                const t1 = setTimeout(() => {
                    if (window.scrollX !== 0) {
                        window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
                    }
                }, 100);
                timeoutRefs.current.push(t1);

                // Wait for scroll to complete
                const t2 = setTimeout(() => {
                    // Double check and correct if horizontal scroll happened
                    if (window.scrollX !== 0) {
                        window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' });
                    }

                    let currentRect = target.getBoundingClientRect();
                    const padding = 12;

                    const newTop = currentRect.top - padding;
                    const newBottom = currentRect.bottom + padding;
                    const newLeft = currentRect.left - padding;
                    const newRight = currentRect.right + padding;
                    const newWidth = currentRect.width + (padding * 2);
                    const newHeight = currentRect.height + (padding * 2);

                    setTargetRect({
                        top: newTop,
                        bottom: newBottom,
                        left: newLeft,
                        right: newRight,
                        width: newWidth,
                        height: newHeight,
                        x: newLeft,
                        y: newTop,
                        toJSON: () => ({ ...currentRect.toJSON(), top: newTop, bottom: newBottom, left: newLeft, right: newRight, width: newWidth, height: newHeight })
                    });

                    // Calculate tooltip position with proper viewport clamping
                    const tooltipWidth = 320;
                    const tooltipHeight = 180; // Approximate tooltip height
                    const spacing = 24;
                    const margin = 20; // Minimum margin from viewport edges
                    let top = 0;
                    let left = 0;

                    // Center horizontally on target, clamped to viewport
                    const centeredLeft = currentRect.left + (currentRect.width / 2) - (tooltipWidth / 2);
                    const safeLeft = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, centeredLeft));

                    if (currentTourStep.position === "bottom") {
                        // Tooltip below target
                        top = currentRect.bottom + spacing;
                        left = safeLeft;
                    } else if (currentTourStep.position === "top") {
                        // Check if there's enough room above the target
                        const idealTop = currentRect.top - spacing - tooltipHeight;
                        if (idealTop >= margin) {
                            // Enough room above - show tooltip above target
                            top = idealTop;
                            left = safeLeft;
                        } else {
                            // Not enough room above - fall back to bottom
                            top = currentRect.bottom + spacing;
                            left = safeLeft;
                        }
                    } else if (currentTourStep.position === "right") {
                        // Tooltip to the right of target
                        left = currentRect.right + spacing;
                        // Clamp left if it would go off right edge
                        if (left + tooltipWidth > window.innerWidth - margin) {
                            // Fall back to bottom if no room on right
                            top = currentRect.bottom + spacing;
                            left = safeLeft;
                        } else {
                            // Center vertically on target, clamped to viewport
                            top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin,
                                currentRect.top + (currentRect.height / 2) - (tooltipHeight / 2)));
                        }
                    } else if (currentTourStep.position === "left") {
                        // Tooltip to the left of target
                        left = currentRect.left - tooltipWidth - spacing;
                        // Clamp left if it would go off left edge
                        if (left < margin) {
                            // Fall back to bottom if no room on left
                            top = currentRect.bottom + spacing;
                            left = safeLeft;
                        } else {
                            // Center vertically on target, clamped to viewport
                            top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin,
                                currentRect.top + (currentRect.height / 2) - (tooltipHeight / 2)));
                        }
                    } else if (currentTourStep.position === "center") {
                        // "center" on desktop - show tooltip to the left of target
                        left = currentRect.left - tooltipWidth - spacing;
                        // Clamp left if it would go off left edge
                        if (left < margin) {
                            // Fall back to top if no room on left
                            top = currentRect.top - spacing - tooltipHeight;
                            left = safeLeft;
                        } else {
                            // Center vertically on target, clamped to viewport
                            top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin,
                                currentRect.top + (currentRect.height / 2) - (tooltipHeight / 2)));
                        }
                    }

                    setTooltipPos({ top, left });
                    setIsVisible(true);
                }, 500);
                timeoutRefs.current.push(t2);

                // Add pulse animation class to target
                target.classList.add('tour-target-pulse');
                return true;
            }
            return false;
        };

        let found = findAndHighlight();

        // If not found immediately, wait for mutation (page load/modal open)
        if (!found && currentTourStep.waitForElement) {
            const observer = new MutationObserver(() => {
                if (findAndHighlight()) {
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });

            // Cleanup observer
            return () => {
                observer.disconnect();
                const target = document.querySelector('.tour-target-pulse');
                if (target) target.classList.remove('tour-target-pulse');
            };
        }

        // Create a simple position update handler that doesn't trigger scrolling
        const updatePosition = () => {
            if (!isActive || !currentTourStep) return;

            const targets = document.querySelectorAll(currentTourStep.targetSelector);
            const target = Array.from(targets).find(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    (el as HTMLElement).offsetParent !== null;
            }) as HTMLElement;

            if (target) {
                const currentRect = target.getBoundingClientRect();
                const padding = 12;
                setTargetRect({
                    top: currentRect.top - padding,
                    bottom: currentRect.bottom + padding,
                    left: currentRect.left - padding,
                    right: currentRect.right + padding,
                    width: currentRect.width + (padding * 2),
                    height: currentRect.height + (padding * 2),
                    x: currentRect.left - padding,
                    y: currentRect.top - padding,
                    toJSON: () => currentRect.toJSON()
                });
            }
        };

        // Add event listeners for scroll/resize to update highlight position (without re-scrolling)
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, { capture: true, passive: true });

        return () => {
            const target = document.querySelector('.tour-target-pulse');
            if (target) target.classList.remove('tour-target-pulse');
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            // Clear all pending timeouts
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current = [];
        };
    }, [currentTourStep, isActive]);

    // Handle clicks on target element to advance tour
    useEffect(() => {
        if (!isActive || !currentTourStep || !currentTourStep.action) return;

        // Skip logic if we are just showing info without interaction
        if (currentTourStep.waitForElement === false) return;

        const handleAction = (e: Event) => {
            const clickedEl = e.target as HTMLElement;

            // Use closest() to check if clicked element or any ancestor matches the selector
            const matchingTarget = clickedEl.closest(currentTourStep.targetSelector);

            if (matchingTarget) {
                // Short timeout to let the UI action happen before moving next
                setTimeout(() => {
                    nextStep();
                }, 300);
            }
        };

        const eventName = currentTourStep.action === 'input' ? 'input' : 'click';
        // Use capture phase to detect before propagation stops
        document.addEventListener(eventName, handleAction, true);

        return () => {
            document.removeEventListener(eventName, handleAction, true);
        };
    }, [currentTourStep, isActive, nextStep]);

    if (!isActive || !currentTourStep || !isVisible || !targetRect) return null;

    // Determine if step is skippable (not critical path)
    const canSkipStep = currentTourStep.allowSkip !== false;

    return (
        <div className="fixed inset-0 z-[9998] overflow-hidden pointer-events-none">
            {/* Dark overlay */}
            <div className="absolute inset-0">
                <div
                    className="absolute left-0 right-0 top-0 bg-black/40 pointer-events-none"
                    style={{ height: Math.max(0, targetRect.top) }}
                />
                <div
                    className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-none"
                    style={{ top: targetRect.bottom }}
                />
                <div
                    className="absolute left-0 top-0 bg-black/40 pointer-events-none"
                    style={{ top: targetRect.top, height: targetRect.height, width: Math.max(0, targetRect.left) }}
                />
                <div
                    className="absolute right-0 top-0 bg-black/40 pointer-events-none"
                    style={{ top: targetRect.top, height: targetRect.height, left: targetRect.right }}
                />

                {/* Hole punch with pointerEvents: none to allow clicking through */}
                <div
                    className="absolute"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        pointerEvents: "none"
                    }}
                />
            </div>

            {/* Highlight border */}
            <div
                className="fixed z-[9999] pointer-events-none rounded-2xl"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    border: "3px solid #FF8A4C",
                    boxShadow: "0 0 0 4px rgba(255, 138, 76, 0.2), 0 0 30px rgba(255, 138, 76, 0.4)",
                    animation: "pulse-glow 2s ease-in-out infinite"
                }}
            />

            {/* Content */}
            <div
                className={`fixed z-[10000] bg-white transition-all duration-300 pointer-events-auto
                ${isMobile
                        ? currentTourStep.position === 'top'
                            ? "top-0 left-0 right-0 rounded-b-2xl px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border-b border-orange-100 animate-slide-down"
                            : currentTourStep.position === 'center'
                                ? "left-4 right-4 top-1/2 -translate-y-1/2 rounded-2xl px-4 py-4 shadow-[0_0_40px_rgba(0,0,0,0.2)] border border-orange-100"
                                : "bottom-0 left-0 right-0 rounded-t-2xl px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-orange-100 animate-slide-up"
                        : "w-80 rounded-2xl shadow-2xl p-5 border border-gray-100 animate-tour-scale-up"
                    }`}
                style={!isMobile ? {
                    top: tooltipPos.top,
                    left: tooltipPos.left
                    // No transform needed - positions are calculated directly with viewport clamping
                } : {}}
            >
                {/* Mobile Handle (Bottom) - smaller */}
                {isMobile && currentTourStep.position !== 'top' && currentTourStep.position !== 'center' && <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />}

                <div className={`flex justify-between items-start ${isMobile ? 'mb-2' : 'mb-4'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}>
                            {currentTourStep.id === 'welcome' || currentTourStep.id === 'complete' ? '★' : 'i'}
                        </span>
                        <h3 className={`font-bold text-gray-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
                            {currentTourStep.title}
                        </h3>
                    </div>
                </div>

                <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-xs mb-3' : 'text-sm mb-6'}`}>
                    {currentTourStep.content}
                </p>

                <div className={`flex items-center justify-between ${isMobile ? 'pt-2' : 'pt-3 border-t border-gray-100'}`}>
                    <button
                        onClick={() => {
                            // Try to close any open modals properly
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                            // Fallback close buttons
                            const closeBtn = document.querySelector('[data-tour-close], .fixed button[aria-label="Close"]') as HTMLButtonElement;
                            if (closeBtn) closeBtn.click();
                            setTimeout(() => skipTour(), 100);
                        }}
                        className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors py-2"
                    >
                        ออกจากการสอน
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Next Button - handles both click and non-click actions */}
                        {currentTourStep.id !== 'complete' && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // For 'click' action steps - simulate the click and let handleAction advance
                                    if (currentTourStep.action === 'click' && currentTourStep.targetSelector) {
                                        const targets = document.querySelectorAll(currentTourStep.targetSelector);
                                        const target = Array.from(targets).find(el => {
                                            const style = window.getComputedStyle(el);
                                            return style.display !== 'none' && style.visibility !== 'hidden';
                                        }) as HTMLElement;

                                        if (target) {
                                            // Click the target - handleAction will call nextStep
                                            target.click();
                                            return; // Don't call nextStep here, handleAction will do it
                                        }
                                    }

                                    // For 'input' actions or if target not found - advance directly
                                    nextStep();
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                                ถัดไป
                            </button>
                        )}

                        {canSkipStep && (
                            <button
                                onClick={() => {
                                    // Special handling for modals when skipping section
                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                                    const closeBtn = document.querySelector('.fixed.inset-0 button') as HTMLButtonElement;
                                    if (closeBtn && closeBtn.querySelector('svg path[d*="M6 18L18 6"]')) {
                                        closeBtn.click();
                                    }
                                    setTimeout(() => skipStep(), 100);
                                }}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-2"
                            >
                                ข้ามส่วนนี้
                            </button>
                        )}

                        {/* Only show 'Finish' on the last step */}
                        {currentTourStep.id === 'complete' && (
                            <button
                                onClick={skipTour}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                                เสร็จสิ้น
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Handle (Top) */}
                {isMobile && currentTourStep.position === 'top' && <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4" />}
            </div>

            <style jsx global>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        border-color: #FF8A4C;
                        box-shadow: 0 0 0 4px rgba(255, 138, 76, 0.2), 0 0 30px rgba(255, 138, 76, 0.3);
                    }
                    50% {
                        border-color: #FF6B2C;
                        box-shadow: 0 0 0 8px rgba(255, 138, 76, 0.15), 0 0 40px rgba(255, 138, 76, 0.5);
                    }
                }

                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes slide-down {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes tour-scale-up {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .animate-slide-up {
                    animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .animate-slide-down {
                    animation: slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .animate-tour-scale-up {
                    animation: tour-scale-up 0.2s ease-out forwards;
                }

                .tour-target-pulse {
                    position: relative;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                }
            `}</style>
        </div >
    );
}
