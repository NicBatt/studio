
"use client";

import { useState, useMemo } from 'react';
import type { Task, TaskProgress } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ProgressCircle } from './progress-circle';
import { isTaskForDate, cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AllProgress } from './weekly-progress';

interface MonthlyViewProps {
  allTasks: Task[];
  allProgress: AllProgress;
  onProgressChange: (dateKey: string, taskId: string, newProgress: TaskProgress) => void;
  uniqueTasks: Task[];
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthlyView({ allTasks, allProgress, onProgressChange }: MonthlyViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthGridDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);
  
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-center p-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft />
            </Button>
            <h3 className="text-lg font-semibold w-40 text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight />
            </Button>
        </div>
        
        <div className="grid grid-cols-7 text-center font-medium text-muted-foreground text-sm shrink-0">
             {WEEKDAY_LABELS.map(label => (
                <div key={label} className="py-2">{label}</div>
            ))}
        </div>

        <ScrollArea className="flex-grow">
            <div className="grid grid-cols-7 gap-1 p-1">
                {monthGridDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const tasksForDay = allTasks.filter(task => isTaskForDate(task, day));
                    
                    return (
                        <div 
                            key={day.toISOString()}
                            className={cn(
                                "border rounded-md min-h-[90px] p-1 flex flex-col",
                                isCurrentMonth ? "bg-background" : "bg-muted/50",
                                isSameDay(day, new Date()) && "border-primary"
                            )}
                        >
                            <span className={cn(
                                "font-semibold text-sm",
                                isCurrentMonth ? "text-foreground" : "text-muted-foreground/60"
                            )}>
                                {format(day, 'd')}
                            </span>
                            {tasksForDay.length > 0 && (
                                <div className="flex-grow flex flex-wrap gap-1.5 mt-1 justify-start items-start">
                                    {tasksForDay.map(task => (
                                         <ProgressCircle
                                            key={task.id}
                                            progress={allProgress[dateKey]?.[task.id] || 'none'}
                                            onProgressChange={(newProgress) => onProgressChange(dateKey, task.id, newProgress)}
                                            size="small"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    </div>
  );
}

    