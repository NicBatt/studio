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
import { FilePlus, Trash2, BookText } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type NoteListProps = {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
};

export function NoteList({ notes, activeNoteId, onSelectNote, onNewNote, onDeleteNote }: NoteListProps) {
  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <BookText className="size-6 text-primary" />
            <h2 className="text-xl font-headline font-bold">Theme Journal</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onNewNote} aria-label="New Note">
          <FilePlus />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {notes.length > 0 ? (
            notes.map(note => {
              const title = note.content.split('\n')[0].trim() || 'Untitled Note';
              return (
                <SidebarMenuItem key={note.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectNote(note.id)}
                    isActive={note.id === activeNoteId}
                    className="h-auto py-2 flex-col items-start"
                  >
                    <span className="font-semibold text-sm truncate w-full">{title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.lastModified), { addSuffix: true })}
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
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notes yet. Create one!
            </div>
          )}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
