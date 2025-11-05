
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, Briefcase, FileText } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient } from "@/components/contexts/ClientContext";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function RecentEntries({ entries, onRefresh, loading }) {
  const { users } = useClient();
  const usersMap = React.useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

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

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 w-full min-h-[300px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-slate-600" />
            Recent Entries
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="hover:bg-slate-100"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent entries for this client</p>
            <p className="text-sm text-slate-400 mt-1">Start a timer to see entries here</p>
          </div>
        ) : (
          entries.map((entry) => {
            const { title, icon } = getEntryTitleAndIcon(entry);
            const entryUser = usersMap.get(entry.created_by);
            return (
              <div key={entry.id} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {icon}
                      <h4 className="font-medium text-slate-900 text-sm">{title}</h4>
                    </div>
                    <div className="text-xs text-slate-500 pl-6 break-words">
                      <span className="font-semibold">{entry.client?.name || 'No Client'}</span>
                      {entry.project && ` / ${entry.project.name}`}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-800 text-sm">
                    {formatDuration(entry.duration_minutes)}
                  </div>
                </div>
                {entry.description && (
                  <p className="text-xs text-slate-500 italic mt-1 pl-6 line-clamp-2">{entry.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={entryUser} className="w-6 h-6 text-xs" />
                    <span className="text-xs text-slate-500 font-medium">{entryUser?.full_name || '...'}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(entry.start_time), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
