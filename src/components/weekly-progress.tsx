

"use client";

import type { Task, TaskProgress, TaskProgressLog } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyView } from './weekly-view';
import { MonthlyView } from './monthly-view';
import { YearlyView } from './yearly-view';
import { SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { setTaskProgress } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { format } from 'date-fns';

interface WeeklyProgressProps {
  allTasks: Task[];
  allProgressLogs: TaskProgressLog[];
  user: User | null;
}

export type AllProgress = Record<string, Record<string, TaskProgress>>; // { 'YYYY-MM-DD': { 'taskId': 'full' } }

export function WeeklyProgress({ allTasks, allProgressLogs, user }: WeeklyProgressProps) {
  
  const allProgress = useMemo(() => {
    return allProgressLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = {};
        }
        acc[log.date][log.taskId] = log.progress;
        return acc;
    }, {} as AllProgress);
  }, [allProgressLogs]);

  const handleProgressChange = (dateKey: string, taskId: string, newProgress: TaskProgress) => {
    if (!user) return;
    setTaskProgress(user.uid, dateKey, taskId, newProgress);
  };
  
  const uniqueTasks = useMemo(() => {
    return [...new Map(allTasks.map(item => [item['id'], item])).values()]
      .sort((a,b) => a.label.localeCompare(b.label));
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
            <TabsList className="mx-auto shrink-0">
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
            <TabsContent value="month" className="flex-grow min-h-0">
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
