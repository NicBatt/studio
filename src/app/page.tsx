"use client";

import { useState, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { NoteList } from '@/components/note-list';
import { NoteEditor } from '@/components/note-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/user-profile';
import { useAuth } from '@/hooks/use-auth';

const LOCAL_STORAGE_KEY_PREFIX = 'theme-journal-notes';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getLocalStorageKey = () => {
    return user ? `${LOCAL_STORAGE_KEY_PREFIX}-${user.uid}` : null;
  };
  
  // Load notes from localStorage on initial client render or when user changes
  useEffect(() => {
    if (authLoading) return;
    setIsLoading(true);
    const storageKey = getLocalStorageKey();

    // When user logs out, clear the notes
    if (!storageKey) {
        setNotes([]);
        setActiveNoteId(null);
        setIsLoading(false);
        return;
    }

    try {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsedNotes: Note[] = JSON.parse(savedNotes);
        const sortedNotes = parsedNotes.sort((a, b) => b.lastModified - a.lastModified);
        setNotes(sortedNotes);
        if (sortedNotes.length > 0) {
          setActiveNoteId(sortedNotes[0].id);
        } else {
          setActiveNoteId(null);
        }
      } else {
        setNotes([]);
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error("Failed to load notes from local storage", error);
      setNotes([]);
      setActiveNoteId(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && !authLoading) {
      const storageKey = getLocalStorageKey();
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(notes));
        } catch (error) {
          console.error("Failed to save notes to local storage", error);
        }
      }
    }
  }, [notes, isLoading, authLoading, user]);
  
  const handleNewNote = () => {
    if (!user) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: 'New Note',
      lastModified: Date.now(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
  };
  
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    if (activeNoteId === id) {
      setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    }
  };
  
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
  };
  
  const handleUpdateNote = (id: string, content: string) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content, lastModified: Date.now() } : note
    );
    // Sort to bring the most recently modified note to the top
    setNotes(updatedNotes.sort((a, b) => b.lastModified - a.lastModified));
  };
  
  const activeNote = notes.find(note => note.id === activeNoteId) || null;

  return (
    <SidebarProvider>
      <div className="absolute top-4 right-4 z-20">
        <UserProfile />
      </div>
      <Sidebar>
        {(isLoading || authLoading) ? (
            <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : (
            <NoteList
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={handleSelectNote}
                onNewNote={handleNewNote}
                onDeleteNote={handleDeleteNote}
                disabled={!user}
            />
        )}
      </Sidebar>
      <SidebarInset>
        <NoteEditor activeNote={activeNote} onUpdateNote={handleUpdateNote} disabled={!user}/>
      </SidebarInset>
    </SidebarProvider>
  );
}
