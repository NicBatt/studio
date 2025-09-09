

"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Note, Theme, Task, TaskProgressLog, TaskProgress } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { DailyNotes } from '@/components/daily-notes';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/user-profile';
import { useAuth } from '@/hooks/use-auth';
import { db, getThemes, getTasks, getTaskProgress, setTaskProgress } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { decryptContent, encryptContent } from '@/lib/encryption';
import { ThemeCalendar } from '@/components/theme-calendar';
import { Button } from '@/components/ui/button';
import { BookPlus, CalendarCheck, Palette } from 'lucide-react';
import { ThemeManager } from '@/components/theme-manager';
import { format, parseISO } from 'date-fns';
import { isTaskForDate } from '@/lib/utils';
import { NoteListDaily } from '@/components/note-list-daily';
import { TaskManager } from '@/components/task-manager';
import { WeeklyProgress } from '@/components/weekly-progress';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';


export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgressLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
  const [isProgressSheetOpen, setProgressSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  const activeTheme = useMemo(() => {
      return themes.find(theme => {
        const start = parseISO(theme.startDate);
        const end = parseISO(theme.endDate);
        return selectedDate >= start && selectedDate <= end;
      });
  }, [themes, selectedDate]);


  const todaysTasks = useMemo(() => {
    return tasks.filter(task => isTaskForDate(task, selectedDate));
  }, [tasks, selectedDate]);
  
  const progressForSelectedDate = useMemo(() => {
    if (!formattedDate) return {};
    const dailyLogs = taskProgress.filter(p => p.date === formattedDate);
    return dailyLogs.reduce((acc, log) => {
        acc[log.taskId] = log.progress;
        return acc;
    }, {} as Record<string, TaskProgress>);
  }, [taskProgress, formattedDate]);


  // Load data from Firestore
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setThemes([]);
      setTasks([]);
      setTaskProgress([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    let themesLoaded = false;
    let tasksLoaded = false;
    let progressLoaded = false;

    const checkAllDataLoaded = () => {
        if (themesLoaded && tasksLoaded && progressLoaded) {
            setIsLoading(false);
        }
    }

    const unsubscribeThemes = getThemes(user.uid, (themesData) => {
      setThemes(themesData);
      themesLoaded = true;
      checkAllDataLoaded();
    });

    const unsubscribeTasks = getTasks(user.uid, (tasksData) => {
        setTasks(tasksData);
        tasksLoaded = true;
        checkAllDataLoaded();
    });
    
    const unsubscribeProgress = getTaskProgress(user.uid, (progressData) => {
        setTaskProgress(progressData);
        progressLoaded = true;
        checkAllDataLoaded();
    });

    return () => {
        unsubscribeThemes();
        unsubscribeTasks();
        unsubscribeProgress();
    };
  }, [user, authLoading]);

  // Load notes for the selected date
  useEffect(() => {
      if (!user) {
        setNotes([]);
        return;
      }
      const q = query(
          collection(db, "users", user.uid, "notes"),
          where("date", "==", formattedDate),
          orderBy("lastModified", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const notesData: Note[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              notesData.push({
                  id: doc.id,
                  content: decryptContent(data.content, user.uid),
                  lastModified: (data.lastModified as Timestamp)?.toMillis() || Date.now(),
                  date: data.date,
              });
          });
          setNotes(notesData);
          if (notesData.length > 0) {
               if (!activeNoteId || !notesData.some(n => n.id === activeNoteId)) {
                  setActiveNoteId(notesData[0].id);
              }
          } else {
              setActiveNoteId(null);
          }
      }, (error) => {
          console.error("Error loading daily notes:", error);
      });

      return () => unsubscribe();
  }, [formattedDate, user, activeNoteId]);

  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setActiveNoteId(null);
  };
  
  const handleProgressChange = async (taskId: string, newProgress: TaskProgress) => {
    if (!user) return;
    await setTaskProgress(user.uid, formattedDate, taskId, newProgress);
  };

  const handleNewNote = async () => {
        if (!user) return;
        try {
            const encryptedContent = encryptContent('New Note', user.uid);
            const docRef = await addDoc(collection(db, "users", user.uid, "notes"), {
                content: encryptedContent,
                lastModified: serverTimestamp(),
                date: formattedDate,
            });
            setActiveNoteId(docRef.id);
        } catch (error) {
            console.error("Error creating new note:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "notes", id));
            if (activeNoteId === id) {
                 const remainingNotes = notes.filter(n => n.id !== id);
                 setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };


  return (
    <SidebarProvider>
      <div className="absolute top-4 right-4 z-20">
        <UserProfile />
      </div>
      <Sidebar>
        <SidebarHeader className="p-2 justify-center">
            <div className="flex items-center gap-2 p-2">
                <h1 className="text-2xl font-headline font-bold">Theme Journal</h1>
            </div>
        </SidebarHeader>
        {(isLoading || authLoading) ? (
            <div className="p-4 space-y-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : user ? (
            <>
                <SidebarContent className="p-0 flex flex-col">
                    <ThemeCalendar 
                        themes={themes}
                        onDayClick={handleDayClick}
                        selectedDate={selectedDate}
                    />
                </SidebarContent>
                <SidebarFooter className="p-2 flex flex-col gap-2">
                     <Button onClick={() => setIsThemeManagerOpen(true)} variant="secondary" className="w-full">
                        <Palette className="mr-2"/>
                        Manage Themes
                    </Button>
                    <Button onClick={() => setIsTaskManagerOpen(true)} variant="secondary" className="w-full">
                        <BookPlus className="mr-2"/>
                        Manage Tasks
                    </Button>
                    <Sheet open={isProgressSheetOpen} onOpenChange={setProgressSheetOpen}>
                      <SheetTrigger asChild>
                         <Button variant="secondary" className="w-full">
                            <CalendarCheck className="mr-2"/>
                            View Progress
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-4/5">
                        <WeeklyProgress allTasks={tasks} allProgressLogs={taskProgress} user={user} />
                      </SheetContent>
                    </Sheet>
                </SidebarFooter>
            </>
        ) : (
            <div className="p-4 text-center text-muted-foreground">
                Please sign in to manage themes and notes.
            </div>
        )}
      </Sidebar>
      <SidebarInset>
        <DailyNotes 
            key={formattedDate + '-' + activeNoteId}
            selectedDate={selectedDate} 
            user={user}
            notes={notes}
            tasks={todaysTasks}
            taskProgress={progressForSelectedDate}
            onProgressChange={handleProgressChange}
            activeTheme={activeTheme}
            activeNoteId={activeNoteId}
            onNewNote={handleNewNote}
            trigger={<SidebarTrigger />}
        />
      </SidebarInset>
      {user && <ThemeManager isOpen={isThemeManagerOpen} onOpenChange={setIsThemeManagerOpen} user={user} existingThemes={themes} />}
      {user && <TaskManager isOpen={isTaskManagerOpen} onOpenChange={setIsTaskManagerOpen} user={user} existingTasks={tasks} />}
    </SidebarProvider>
  );
}
