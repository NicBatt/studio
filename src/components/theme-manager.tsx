
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2, Pencil, PlusCircle, XCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format, parseISO } from 'date-fns';
import { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import { SketchPicker } from 'react-color';
import { createTheme, deleteTheme, updateTheme, createTask } from '@/lib/firebase';
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
import { useToast } from '@/hooks/use-toast';


interface ThemeManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  existingThemes: Theme[];
}

const defaultDateRange = {
    from: new Date(),
    to: addDays(new Date(), 7),
};

export function ThemeManager({ isOpen, onOpenChange, user, existingThemes }: ThemeManagerProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>(['']);
  const [color, setColor] = useState('#f44336');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingTheme) {
        setLabel(editingTheme.label);
        setDescription(editingTheme.description || '');
        setColor(editingTheme.color);
        setDateRange({
            from: parseISO(editingTheme.startDate),
            to: parseISO(editingTheme.endDate)
        });
        setOutcomes(['']); // Don't load tasks as outcomes for editing simplicity
    }
  }, [editingTheme]);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setOutcomes(['']);
    setColor('#f44336');
    setDateRange(defaultDateRange);
    setEditingTheme(null);
    setIsFormOpen(false);
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = value;
    setOutcomes(newOutcomes);
  };

  const addOutcomeInput = () => {
    setOutcomes([...outcomes, '']);
  };

  const removeOutcomeInput = (index: number) => {
    if (outcomes.length > 1) {
        const newOutcomes = outcomes.filter((_, i) => i !== index);
        setOutcomes(newOutcomes);
    }
  };


  const handleSaveTheme = async () => {
    if (!label || !dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please provide a label and date range for the theme.',
      });
      return;
    }
    
    const themeData = {
      userId: user.uid,
      label,
      description,
      color,
      startDate: format(dateRange.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to, 'yyyy-MM-dd'),
    };
    
    if (editingTheme) {
        await updateTheme({ ...themeData, id: editingTheme.id });
    } else {
        const newThemeId = await createTheme(themeData);
        if (newThemeId) {
            // Create tasks for each outcome
            const startDate = dateRange?.from || new Date();
            const validOutcomes = outcomes.map(o => o.trim()).filter(o => o !== '');

            for (const outcome of validOutcomes) {
                await createTask({
                    userId: user.uid,
                    label: outcome,
                    recurrence: { type: 'daily' },
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    milestoneHalf: '',
                    milestoneFull: ''
                });
            }
             if (validOutcomes.length > 0) {
                toast({
                    title: 'Tasks Created!',
                    description: `Created ${validOutcomes.length} tasks for your new theme.`,
                });
            }
        }
    }
    
    resetForm();
  };

  const handleDeleteTheme = async (themeId: string) => {
    await deleteTheme(themeId);
  }

  const handleOpenEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setIsFormOpen(true);
  }

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  }
  
  const disabledDays = existingThemes
    .filter(theme => theme.id !== editingTheme?.id) // Exclude current editing theme from disabled dates
    .map(theme => ({
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
            resetForm();
        }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTheme ? "Edit Theme" : "Manage Themes"}</DialogTitle>
          <DialogDescription>
            {isFormOpen
              ? (editingTheme ? 'Edit your existing journal theme.' : 'Create a new journal theme.')
              : 'Create, view, and manage your journal themes.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isFormOpen ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Theme
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
             {!editingTheme && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Ideal Outcomes
                </Label>
                <div className="col-span-3 space-y-2">
                  {outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={outcome}
                        onChange={(e) => handleOutcomeChange(index, e.target.value)}
                        placeholder={`Outcome #${index + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeOutcomeInput(index)} disabled={outcomes.length <= 1}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOutcomeInput}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Outcome
                  </Button>
                </div>
              </div>
            )}
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
                <SketchPicker color={color} onChange={(c) => setColor(c.hex)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <Button onClick={handleOpenCreate} className="w-full">Create New Theme</Button>
            <h3 className="font-semibold pt-4">Existing Themes</h3>
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
                           <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(theme)}>
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
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No themes created yet.</p>
                )}
            </div>
          </div>
        )}

        <DialogFooter>
          {isFormOpen && (
            <>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveTheme}>{editingTheme ? 'Save Changes' : 'Save Theme'}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
