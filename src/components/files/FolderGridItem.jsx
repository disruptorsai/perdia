import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Folder } from 'lucide-react';

export default function FolderGridItem({ folder, onClick }) {
  return (
    <Droppable droppableId={`folder-${folder.path}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={onClick}
          className="h-full"
        >
          <Card 
            className={`group hover:shadow-lg transition-all duration-200 cursor-pointer h-full border-2 ${
              snapshot.isDraggingOver ? 'border-emerald-400 bg-emerald-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Folder className={`w-12 h-12 mb-4 ${snapshot.isDraggingOver ? 'text-emerald-600' : 'text-slate-500'}`} />
              <h4 className="font-medium text-slate-900 truncate w-full" title={folder.name}>
                {folder.name}
              </h4>
            </CardContent>
          </Card>
          {/* We don't want a placeholder to appear when dragging over */}
          <div style={{ display: 'none' }}>{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}