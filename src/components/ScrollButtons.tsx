import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollButtonsProps {
    onScrollToTop?: () => void;
    onScrollToBottom?: () => void;
    className?: string;
}

export const ScrollButtons = ({ onScrollToTop, onScrollToBottom, className }: ScrollButtonsProps) => {
    const [visibleState, setVisibleState] = useState<'top' | 'bottom' | null>(null);
    const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
    const scrollDelta = useRef(0);
    const scrollStartTime = useRef(Date.now());
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);
    const resetDeltaTimeout = useRef<NodeJS.Timeout | null>(null);
    const scrollEventsCount = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const diff = currentScrollY - lastScrollY.current;
            
            // Determine scroll direction
            const isScrollingDown = diff > 0;
            const isScrollingUp = diff < 0;

            // Reset accumulated scroll delta if direction reverses
            if ((isScrollingDown && scrollDelta.current < 0) || (isScrollingUp && scrollDelta.current > 0)) {
                scrollDelta.current = 0;
            }
            
            if (scrollDelta.current === 0) {
                scrollStartTime.current = Date.now();
                scrollEventsCount.current = 0;
            }
            
            scrollEventsCount.current++;
            scrollDelta.current += diff;
            lastScrollY.current = currentScrollY;

            // Ignore massive single-frame jumps (programmatic corrections by Virtuoso)
            if (Math.abs(diff) > 150) {
                scrollDelta.current = 0;
                return;
            }

            // Require 200px of continuous scrolling
            const THRESHOLD = 200; 

            if (Math.abs(scrollDelta.current) > THRESHOLD) {
                const duration = Date.now() - scrollStartTime.current;
                
                // Only show button if the scroll was very fast (200px in under 250ms)
                // AND it took more than 2 scroll events (filters out remaining instant jumps)
                if (duration < 250 && scrollEventsCount.current >= 3) {
                    if (scrollDelta.current > 0) {
                        // Scrolled down -> Show "Scroll to Bottom" button
                        if (currentScrollY + window.innerHeight < document.documentElement.scrollHeight - 400) {
                            setVisibleState('bottom');
                        } else {
                            setVisibleState(null);
                        }
                    } else if (scrollDelta.current < 0) {
                        // Scrolled up -> Show "Scroll to Top" button
                        if (currentScrollY > 400) {
                            setVisibleState('top');
                        } else {
                            setVisibleState(null);
                        }
                    }
                }
                
                // Reset delta after hitting threshold so we can measure the next swipe
                scrollDelta.current = 0;
            }

            // Reset delta if user stops scrolling for a short time
            if (resetDeltaTimeout.current) clearTimeout(resetDeltaTimeout.current);
            resetDeltaTimeout.current = setTimeout(() => {
                scrollDelta.current = 0;
            }, 100);

            // Reset hide timeout on every scroll event
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            
            // Hide the button after 2.5 seconds of no scrolling activity
            hideTimeout.current = setTimeout(() => {
                setVisibleState(null);
                scrollDelta.current = 0;
            }, 2500);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            if (resetDeltaTimeout.current) clearTimeout(resetDeltaTimeout.current);
        };
    }, []);

    const scrollToTop = () => {
        if (onScrollToTop) {
            onScrollToTop();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setVisibleState(null);
    };

    const scrollToBottom = () => {
        if (onScrollToBottom) {
            onScrollToBottom();
        } else {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
        setVisibleState(null);
    };

    return (
        <div className={cn(
            "fixed left-1/2 -translate-x-1/2 z-[105] transition-all duration-500 ease-out",
            className || "bottom-10",
            visibleState ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-90 pointer-events-none"
        )}>
            <button
                onClick={visibleState === 'top' ? scrollToTop : scrollToBottom}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-zinc-300 hover:text-white hover:bg-black/80 hover:border-primary/40 hover:shadow-[0_0_24px_hsl(var(--primary)/0.2)] transition-all duration-300 group"
            >
                {visibleState === 'top' ? (
                    <>
                        <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform text-primary" />
                        <span className="text-sm font-medium tracking-wide">Top</span>
                    </>
                ) : (
                    <>
                        <span className="text-sm font-medium tracking-wide">Bottom</span>
                        <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-primary" />
                    </>
                )}
            </button>
        </div>
    );
};
