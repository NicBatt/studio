"use client";

import { useState, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { NoteList } from '@/components/note-list';
import { NoteEditor } from '@/components/note-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/user-profile';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { encryptContent, decryptContent } from '@/lib/encryption';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from Firestore
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setNotes([]);
      setActiveNoteId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, "notes"), where("userId", "==", user.uid), orderBy("lastModified", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesData: Note[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({ 
          id: doc.id, 
          content: decryptContent(data.content, user.uid),
          lastModified: (data.lastModified as Timestamp)?.toMillis() || Date.now(),
          userId: data.userId
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
        console.error("Error loading notes from Firestore", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);
  
  const handleNewNote = async () => {
    if (!user) return;
    try {
        const encryptedContent = encryptContent('New Note', user.uid);
        const docRef = await addDoc(collection(db, "notes"), {
            content: encryptedContent,
            lastModified: serverTimestamp(),
            userId: user.uid
        });
        setActiveNoteId(docRef.id);
    } catch (error) {
        console.error("Error creating new note:", error);
    }
  };
  
  const handleDeleteNote = async (id: string) => {
    try {
        await deleteDoc(doc(db, "notes", id));
    } catch(error) {
        console.error("Error deleting note:", error);
    }
  };
  
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
  };
  
  const handleUpdateNote = async (id: string, content: string) => {
    if (!user) return;
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
