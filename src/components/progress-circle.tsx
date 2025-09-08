
"use client";

import { TaskProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority"

const progressCircleVariants = cva(
    "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            size: {
                default: "h-6 w-6",
                small: "h-5 w-5"
            }
        },
        defaultVariants: {
            size: "default"
        }
    }
);

interface ProgressCircleProps extends VariantProps<typeof progressCircleVariants> {
    progress: TaskProgress;
    onProgressChange: (newProgress: TaskProgress) => void;
    className?: string;
}

const progressStates: TaskProgress[] = ['none', 'half', 'full'];

const HalfCircle = ({ size }: { size: "default" | "small" | null | undefined}) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn(
            "text-green-500",
            size === "small" ? "w-5 h-5" : "w-6 h-6"
        )}
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a10 10 0 0 0 0 20v-20z" style={{ strokeWidth: 0, fill: 'currentColor' }} />
    </svg>
);


export function ProgressCircle({ progress, onProgressChange, size, className }: ProgressCircleProps) {

    const handleClick = () => {
        const currentIndex = progressStates.indexOf(progress);
        const nextIndex = (currentIndex + 1) % progressStates.length;
        onProgressChange(progressStates[nextIndex]);
    }

    const iconSize = size === "small" ? "h-5 w-5" : "h-6 w-6";

    const renderIcon = () => {
        switch (progress) {
            case 'none':
                return <Circle className={cn("text-muted-foreground/50", iconSize)} />;
            case 'half':
                return <HalfCircle size={size} />;
            case 'full':
                return <Circle className={cn("text-green-500 fill-current", iconSize)} />;
            default:
                return <Circle className={cn("text-muted-foreground/50", iconSize)} />;
        }
    }

    return (
        <button
            onClick={handleClick}
            className={cn(progressCircleVariants({ size }), className)}
            aria-label={`Task progress: ${progress}. Click to change.`}
        >
            {renderIcon()}
        </button>
    )

}
