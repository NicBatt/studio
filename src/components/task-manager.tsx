
"use client";
import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';


interface TaskManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  existingTasks: Task[];
}

export function TaskManager({ isOpen, onOpenChange, user, existingTasks }: TaskManagerProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tasks</DialogTitle>
          <DialogDescription>
            Create, view, and manage your recurring tasks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <h3 className="font-semibold">Existing Tasks</h3>
            <div className="space-y-2">
                {existingTasks.length > 0 ? (
                    existingTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
                           <div>
                               <p className="font-medium">{task.label}</p>
                           </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks created yet.</p>
                )}
            </div>
          </div>

        <DialogFooter>
            <Button>Create New Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
