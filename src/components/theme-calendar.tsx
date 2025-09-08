
"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Theme } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { addDays, parseISO } from 'date-fns';

interface ThemeCalendarProps {
    themes: Theme[];
    selectedDate: Date;
    onDayClick: (day: Date) => void;
}

export function ThemeCalendar({ themes, selectedDate, onDayClick }: ThemeCalendarProps) {
    
    const modifiers = themes.reduce((acc, theme) => {
        acc[theme.id] = { 
            from: parseISO(theme.startDate),
            to: parseISO(theme.endDate)
        }
        return acc;
    }, {} as Record<string, DateRange>);

    const modifiersStyles = themes.reduce((acc, theme) => {
        acc[theme.id] = {
            backgroundColor: theme.color,
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
