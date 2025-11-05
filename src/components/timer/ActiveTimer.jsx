import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FolderOpen, CheckSquare, Clock } from "lucide-react";

export default function ActiveTimer({ activeEntry, elapsedSeconds }) {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // The activeEntry prop is now expected to be fully enriched with client, project, and task details.
  // No more local data fetching is needed.
  if (!activeEntry) return null;

  const { client, project, task } = activeEntry;

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-xl shadow-emerald-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <Clock className="w-5 h-5" />
          Currently Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-2xl font-bold text-emerald-700">
            {formatTime(elapsedSeconds)}
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
            Running
          </Badge>
        </div>

        <div className="space-y-3">
          {client && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-900">{client.name}</span>
            </div>
          )}
          
          {project && (
            <div className="flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700">{project.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <CheckSquare className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{task?.name || activeEntry.title}</span>
          </div>
        </div>

        {activeEntry.description && (
          <div className="mt-3 p-3 bg-white/70 rounded-lg">
            <p className="text-sm text-slate-700 italic">{activeEntry.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}