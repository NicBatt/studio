
"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Theme } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { addDays, parseISO } from 'date-fns';
import { decryptContent } from '@/lib/encryption';
import { useAuth } from '@/hooks/use-auth';

interface ThemeCalendarProps {
    themes: Theme[];
    selectedDate: Date;
    onDayClick: (day: Date) => void;
}

export function ThemeCalendar({ themes, selectedDate, onDayClick }: ThemeCalendarProps) {
    const { user } = useAuth();
    
    const modifiers = themes.reduce((acc, theme) => {
        acc[theme.id] = { 
            from: parseISO(theme.startDate),
            to: parseISO(theme.endDate)
        }
        return acc;
    }, {} as Record<string, DateRange>);

    const modifiersStyles = themes.reduce((acc, theme) => {
        // Assuming theme.color is in hex format #RRGGBB
        const hex = theme.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        acc[theme.id] = {
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.8)`, // 80% opacity
            color: 'white',
        };
        return acc;
    }, {} as Record<string, React.CSSProperties>);

    return (
        <div className="p-2">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => onDayClick(day || new Date())}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md"
            />
        </div>
    );
}
