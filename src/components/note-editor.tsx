"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, Download, Code } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type NoteEditorProps = {
  activeNote: Note | null;
  onUpdateNote: (id: string, content: string) => void;
};

export function NoteEditor({ activeNote, onUpdateNote }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
      setIsPreview(false);
    } else {
      setContent('');
    }
  }, [activeNote]);

  const handleSave = () => {
    if (!activeNote) return;
    onUpdateNote(activeNote.id, content);
  };

  const handleExport = () => {
    if (!activeNote) return;
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

  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-fade-in">
        <h2 className="text-2xl font-headline mb-2">Welcome to Theme Journal</h2>
        <p>Select a note from the sidebar or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card animate-fade-in">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <h1 className="text-xl font-headline truncate pr-4">{noteTitle}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save note">
            <Save />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsPreview(!isPreview)} aria-label={isPreview ? "Show editor" : "Show preview"}>
            {isPreview ? <Code /> : <Eye />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} aria-label="Export note">
            <Download />
          </Button>
        </div>
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
          />
        )}
      </main>
    </div>
  );
}
