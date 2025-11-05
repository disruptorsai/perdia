import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare } from "lucide-react";
import TaskCard from "./TaskCard";

export default function TaskList({ tasks, users = [], onEditTask, onDeleteTask, loading }) {
  const usersMap = useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="p-3 border rounded-lg bg-white">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No tasks found</p>
        <p className="text-sm text-slate-400 mt-1">There are no tasks matching the current filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const assignedUsers = (task.assigned_emails || [])
          .map(email => usersMap.get(email))
          .filter(Boolean);
        
        return (
          <TaskCard
            key={task.id}
            task={task}
            assignedUsers={assignedUsers}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        );
      })}
    </div>
  );
}