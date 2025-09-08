
"use client";

import type { Note } from '@/lib/types';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { FilePlus, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Timestamp } from 'firebase/firestore';

type NoteListProps = {
  notes: Note[];
  activeNoteId: string | null;
  selectedDate: Date;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
};

export function NoteList({ notes, activeNoteId, selectedDate, onSelectNote, onNewNote, onDeleteNote }: NoteListProps) {
    
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={onNewNote} aria-label="New Note">
                <FilePlus />
            </Button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto">
        {notes.length > 0 ? (
            <SidebarMenu>
            {notes.map(note => {
              const title = note.content.split('\n')[0].trim() || 'Untitled Note';
              const lastModifiedDate = typeof note.lastModified === 'number' 
                ? new Date(note.lastModified) 
                : (note.lastModified as Timestamp)?.toDate();
              
              return (
                <SidebarMenuItem key={note.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectNote(note.id)}
                    isActive={note.id === activeNoteId}
                    className="h-auto py-2 flex-col items-start"
                  >
                    <span className="font-semibold text-sm truncate w-full">{title}</span>
                    <span className="text-xs text-muted-foreground">
                      {lastModifiedDate ? formatDistanceToNow(lastModifiedDate, { addSuffix: true }) : 'Just now'}
                    </span>
                  </SidebarMenuButton>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <SidebarMenuAction showOnHover>
                            <Trash2 className="size-4" />
                        </SidebarMenuAction>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your note.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteNote(note.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SidebarMenuItem>
              );
            })}
            </SidebarMenu>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notes for this day.
            </div>
          )}
      </div>
    </div>
  );
}
