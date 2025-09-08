
"use client";

import { useState, useEffect } from 'react';
import type { Note, Theme } from '@/lib/types';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { encryptContent } from '@/lib/encryption';
import { NoteEditor } from './note-editor';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { NoteListDaily } from './note-list-daily';
import { hexToRgba } from '@/lib/utils';

interface DailyNotesProps {
    selectedDate: Date;
    user: User | null;
    notes: Note[];
    activeNoteId: string | null;
    activeTheme: Theme | undefined;
    onNewNote: () => void;
    trigger?: React.ReactNode;
}

export function DailyNotes({ selectedDate, user, notes, activeNoteId, activeTheme, onNewNote, trigger }: DailyNotesProps) {
    const [isLoading, setIsLoading] = useState(false); // No longer fetching here
    
    const handleUpdateNote = async (id: string, content: string) => {
        if (!user) return;
        try {
            const encryptedContent = encryptContent(content, user.uid);
            const noteRef = doc(db, "notes", id);
            await updateDoc(noteRef, {
                content: encryptedContent,
                lastModified: serverTimestamp()
            });
        } catch (error)
        {
            console.error("Error updating note:", error);
        }
    };

    const activeNote = notes.find(note => note.id === activeNoteId) || null;

    if (isLoading) {
        return (
             <div className="p-4 h-full">
                <Skeleton className="h-full w-full" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {trigger}
                </div>
                <div className="flex-1 text-center">
                    {activeTheme && (
                        <h2 className="text-2xl font-bold font-headline text-foreground/80">Season of {activeTheme.label}</h2>
                    )}
                </div>
                <div className="w-1/4"></div>
            </header>
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h2>
            </div>
            <div className="flex-grow">
                <NoteEditor 
                    activeNote={activeNote} 
                    onUpdateNote={handleUpdateNote} 
                    disabled={!user || notes.length === 0 && !activeNote} 
                    onNewNote={onNewNote}
                    key={activeNoteId} // Re-mount editor when active note changes
                />
            </div>
        </div>
    );
}
