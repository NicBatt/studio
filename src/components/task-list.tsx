
"use client";

import type { Task } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Reset checked state when the tasks prop changes (i.e., when the day changes)
  useEffect(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const storedToday = localStorage.getItem('checkedTasksDate');
    
    if (storedToday === todayKey) {
        const storedChecked = JSON.parse(localStorage.getItem('checkedTasks') || '{}');
        setCheckedTasks(storedChecked);
    } else {
        localStorage.setItem('checkedTasksDate', todayKey);
        localStorage.setItem('checkedTasks', '{}');
        setCheckedTasks({});
    }

  }, [tasks]);

  const handleCheckedChange = (taskId: string, isChecked: boolean) => {
    const newCheckedTasks = { ...checkedTasks, [taskId]: isChecked };
    setCheckedTasks(newCheckedTasks);
    localStorage.setItem('checkedTasks', JSON.stringify(newCheckedTasks));
  };


  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Daily Tasks</h3>
        <div className="space-y-2">
        {tasks.map(task => (
            <div key={task.id} className="flex items-center space-x-2">
                <Checkbox 
                    id={`task-${task.id}`} 
                    checked={!!checkedTasks[task.id]}
                    onCheckedChange={(checked) => handleCheckedChange(task.id, !!checked)}
                />
                <label
                    htmlFor={`task-${task.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {task.label}
                </label>
            </div>
        ))}
        </div>
    </div>
  );
}
