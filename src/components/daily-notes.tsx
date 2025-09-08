
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
            <header className="p-4 border-b flex items-center gap-4">
                {trigger}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold font-headline">{format(selectedDate, "MMMM d, yyyy")}</h1>
                    {activeTheme && (
                        <span 
                            className="font-bold text-xl px-3 py-1 rounded-full"
                            style={{ 
                                color: activeTheme.color,
                                backgroundColor: `rgba(${parseInt(activeTheme.color.slice(1, 3), 16)}, ${parseInt(activeTheme.color.slice(3, 5), 16)}, ${parseInt(activeTheme.color.slice(5, 7), 16)}, 0.1)`,
                                textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000'
                            }}
                        >
                            {activeTheme.label}
                        </span>
                    )}
                </div>
            </header>
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
