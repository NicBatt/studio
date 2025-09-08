"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, Download, Code } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

type NoteEditorProps = {
  activeNote: Note | null;
  onUpdateNote: (id: string, content: string) => void;
  disabled?: boolean;
};

export function NoteEditor({ activeNote, onUpdateNote, disabled = false }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
      setIsPreview(false);
    } else {
      setContent('');
    }
  }, [activeNote]);

  const handleSave = () => {
    if (!activeNote || disabled) return;
    onUpdateNote(activeNote.id, content);
    toast({
      title: "Note Saved!",
      description: "Your note has been saved successfully.",
    });
  };

  const handleExport = () => {
    if (!activeNote || disabled) return;
    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const title = content.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Untitled Note';
        link.download = `${title}.txt`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Export failed",
            description: "There was an error exporting your note.",
        });
    }
  };
  
  const noteTitle = useMemo(() => {
    if (!activeNote) return "";
    return content.split('\n')[0].trim() || 'Untitled Note';
  }, [activeNote, content]);

  if (disabled || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-fade-in">
        <h2 className="text-2xl font-headline mb-2">Welcome to Theme Journal</h2>
        <p>Please sign in to create and edit notes.</p>
      </div>
    );
  }
  
  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-fade-in">
        <h2 className="text-2xl font-headline mb-2">Select a note</h2>
        <p>Select a note from the sidebar or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card animate-fade-in relative">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <h1 className="text-xl font-headline truncate pr-4">{noteTitle}</h1>
      </header>
      <main className="flex-grow overflow-auto">
        {isPreview ? (
          <div className="p-6 break-words whitespace-pre-wrap font-body leading-relaxed">
            {content}
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="w-full h-full p-6 text-base resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            aria-label="Note content"
            disabled={disabled}
          />
        )}
      </main>
       <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save note" disabled={disabled} className="bg-card hover:bg-accent rounded-full shadow-lg h-12 w-12">
            <Save />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsPreview(!isPreview)} aria-label={isPreview ? "Show editor" : "Show preview"} disabled={disabled} className="bg-card hover:bg-accent rounded-full shadow-lg h-12 w-12">
            {isPreview ? <Code /> : <Eye />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} aria-label="Export note" disabled={disabled} className="bg-card hover:bg-accent rounded-full shadow-lg h-12 w-12">
            <Download />
          </Button>
        </div>
    </div>
  );
}
