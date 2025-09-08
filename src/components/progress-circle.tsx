
"use client";

import { TaskProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Circle, CircleDot, CheckCircle2 } from "lucide-react";

interface ProgressCircleProps {
    progress: TaskProgress;
    onProgressChange: (newProgress: TaskProgress) => void;
}

const progressStates: TaskProgress[] = ['none', 'half', 'full'];

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
                return <CircleDot className="text-green-500" />;
            case 'full':
                return <CheckCircle2 className="text-green-500" />;
            default:
                return <Circle className="text-muted-foreground/50" />;
        }
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center justify-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            aria-label={`Task progress: ${progress}. Click to change.`}
        >
            {renderIcon()}
        </button>
    )

}
