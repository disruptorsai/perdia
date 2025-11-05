
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, Briefcase, FileText, Edit, Trash2, Copy, Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useClient } from "@/components/contexts/ClientContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function TimeBreakdown({
  entries,
  onEdit,
  onDelete,
  onDuplicate,
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  isExporting,
  onExport
}) {
  const { users } = useClient();
  const usersMap = useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

  const [exportFormat, setExportFormat] = useState(null);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);

  const handleDownload = () => {
    if (exportFormat) {
        onExport(exportFormat);
        setIsExportPopoverOpen(false);
        setExportFormat(null); // Reset format selection after export
    }
  };

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
    if (!client || !client.color) return '#a1a1aa'; // default zinc color
    return client.color;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 flex-shrink-0">
            <List className="w-5 h-5 text-emerald-600" />
            Time Entries Breakdown
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2 w-full">
             <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto h-9 text-xs px-3">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-6 space-y-4 max-w-sm">
                        <h4 className="font-medium text-lg text-slate-900 text-center">Export Time Entries</h4>
                        <div className="text-sm text-slate-500 text-center">Select date range and format.</div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date-overview" className="text-sm font-semibold text-slate-700">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="start-date-overview"
                                            variant={"outline"}
                                            className="w-full justify-start text-left font-normal h-10"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exportStartDate ? format(exportStartDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={exportStartDate}
                                            onSelect={setExportStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date-overview" className="text-sm font-semibold text-slate-700">End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="end-date-overview"
                                            variant={"outline"}
                                            className="w-full justify-start text-left font-normal h-10"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exportEndDate ? format(exportEndDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={exportEndDate}
                                            onSelect={setExportEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <Label className="text-sm font-semibold text-slate-700">Format</Label>
                            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="csv" id="csv-overview" />
                                    <Label htmlFor="csv-overview">CSV</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="txt" id="txt-overview" />
                                    <Label htmlFor="txt-overview">TXT</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button
                            className="w-full h-11 mt-4"
                            disabled={!exportFormat || isExporting}
                            onClick={handleDownload}
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Download
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No time entries found for this period.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const { title, icon } = getEntryTitleAndIcon(entry);
            const entryUser = usersMap.get(entry.created_by);
            return (
              <div
                key={entry.id}
                className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 group"
              >
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                        <Edit className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(entry)}>
                        <Copy className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this time entry?')) {
                            onDelete(entry.id);
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
          })
        )}
      </CardContent>
    </Card>
  );
}
