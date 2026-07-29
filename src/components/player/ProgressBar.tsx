"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    className?: string;
    compact?: boolean;
    showTimes?: boolean;
}

const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
    currentTime,
    duration,
    onSeek,
    className,
    compact = false,
    showTimes = true,
}) => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={cn("player-progress group/progress", className)}>
            <div className={cn("flex items-center gap-2 w-full", compact ? "gap-1.5" : "gap-3")}>
                {showTimes && !compact && (
                    <span className="text-[10px] md:text-xs text-muted-foreground tabular-nums font-medium min-w-[32px] text-right select-none">
                        {formatTime(currentTime)}
                    </span>
                )}
                <div className="flex-1 relative">
                    <Slider
                        value={[progress]}
                        max={100}
                        step={0.1}
                        onValueChange={([val]) => {
                            if (duration > 0) {
                                onSeek((val / 100) * duration);
                            }
                        }}
                        className={cn(
                            "w-full cursor-pointer",
                            "[&_[role=slider]]:h-3 [&_[role=slider]]:w-3",
                            "[&_[role=slider]]:opacity-0 group-hover/progress:[&_[role=slider]]:opacity-100",
                            "[&_[role=slider]]:transition-opacity [&_[role=slider]]:duration-200",
                            "[&_[role=slider]]:bg-primary [&_[role=slider]]:border-0",
                            "[&_[role=slider]]:shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
                            compact ? "h-1 [&>span:first-child]:h-1" : "h-1.5 [&>span:first-child]:h-1.5",
                            "hover:h-2 hover:[&>span:first-child]:h-2 transition-all duration-150",
                        )}
                    />
                </div>
                {showTimes && !compact && (
                    <span className="text-[10px] md:text-xs text-muted-foreground tabular-nums font-medium min-w-[32px] select-none">
                        {formatTime(duration)}
                    </span>
                )}
            </div>
            {showTimes && compact && (
                <div className="flex justify-between mt-0.5 px-0.5">
                    <span className="text-[9px] text-muted-foreground/70 tabular-nums select-none">
                        {formatTime(currentTime)}
                    </span>
                    <span className="text-[9px] text-muted-foreground/70 tabular-nums select-none">
                        {formatTime(duration)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default React.memo(ProgressBar);
