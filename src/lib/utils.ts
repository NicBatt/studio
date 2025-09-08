
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task } from './types';
import { parseISO, differenceInDays, isBefore } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToRgba(hex: string, opacity: number): string {
    const hexValue = hex.replace('#', '');
    if (hexValue.length !== 6) {
        console.error("Invalid hex color:", hex);
        return `rgba(0, 0, 0, ${opacity})`;
    }
    const r = parseInt(hexValue.substring(0, 2), 16);
    const g = parseInt(hexValue.substring(2, 4), 16);
    const b = parseInt(hexValue.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const isTaskForDate = (task: Task, date: Date): boolean => {
    const startDate = parseISO(task.startDate);
    
    // Normalize dates to avoid time zone issues
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const taskStartDate = new Date(startDate);
    taskStartDate.setHours(0, 0, 0, 0);

    if (isBefore(checkDate, taskStartDate)) {
        return false;
    }

    const { recurrence } = task;
    const dayDiff = differenceInDays(checkDate, taskStartDate);

    switch (recurrence.type) {
        case 'daily':
            return true;
        case 'every_x_days':
            if (recurrence.days <= 0) return false;
            return dayDiff % recurrence.days === 0;
        case 'weekly':
            const checkDay = checkDate.getDay(); // Sunday is 0, Monday is 1, etc.
            return recurrence.days.includes(checkDay);
        case 'monthly':
             // This is a simplification. A robust solution would handle months with fewer days.
             // For example, if a task is on the 31st, it won't appear in February.
            return checkDate.getDate() === recurrence.day;
        default:
            return false;
    }
};
