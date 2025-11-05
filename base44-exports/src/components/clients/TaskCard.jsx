import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, FolderOpen, Users } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

const getStatusColor = (status) => {
  switch (status) {
    case 'todo': return 'bg-slate-100 text-slate-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export default function TaskCard({ task, assignedUsers = [], onEditTask, onDeleteTask, isDragging = false }) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-200 group mb-2 ${
        isDragging 
          ? 'bg-white shadow-2xl border-emerald-300 cursor-grabbing' 
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm cursor-grab'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-slate-900">{task.name}</h4>
            <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 pt-1">
            {task.project && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <FolderOpen className="w-3 h-3" />
                <span>{task.project.name}</span>
              </div>
            )}
            
            {task.estimated_hours && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_hours}h estimated</span>
              </div>
            )}

            {assignedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-slate-500" />
                <div className="flex items-center -space-x-1">
                  {assignedUsers.slice(0, 3).map((user, index) => (
                    <UserAvatar 
                      key={user.email} 
                      user={user} 
                      className="w-5 h-5 text-xs border border-white" 
                      style={{ zIndex: assignedUsers.length - index }}
                    />
                  ))}
                  {assignedUsers.length > 3 && (
                    <span className="text-xs text-slate-500 ml-2">
                      +{assignedUsers.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!isDragging && (
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(task);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this task?')) {
                  onDeleteTask(task.id);
                }
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}