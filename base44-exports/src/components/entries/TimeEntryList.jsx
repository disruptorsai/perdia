import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Edit, Trash2, Copy, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient } from "@/components/contexts/ClientContext";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function TimeEntryList({ entries, onEditEntry, onDeleteEntry, onDuplicateEntry, loading }) {
  const { users } = useClient();
  const usersMap = useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

  const formatDuration = (minutes) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEntryTitleAndIcon = (entry) => {
    if (entry.task) {
      return { title: entry.task.name, icon: <Briefcase className="w-4 h-4 text-slate-500" /> };
    }
    if (entry.title) {
      return { title: entry.title, icon: <FileText className="w-4 h-4 text-slate-500" /> };
    }
    return { title: 'General Work', icon: <FileText className="w-4 h-4 text-slate-500" /> };
  };

  const getClientColor = (client) => {
    if (!client || !client.color) return '#a1a1aa';
    return client.color;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex items-start gap-4">
              <Skeleton className="w-1.5 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-semibold">No time entries found</p>
        <p>Start tracking time to see your entries here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const { title, icon } = getEntryTitleAndIcon(entry);
        const entryUser = usersMap.get(entry.created_by);
        return (
          <div key={entry.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 group">
            <div className="flex items-start gap-4">
              <div 
                className="w-1.5 h-auto self-stretch rounded-full"
                style={{ backgroundColor: getClientColor(entry.client) }}
              />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {icon}
                      <h4 className="font-medium text-slate-900 break-words">{title}</h4>
                      {entry.billable && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          Billable
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 pl-6 break-words">
                      <span className="font-medium">{entry.client?.name || 'No Client'}</span>
                      {entry.project && ` / ${entry.project.name}`}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 flex-shrink-0">
                    {formatDuration(entry.duration_minutes)}
                  </div>
                </div>
                {entry.description && (
                  <p className="text-sm text-slate-500 italic pl-6 line-clamp-3">{entry.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <UserAvatar user={entryUser} className="w-6 h-6 text-xs" />
                <span className="text-xs text-slate-500 font-medium">{entryUser?.full_name || '...'}</span>
              </div>
              <div className="flex items-center justify-end gap-4">
                <div className="text-xs text-slate-500">
                  {format(new Date(entry.start_time), 'MMM d, h:mm a')}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditEntry(entry)}>
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicateEntry(entry)}>
                    <Copy className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this time entry?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}