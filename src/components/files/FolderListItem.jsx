import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Folder } from 'lucide-react';

export default function FolderListItem({ folder, onClick }) {
  return (
    <Droppable droppableId={`folder-${folder.path}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={onClick}
        >
          <div 
            className={`grid grid-cols-12 gap-4 p-3 rounded-lg transition-colors cursor-pointer ${
              snapshot.isDraggingOver ? 'bg-emerald-50' : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <Folder className={`w-5 h-5 flex-shrink-0 ${snapshot.isDraggingOver ? 'text-emerald-600' : 'text-slate-500'}`} />
              <p className="font-medium text-slate-900 truncate" title={folder.name}>
                {folder.name}
              </p>
            </div>
            <div className="col-span-7 text-sm text-slate-500">
              Folder
            </div>
          </div>
          <div style={{ display: 'none' }}>{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}