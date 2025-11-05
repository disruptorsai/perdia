import React from 'react';
import NoteCard from './NoteCard';
import { ClipboardEdit } from 'lucide-react';

export default function NoteList({ notes, projects }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
        <ClipboardEdit className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700">No Notes Yet</h3>
        <p className="text-slate-500 mt-2">Create your first meeting note to get started.</p>
      </div>
    );
  }

  const projectMap = new Map(projects.map(p => [p.id, p]));

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <NoteCard 
          key={note.id} 
          note={note}
          project={note.project_id ? projectMap.get(note.project_id) : null}
        />
      ))}
    </div>
  );
}