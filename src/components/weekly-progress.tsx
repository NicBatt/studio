
"use client";

import type { Task, TaskProgress } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ProgressCircle } from './progress-circle';
import { isTaskForDate } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface WeeklyProgressProps {
  allTasks: Task[];
}

type AllProgress = Record<string, Record<string, TaskProgress>>; // { 'YYYY-MM-DD': { 'taskId': 'full' } }

export function WeeklyProgress({ allTasks }: WeeklyProgressProps) {
  const [allProgress, setAllProgress] = useState<AllProgress>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  useEffect(() => {
    const storedProgress = JSON.parse(localStorage.getItem('allTaskProgress') || '{}');
    setAllProgress(storedProgress);
  }, []);

  const handleProgressChange = (dateKey: string, taskId: string, newProgress: TaskProgress) => {
    const newAllProgress = { ...allProgress };
    if (!newAllProgress[dateKey]) {
      newAllProgress[dateKey] = {};
    }
    newAllProgress[dateKey][taskId] = newProgress;
    
    setAllProgress(newAllProgress);
    localStorage.setItem('allTaskProgress', JSON.stringify(newAllProgress));
  };
  
  const dailyTasks = useMemo(() => {
      return weekDates.map(date => ({
          date,
          tasks: allTasks.filter(task => isTaskForDate(task, date))
      }));
  }, [weekDates, allTasks]);
  
  const uniqueTasks = useMemo(() => {
    const taskMap = new Map<string, Task>();
    allTasks.forEach(task => {
        if (!taskMap.has(task.id)) {
            taskMap.set(task.id, task);
        }
    });
    return Array.from(taskMap.values());
  }, [allTasks]);


  if (uniqueTasks.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No tasks defined. Create some tasks to see your weekly progress.</p>;
  }

  return (
    <div className="p-4 h-full">
        <ScrollArea className="h-full w-full">
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

                                        const progress = allProgress[dateKey]?.[task.id] || 'none';

                                        return (
                                            <td key={dateKey} className="p-2 align-middle text-center w-20">
                                                <div className="flex justify-center">
                                                    <ProgressCircle
                                                        progress={progress}
                                                        onProgressChange={(newProgress) => handleProgressChange(dateKey, task.id, newProgress)}
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
