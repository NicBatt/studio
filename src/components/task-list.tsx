
"use client";

import type { Task, TaskProgress } from '@/lib/types';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ProgressCircle } from './progress-circle';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [taskProgress, setTaskProgress] = useState<Record<string, TaskProgress>>({});
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const allProgress = JSON.parse(localStorage.getItem('allTaskProgress') || '{}');
    if (allProgress[todayKey]) {
        setTaskProgress(allProgress[todayKey]);
    } else {
        setTaskProgress({});
    }
  }, [tasks, todayKey]);

  const handleProgressChange = (taskId: string, newProgress: TaskProgress) => {
    const newProgressForToday = { ...taskProgress, [taskId]: newProgress };
    setTaskProgress(newProgressForToday);
    
    const allProgress = JSON.parse(localStorage.getItem('allTaskProgress') || '{}');
    allProgress[todayKey] = newProgressForToday;
    localStorage.setItem('allTaskProgress', JSON.stringify(allProgress));
  };

  const getMilestoneText = (task: Task) => {
    const progress = taskProgress[task.id];
    if (progress === 'half' && task.milestoneHalf) {
      return ` — ${task.milestoneHalf}`;
    }
    if (progress === 'full' && task.milestoneFull) {
      return ` — ${task.milestoneFull}`;
    }
    return '';
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Daily Tasks</h3>
        <div className="space-y-3">
        {tasks.map(task => (
            <div key={task.id} className="flex items-center space-x-3">
                <ProgressCircle
                    progress={taskProgress[task.id] || 'none'}
                    onProgressChange={(newProgress) => handleProgressChange(task.id, newProgress)}
                />
                <label
                    htmlFor={`task-${task.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {task.label}
                    <span className="text-muted-foreground font-normal italic">
                        {getMilestoneText(task)}
                    </span>
                </label>
            </div>
        ))}
        </div>
    </div>
  );
}
