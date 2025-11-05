import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { CheckSquare } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-200' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-200' },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-200' },
];

export default function TaskBoard({ tasks, users, onEditTask, onDeleteTask, onTaskStatusChange }) {
  const usersMap = useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    onTaskStatusChange(draggableId, destination.droppableId);
  };
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No tasks yet</p>
        <p className="text-sm text-slate-400 mt-1">Add tasks to see them on the board.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.id);
          return (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-3 rounded-lg bg-slate-100/70 transition-colors min-h-[200px] ${
                    snapshot.isDraggingOver ? 'bg-slate-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-slate-800 uppercase text-sm tracking-wider">{column.title}</h3>
                    <span className="text-sm text-slate-500 bg-slate-200 rounded-full px-2 py-0.5">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.map((task, index) => {
                      const assignedUsers = (task.assigned_emails || [])
                        .map(email => usersMap.get(email))
                        .filter(Boolean);
                        
                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging 
                                  ? 'rotate-2 scale-105 shadow-2xl z-50' 
                                  : 'hover:scale-[1.02]'
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.05)`
                                  : provided.draggableProps.style?.transform,
                              }}
                            >
                              <TaskCard
                                task={task}
                                assignedUsers={assignedUsers}
                                onEditTask={onEditTask}
                                onDeleteTask={onDeleteTask}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}