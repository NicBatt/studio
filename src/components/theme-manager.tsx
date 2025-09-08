
"use client";
import { useState, useEffect, useRef } from 'react';
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
import { Calendar as CalendarIcon, Trash2, Pencil, Upload, Loader2 } from 'lucide-react';
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
import { extractThemeFromImage } from '@/ai/flows/extract-theme-flow';
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
  const [color, setColor] = useState('#f44336');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    }
  }, [editingTheme]);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setColor('#f44336');
    setDateRange(defaultDateRange);
    setEditingTheme(null);
    setIsFormOpen(false);
  };

  const handleSaveTheme = async () => {
    if (!label || !dateRange?.from || !dateRange?.to) {
      alert('Please fill in all required fields.');
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
        await createTheme(themeData);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const photoDataUri = reader.result as string;
            const result = await extractThemeFromImage({ photoDataUri });
            
            setLabel(result.theme);
            setDescription(result.description);
            
            // Create tasks for each outcome
            const startDate = dateRange?.from || new Date();
            for (const outcome of result.outcomes) {
                await createTask({
                    userId: user.uid,
                    label: outcome,
                    recurrence: { type: 'daily' },
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    milestoneHalf: '',
                    milestoneFull: ''
                });
            }

            toast({
                title: 'Theme Extracted!',
                description: 'The theme and ideal outcomes have been populated.',
            });
            setIsFormOpen(true);
        };
    } catch (error) {
        console.error('Error extracting theme from image:', error);
        toast({
            variant: 'destructive',
            title: 'Extraction Failed',
            description: 'Could not extract theme from the uploaded image.',
        });
    } finally {
        setIsExtracting(false);
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };
  
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
                <SketchPicker color={color} onChange={(c) => setColor(c.hex)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
            <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
            >
              {isExtracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Worksheet
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>
            <Button onClick={handleOpenCreate} className="w-full">Create New Theme Manually</Button>
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
              <Button onClick={handleSaveTheme}>Save Theme</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
