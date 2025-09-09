
"use client";

import { useState, useMemo } from 'react';
import type { Task, TaskProgress } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ProgressCircle } from './progress-circle';
import { isTaskForDate, cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AllProgress } from './weekly-progress';

interface WeeklyViewProps {
  allTasks: Task[];
  allProgress: AllProgress;
  onProgressChange: (dateKey: string, taskId: string, newProgress: TaskProgress) => void;
  uniqueTasks: Task[];
}

export function WeeklyView({ allTasks, allProgress, onProgressChange, uniqueTasks }: WeeklyViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const dailyTasks = useMemo(() => {
      return weekDates.map(date => ({
          date,
          tasks: allTasks.filter(task => isTaskForDate(task, date))
      }));
  }, [weekDates, allTasks]);

  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));


  return (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-center p-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft />
            </Button>
            <h3 className="text-lg font-semibold">This Week</h3>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight />
            </Button>
        </div>
        <ScrollArea className="flex-grow">
            <div className="relative">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr className="border-b">
                            <th className="sticky left-0 bg-background/95 backdrop-blur-sm z-10 w-1/3 md:w-1/4 p-2 text-left font-medium text-muted-foreground">Task</th>
                            {weekDates.map(date => (
                                <th key={date.toISOString()} className={cn(
                                    "p-2 text-center font-medium text-muted-foreground w-20",
                                    isSameDay(date, new Date()) && "text-primary"
                                )}>
                                    <div>{format(date, 'eee')}</div>
                                    <div className="text-sm">{format(date, 'd')}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueTasks.map(task => {
                             const isTaskVisibleForWeek = dailyTasks.some(day => day.tasks.some(t => t.id === task.id));
                             if (!isTaskVisibleForWeek) return null;

                            return (
                                <tr key={task.id} className="border-b">
                                    <td className="sticky left-0 bg-background/95 backdrop-blur-sm z-10 p-2 font-medium w-1/3 md:w-1/4 align-top">
                                        {task.label}
                                    </td>
                                    {weekDates.map(date => {
                                        const dateKey = format(date, 'yyyy-MM-dd');
                                        const isVisible = dailyTasks
                                            .find(d => isSameDay(d.date, date))
                                            ?.tasks.some(t => t.id === task.id);

                                        if (!isVisible) {
                                            return <td key={dateKey} className="p-2 align-middle text-center w-20"></td>;
                                        }

                                        const progress = allProgress[dateKey]?.[task.id] || 0;

                                        return (
                                            <td key={dateKey} className="p-2 align-middle text-center w-20">
                                                <div className="flex justify-center">
                                                    <ProgressCircle
                                                        progress={progress}
                                                        onProgressChange={(newProgress) => onProgressChange(dateKey, task.id, newProgress)}
                                                    />
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
