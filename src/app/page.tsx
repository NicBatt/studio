"use client";

import { useState, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { NoteList } from '@/components/note-list';
import { NoteEditor } from '@/components/note-editor';
import { Skeleton } from '@/components/ui/skeleton';

const LOCAL_STORAGE_KEY = 'theme-journal-notes';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from localStorage on initial client render
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedNotes) {
        const parsedNotes: Note[] = JSON.parse(savedNotes);
        setNotes(parsedNotes.sort((a, b) => b.lastModified - a.lastModified));
        if (parsedNotes.length > 0) {
          setActiveNoteId(parsedNotes[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load notes from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
      } catch (error) {
        console.error("Failed to save notes to local storage", error);
      }
    }
  }, [notes, isLoading]);
  
  const handleNewNote = () => {
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
      <Sidebar>
        {isLoading ? (
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
            />
        )}
      </Sidebar>
      <SidebarInset>
        <NoteEditor activeNote={activeNote} onUpdateNote={handleUpdateNote} />
      </SidebarInset>
    </SidebarProvider>
  );
}
