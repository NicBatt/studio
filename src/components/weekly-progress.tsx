
"use client";

import type { Task, TaskProgress } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyView } from './weekly-view';
import { MonthlyView } from './monthly-view';
import { YearlyView } from './yearly-view';
import { SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';

interface WeeklyProgressProps {
  allTasks: Task[];
}

export type AllProgress = Record<string, Record<string, TaskProgress>>; // { 'YYYY-MM-DD': { 'taskId': 'full' } }

export function WeeklyProgress({ allTasks }: WeeklyProgressProps) {
  const [allProgress, setAllProgress] = useState<AllProgress>({});

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
    return (
        <div className="p-4 text-center">
            <SheetHeader>
                <SheetTitle>Track Your Progress</SheetTitle>
            </SheetHeader>
            <p className="text-muted-foreground mt-4">No tasks defined. Create some tasks to see your weekly, monthly, and yearly progress.</p>
        </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Progress</SheetTitle>
          <SheetDescription>
            Visualize your task completion over time.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="week" className="mt-4 flex-grow flex flex-col">
            <TabsList className="mx-auto">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="flex-grow">
               <WeeklyView 
                    allTasks={allTasks} 
                    allProgress={allProgress} 
                    onProgressChange={handleProgressChange} 
                    uniqueTasks={uniqueTasks}
                />
            </TabsContent>
            <TabsContent value="month" className="flex-grow">
                 <MonthlyView
                    allTasks={allTasks}
                    allProgress={allProgress}
                    onProgressChange={handleProgressChange}
                    uniqueTasks={uniqueTasks}
                 />
            </TabsContent>
            <TabsContent value="year" className="flex-grow">
                <YearlyView 
                    allTasks={allTasks}
                    allProgress={allProgress}
                />
            </TabsContent>
        </Tabs>
    </div>
  );
}
