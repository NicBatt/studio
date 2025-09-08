
"use client";

import { TaskProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface ProgressCircleProps {
    progress: TaskProgress;
    onProgressChange: (newProgress: TaskProgress) => void;
}

const progressStates: TaskProgress[] = ['none', 'half', 'full'];

const HalfCircle = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-green-500"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a10 10 0 0 0 0 20v-20z" style={{ strokeWidth: 0, fill: 'currentColor' }} />
    </svg>
);


export function ProgressCircle({ progress, onProgressChange }: ProgressCircleProps) {

    const handleClick = () => {
        const currentIndex = progressStates.indexOf(progress);
        const nextIndex = (currentIndex + 1) % progressStates.length;
        onProgressChange(progressStates[nextIndex]);
    }

    const renderIcon = () => {
        switch (progress) {
            case 'none':
                return <Circle className="text-muted-foreground/50" />;
            case 'half':
                return <HalfCircle />;
            case 'full':
                return <Circle className="text-green-500 fill-current" />;
            default:
                return <Circle className="text-muted-foreground/50" />;
        }
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center justify-center rounded-full transition-colors h-6 w-6",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            aria-label={`Task progress: ${progress}. Click to change.`}
        >
            {renderIcon()}
        </button>
    )

}
