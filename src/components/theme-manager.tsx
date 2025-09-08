
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format, parseISO } from 'date-fns';
import { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import { SketchPicker } from 'react-color';
import { createTheme, deleteTheme } from '@/lib/firebase';
import type { Theme } from '@/lib/types';
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
import { encryptContent, decryptContent } from '@/lib/encryption';


interface ThemeManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  existingThemes: Theme[];
}

export function ThemeManager({ isOpen, onOpenChange, user, existingThemes }: ThemeManagerProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#f44336');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTheme = async () => {
    if (!label || !dateRange?.from || !dateRange?.to) {
      alert('Please fill in all required fields.');
      return;
    }
    
    await createTheme({
      userId: user.uid,
      label: encryptContent(label, user.uid),
      description: encryptContent(description, user.uid),
      color,
      startDate: format(dateRange.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to, 'yyyy-MM-dd'),
    });
    
    // Reset form
    setLabel('');
    setDescription('');
    setColor('#f44336');
    setDateRange({ from: new Date(), to: addDays(new Date(), 7) });
    setIsCreating(false);
  };

  const handleDeleteTheme = async (themeId: string) => {
    await deleteTheme(themeId);
  }
  
  const disabledDays = existingThemes.map(theme => ({
    from: parseISO(theme.startDate),
    to: parseISO(theme.endDate)
  }));

  const handleDateSelect: SelectRangeEventHandler = (range, selectedDay) => {
    if (dateRange?.from && dateRange.to) {
        // Third click: reset the selection
        setDateRange({ from: selectedDay, to: undefined });
    } else {
        setDateRange(range);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            setIsCreating(false); // Reset view when closing dialog
        }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Themes</DialogTitle>
          <DialogDescription>
            Create, view, and manage your journal themes.
          </DialogDescription>
        </DialogHeader>
        
        {isCreating ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date-range" className="text-right">
                Date Range
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-range"
                      variant={'outline'}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={2}
                      disabled={disabledDays}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Color</Label>
              <div className="col-span-3">
                <SketchPicker color={color} onChangeComplete={(c) => setColor(c.hex)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <h3 className="font-semibold">Existing Themes</h3>
            <div className="space-y-2">
                {existingThemes.length > 0 ? (
                    existingThemes.map(theme => (
                        <div key={theme.id} className="flex items-center justify-between p-2 border rounded-md">
                           <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded-full" style={{backgroundColor: theme.color}}></div>
                             <div>
                                 <p className="font-medium">{theme.label}</p>
                                 <p className="text-sm text-muted-foreground">{format(parseISO(theme.startDate), 'MMM d')} - {format(parseISO(theme.endDate), 'MMM d, yyyy')}</p>
                             </div>
                           </div>
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
                                            This will permanently delete the theme "{theme.label}". This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTheme(theme.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No themes created yet.</p>
                )}
            </div>
          </div>
        )}

        <DialogFooter>
          {isCreating ? (
            <>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTheme}>Create Theme</Button>
            </>
          ) : (
            <Button onClick={() => setIsCreating(true)}>Create New Theme</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
