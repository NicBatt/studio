
"use client";

import { useState, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, addYears, subYears, isSameDay, getWeek } from 'date-fns';
import { isTaskForDate, cn } from '@/lib/utils';
import { AllProgress } from './weekly-progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from './ui/progress';


interface YearlyViewProps {
  allTasks: Task[];
  allProgress: AllProgress;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearlyView({ allTasks, allProgress }: YearlyViewProps) {
  const [currentYear, setCurrentYear] = useState(new Date());

  const yearDates = useMemo(() => {
    const start = startOfYear(currentYear);
    const end = endOfYear(currentYear);
    return eachDayOfInterval({ start, end });
  }, [currentYear]);

  const getCompletionPercentage = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const tasksForDay = allTasks.filter(task => isTaskForDate(task, date));
    if (tasksForDay.length === 0) return -1; // No tasks for this day

    const progressForDay = allProgress[dateKey];
    if (!progressForDay) return 0;

    const totalScore = tasksForDay.reduce((sum, task) => {
        const progress = progressForDay[task.id];
        if (progress === 'full') return sum + 1;
        if (progress === 'half') return sum + 0.5;
        return sum;
    }, 0);

    return (totalScore / tasksForDay.length) * 100;
  };
  
  const goToNextYear = () => setCurrentYear(addYears(currentYear, 1));
  const goToPreviousYear = () => setCurrentYear(subYears(currentYear, 1));

  // Create an array of 53 weeks * 7 days, initialized to null
  const gridCells: (Date | null)[] = Array(7 * 53).fill(null);
  
  // Place each date in the correct grid cell
  yearDates.forEach(date => {
      const dayOfWeek = getDay(date); // Sunday = 0
      const weekOfYear = getWeek(date, { weekStartsOn: 0, firstWeekContainsDate: 1 });
      const gridIndex = dayOfWeek + (weekOfYear -1) * 7;
      
      if (gridIndex >= 0 && gridIndex < gridCells.length) {
        gridCells[gridIndex] = date;
      }
  });


  return (
    <TooltipProvider>
      <div className="h-full flex flex-col items-center p-2">
         <div className="flex items-center justify-center p-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousYear}>
                <ChevronLeft />
            </Button>
            <h3 className="text-lg font-semibold w-24 text-center">{format(currentYear, 'yyyy')}</h3>
            <Button variant="ghost" size="icon" onClick={goToNextYear}>
                <ChevronRight />
            </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto p-2">
             <div className="flex flex-col text-xs text-muted-foreground pt-1 space-y-2">
                <span className="h-4">Sun</span>
                <span className="h-4">Mon</span>
                <span className="h-4">Tue</span>
                <span className="h-4">Wed</span>
                <span className="h-4">Thu</span>
                <span className="h-4">Fri</span>
                <span className="h-4">Sat</span>
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-2">
            {gridCells.map((date, index) => {
              const daySize = 'w-4 h-4';
              if (!date) {
                return <div key={index} className={cn(daySize)} />;
              }
              const percentage = getCompletionPercentage(date);
              
              return (
                <Tooltip key={index}>
                    <TooltipTrigger asChild>
                    <div
                        className={cn(
                          'rounded-sm bg-muted/30 overflow-hidden',
                          daySize,
                          isSameDay(date, new Date()) && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}
                    >
                      {percentage >= 0 && (
                        <div 
                            className="h-full w-full bg-green-500" 
                            style={{ 
                                transform: `translateY(${(100 - percentage)}%)`,
                                transition: 'transform 0.3s ease-in-out'
                             }}
                        />
                      )}
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>{format(date, 'MMMM d, yyyy')}</p>
                    {percentage >= 0 ? (
                        <p>{Math.round(percentage)}% complete</p>
                    ) : (
                        <p>No tasks scheduled</p>
                    )}
                    </TooltipContent>
                </Tooltip>
              );
            })}
            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
