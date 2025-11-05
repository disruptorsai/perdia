import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function NoteCard({ note, project }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-slate-800">{note.title}</CardTitle>
          <time className="text-xs text-slate-500 font-medium whitespace-nowrap pl-4">
            {format(new Date(note.created_date), 'MMM d, yyyy')}
          </time>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm whitespace-pre-wrap line-clamp-3">
          {note.content || "No content."}
        </p>
      </CardContent>
      {project && (
        <CardFooter>
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
            <FolderOpen className="w-3 h-3" />
            <span className="font-medium">{project.name}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}