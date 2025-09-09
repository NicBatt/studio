
"use client";
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2, Pencil } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO } from 'date-fns';
import { createTask, updateTask, deleteTask } from '@/lib/firebase';
import type { Task, Recurrence } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaskManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  existingTasks: Task[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TaskManager({ isOpen, onOpenChange, user, existingTasks }: TaskManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [recurrenceType, setRecurrenceType] = useState<Recurrence['type']>('daily');
  const [everyXDays, setEveryXDays] = useState<number>(2);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([new Date().getDay()]);
  const [monthlyDay, setMonthlyDay] = useState<number>(new Date().getDate());
  const [milestoneHalf, setMilestoneHalf] = useState('');
  const [milestoneFull, setMilestoneFull] = useState('');

  useEffect(() => {
    if (editingTask) {
      setLabel(editingTask.label);
      setStartDate(parseISO(editingTask.startDate));
      const { recurrence } = editingTask;
      setRecurrenceType(recurrence.type);
      if (recurrence.type === 'every_x_days') setEveryXDays(recurrence.days);
      if (recurrence.type === 'weekly') setWeeklyDays(recurrence.days);
      if (recurrence.type === 'monthly') setMonthlyDay(recurrence.day);
      setMilestoneHalf(editingTask.milestoneHalf || '');
      setMilestoneFull(editingTask.milestoneFull || '');
    }
  }, [editingTask]);

  const resetForm = () => {
    setLabel('');
    setStartDate(new Date());
    setRecurrenceType('daily');
    setEveryXDays(2);
    setWeeklyDays([new Date().getDay()]);
    setMonthlyDay(new Date().getDate());
    setMilestoneHalf('');
    setMilestoneFull('');
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const handleSaveTask = async () => {
    if (!label || !startDate) {
      alert('Please fill in all required fields.');
      return;
    }

    let recurrence: Recurrence;
    switch (recurrenceType) {
      case 'daily':
        recurrence = { type: 'daily' };
        break;
      case 'every_x_days':
        recurrence = { type: 'every_x_days', days: everyXDays };
        break;
      case 'weekly':
        if (weeklyDays.length === 0) {
            alert('Please select at least one day for weekly recurrence.');
            return;
        }
        recurrence = { type: 'weekly', days: weeklyDays.sort() };
        break;
      case 'monthly':
        recurrence = { type: 'monthly', day: monthlyDay };
        break;
    }
    
    const taskData = {
      label,
      startDate: format(startDate, 'yyyy-MM-dd'),
      recurrence,
      milestoneHalf,
      milestoneFull,
    };
    
    if (editingTask) {
      await updateTask({ ...taskData, id: editingTask.id }, user.uid);
    } else {
      await createTask(taskData, user.uid);
    }
    
    resetForm();
    onOpenChange(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(user.uid, taskId);
  }

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  }

  const handleWeeklyDayChange = (dayIndex: number) => {
    setWeeklyDays(prev => 
        prev.includes(dayIndex) 
            ? prev.filter(d => d !== dayIndex) 
            : [...prev, dayIndex]
    );
  };

  const getRecurrenceText = (recurrence: Recurrence): string => {
    switch (recurrence.type) {
      case 'daily':
        return 'Recurs daily';
      case 'every_x_days':
        return `Recurs every ${recurrence.days} days`;
      case 'weekly':
        const days = recurrence.days.map(d => WEEKDAYS[d]).join(', ');
        return `Recurs weekly on ${days}`;
      case 'monthly':
        return `Recurs monthly on day ${recurrence.day}`;
      default:
        return 'Invalid recurrence';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "Manage Tasks"}</DialogTitle>
          <DialogDescription>
            {isFormOpen
              ? (editingTask ? 'Edit your recurring task.' : 'Create a new recurring task.')
              : 'Create, view, and manage your recurring tasks.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isFormOpen ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Task Name</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="col-span-3"/>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestoneHalf" className="text-right">Half Complete</Label>
              <Input id="milestoneHalf" value={milestoneHalf} onChange={(e) => setMilestoneHalf(e.target.value)} className="col-span-3" placeholder="Milestone for 50% progress (optional)"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestoneFull" className="text-right">Fully Complete</Label>
              <Input id="milestoneFull" value={milestoneFull} onChange={(e) => setMilestoneFull(e.target.value)} className="col-span-3" placeholder="Milestone for 100% progress (optional)" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="start-date" variant={'outline'} className="col-span-3 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'LLL dd, y') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurrence-type" className="text-right">Recurs</Label>
                <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as Recurrence['type'])}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="every_x_days">Every X Days</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        {/* <SelectItem value="monthly">Monthly</SelectItem> */}
                    </SelectContent>
                </Select>
            </div>
            
            {recurrenceType === 'every_x_days' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="every-x-days" className="text-right">Every</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Input id="every-x-days" type="number" min="2" value={everyXDays} onChange={(e) => setEveryXDays(Number(e.target.value))} className="w-20"/>
                        <span>days</span>
                    </div>
                </div>
            )}

            {recurrenceType === 'weekly' && (
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">On Days</Label>
                    <div className="col-span-3 grid grid-cols-3 gap-2">
                       {WEEKDAYS.map((day, index) => (
                           <div key={day} className="flex items-center space-x-2">
                               <Checkbox id={`day-${index}`} checked={weeklyDays.includes(index)} onCheckedChange={() => handleWeeklyDayChange(index)}/>
                               <label htmlFor={`day-${index}`} className="text-sm font-medium leading-none">{day}</label>
                           </div>
                       ))}
                    </div>
                </div>
            )}

          </div>
        ) : (
          <div className="py-4 space-y-4">
            <h3 className="font-semibold">Existing Tasks</h3>
            <div className="space-y-2">
                {existingTasks.length > 0 ? (
                    existingTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
                           <div>
                               <p className="font-medium">{task.label}</p>
                               <p className="text-sm text-muted-foreground">{getRecurrenceText(task.recurrence)} starting {format(parseISO(task.startDate), 'MMM d, yyyy')}</p>
                           </div>
                           <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(task)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the task "{task.label}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks created yet.</p>
                )}
            </div>
          </div>
        )}

        <DialogFooter>
          {isFormOpen ? (
            <>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSaveTask}>Save Task</Button>
            </>
          ) : (
            <Button onClick={handleOpenCreate}>Create New Task</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    