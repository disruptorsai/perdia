import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ProjectList({ 
  projects, 
  selectedProject, 
  onSelectProject, 
  onEditProject, 
  onDeleteProject, 
  loading 
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No projects yet</p>
        <p className="text-sm text-slate-400 mt-1">Create your first project for this client</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer group ${
            selectedProject?.id === project.id
              ? 'bg-emerald-50 border-emerald-200 shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => onSelectProject(project)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <Badge variant="secondary" className={`text-xs ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {project.description && (
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{project.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {project.budget_hours && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{project.budget_hours}h budget</span>
                  </div>
                )}
                
                {project.budget_amount && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>${project.budget_amount}</span>
                  </div>
                )}
                
                {project.end_date && (
                  <span>Due {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(project);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this project?')) {
                    onDeleteProject(project.id);
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}