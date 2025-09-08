
"use client";

import { useState, useMemo } from 'react';
import type { Task, TaskProgress } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
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

export function MonthlyView({ allTasks, allProgress, onProgressChange, uniqueTasks }: MonthlyViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthDates = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  const firstDayOfMonth = getDay(startOfMonth(currentMonth)); // 0 = Sunday, 1 = Monday...
  const emptyCells = Array(firstDayOfMonth).fill(null);


  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-center p-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft />
            </Button>
            <h3 className="text-lg font-semibold w-40 text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight />
            </Button>
        </div>
        <ScrollArea className="flex-grow">
            <div className="flex justify-center">
                <div className="grid grid-cols-7 gap-2 p-2" style={{ gridTemplateRows: `repeat(${uniqueTasks.length + 1}, auto)`}}>
                    {WEEKDAY_LABELS.map(label => (
                        <div key={label} className="text-center font-medium text-muted-foreground">{label}</div>
                    ))}
                    {emptyCells.map((_, index) => <div key={`empty-header-${index}`}></div>)}
                    {monthDates.map(date => (
                         <div key={date.toISOString()} className={cn("text-center font-medium", isSameDay(date, new Date()) && "text-primary")}>
                            {format(date, 'd')}
                         </div>
                    ))}

                     {uniqueTasks.map(task => (
                         <>
                            {emptyCells.map((_, index) => <div key={`empty-task-${task.id}-${index}`}></div>)}
                            {monthDates.map(date => {
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const isVisible = isTaskForDate(task, date);

                                if (!isVisible) {
                                    return <div key={`${dateKey}-${task.id}`}></div>;
                                }

                                const progress = allProgress[dateKey]?.[task.id] || 'none';

                                return (
                                    <div key={`${dateKey}-${task.id}`} className="flex justify-center items-center h-8 w-8">
                                        <ProgressCircle
                                            progress={progress}
                                            onProgressChange={(newProgress) => onProgressChange(dateKey, task.id, newProgress)}
                                        />
                                    </div>
                                )
                            })}
                        </>
                    ))}
                </div>
            </div>
        </ScrollArea>
    </div>
  );
}
