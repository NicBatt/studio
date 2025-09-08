
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Note } from '@/lib/types';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { encryptContent, decryptContent } from '@/lib/encryption';
import { format } from 'date-fns';
import { NoteEditor } from './note-editor';
import { NoteList } from './note-list-daily';
import { Skeleton } from './ui/skeleton';

interface DailyNotesProps {
    selectedDate: Date;
    user: User;
}

export function DailyNotes({ selectedDate, user }: DailyNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        setIsLoading(true);
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
            setIsLoading(false);
        }, (error) => {
            console.error("Error loading daily notes:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [formattedDate, user.uid, activeNoteId]);

    const handleNewNote = async () => {
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
            // If the deleted note was the active one, reset active note
            if (activeNoteId === id) {
                 const remainingNotes = notes.filter(n => n.id !== id);
                 setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const handleUpdateNote = async (id: string, content: string) => {
        try {
            const encryptedContent = encryptContent(content, user.uid);
            const noteRef = doc(db, "notes", id);
            await updateDoc(noteRef, {
                content: encryptedContent,
                lastModified: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating note:", error);
        }
    };

    const activeNote = notes.find(note => note.id === activeNoteId) || null;

    if (isLoading) {
        return (
             <div className="flex h-full">
                <div className="w-1/3 border-r p-4 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
                <div className="w-2/3 p-4">
                    <Skeleton className="h-full w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full">
            <div className="w-1/3 border-r overflow-y-auto">
                <NoteList
                    notes={notes}
                    activeNoteId={activeNoteId}
                    onSelectNote={setActiveNoteId}
                    onNewNote={handleNewNote}
                    onDeleteNote={handleDeleteNote}
                    selectedDate={selectedDate}
                />
            </div>
            <div className="w-2/3">
                <NoteEditor 
                    activeNote={activeNote} 
                    onUpdateNote={handleUpdateNote} 
                    disabled={notes.length === 0} 
                    onNewNote={handleNewNote}
                />
            </div>
        </div>
    );
}
