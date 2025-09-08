
"use client";

import { useState, useEffect } from 'react';
import type { Note, Theme, Task } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { DailyNotes } from '@/components/daily-notes';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/user-profile';
import { useAuth } from '@/hooks/use-auth';
import { db, getThemes } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { decryptContent, encryptContent } from '@/lib/encryption';
import { ThemeCalendar } from '@/components/theme-calendar';
import { Button } from '@/components/ui/button';
import { BookPlus, FilePlus, Palette } from 'lucide-react';
import { ThemeManager } from '@/components/theme-manager';
import { format, parseISO } from 'date-fns';
import { hexToRgba } from '@/lib/utils';
import { NoteListDaily } from '@/components/note-list-daily';
import { TaskManager } from '@/components/task-manager';


export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  const activeTheme = themes.find(theme => {
    const start = parseISO(theme.startDate);
    const end = parseISO(theme.endDate);
    return selectedDate >= start && selectedDate <= end;
  });

  // Load themes from Firestore
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setThemes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = getThemes(user.uid, (themesData) => {
      setThemes(themesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Load notes for the selected date
  useEffect(() => {
      if (!user) {
        setNotes([]);
        return;
      }
      const q = query(
          collection(db, "notes"),
          where("userId", "==", user.uid),
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
                  userId: data.userId,
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

  const handleNewNote = async () => {
        if (!user) return;
        try {
            const encryptedContent = encryptContent('New Note', user.uid);
            const docRef = await addDoc(collection(db, "notes"), {
                content: encryptedContent,
                lastModified: serverTimestamp(),
                userId: user.uid,
                date: formattedDate,
            });
            setActiveNoteId(docRef.id);
        } catch (error) {
            console.error("Error creating new note:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        try {
            await deleteDoc(doc(db, "notes", id));
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
            key={format(selectedDate, 'yyyy-MM-dd') + '-' + activeNoteId}
            selectedDate={selectedDate} 
            user={user}
            notes={notes}
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
