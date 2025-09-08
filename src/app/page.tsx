"use client";

import { useState, useEffect } from 'react';
import type { Note, Theme } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DailyNotes } from '@/components/daily-notes';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/user-profile';
import { useAuth } from '@/hooks/use-auth';
import { db, getThemes } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { encryptContent, decryptContent } from '@/lib/encryption';
import { ThemeCalendar } from '@/components/theme-calendar';
import { Button } from '@/components/ui/button';
import { BookPlus } from 'lucide-react';
import { ThemeManager } from '@/components/theme-manager';
import { format } from 'date-fns';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <SidebarProvider>
      <div className="absolute top-4 right-4 z-20">
        <UserProfile />
      </div>
      <Sidebar>
        <SidebarHeader className="p-2">
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
                <SidebarContent className="p-0">
                    <ThemeCalendar 
                        themes={themes}
                        onDayClick={handleDayClick}
                        selectedDate={selectedDate}
                    />
                </SidebarContent>
                <SidebarFooter className="p-2">
                    <Button onClick={() => setIsThemeManagerOpen(true)}>
                        <BookPlus className="mr-2"/>
                        Manage Themes
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
        {user ? (
            <DailyNotes 
                key={format(selectedDate, 'yyyy-MM-dd')}
                selectedDate={selectedDate} 
                user={user} 
            />
        ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-fade-in">
                <h2 className="text-2xl font-headline mb-2">Welcome to Theme Journal</h2>
                <p>Please sign in to view and create notes.</p>
            </div>
        )}
      </SidebarInset>
      {user && <ThemeManager isOpen={isThemeManagerOpen} onOpenChange={setIsThemeManagerOpen} user={user} existingThemes={themes} />}
    </SidebarProvider>
  );
}
