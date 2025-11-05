
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { TimeEntry } from "@/api/entities";
import { Task } from "@/api/entities";
import { Project } from "@/api/entities";
import { Client } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, Search, Plus, Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import TimeEntryList from "../entries/TimeEntryList";
import TimeEntryForm from "../entries/TimeEntryForm";
import ManualTimeEntry from "../entries/ManualTimeEntry"; // Import the new component
import { applyTimeRounding } from "@/components/lib/rounding";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function TimeEntriesTab() {
  const { selectedClientId, clients } = useClient();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBillable, setFilterBillable] = useState("all");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // State for export functionality
  const [exportStartDate, setExportStartDate] = useState(subDays(new Date(), 30));
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const enrichEntriesWithDetails = useCallback(async (entriesToEnrich) => {
    // Use Promise.all for parallel fetching but limit data
    const [tasksData, projectsData, clientsData] = await Promise.all([
      Task.list('-created_date', 200),
      Project.list('-created_date', 200), 
      Client.list('name', 100)
    ]);

    // Create maps for efficient lookup
    const taskMap = new Map(tasksData.map(t => [t.id, t]));
    const projectMap = new Map(projectsData.map(p => [p.id, p]));
    const clientMap = new Map(clientsData.map(c => [c.id, c]));

    return entriesToEnrich.map(entry => {
      let task = null;
      let project = null;
      let client = null;
      let entryType = entry.entry_type; // Preserve existing type from DB

      if (entry.task_id) {
        task = taskMap.get(entry.task_id);
        if (task) {
          project = projectMap.get(task.project_id);
          if (project) {
            client = clientMap.get(project.client_id);
            // Explicitly set entry_type if it has task/project linkage, overriding previous
            entryType = "project_task"; 
          }
        }
      } else if (entry.client_id) {
        // For non-project entries, they might have a direct client_id
        client = clientMap.get(entry.client_id);
        // If no task_id but has client_id, and entryType isn't already project_task
        if (!entryType || entryType === "project_task") { // Guard against incorrect overrides
            entryType = "non_project_task";
        }
      }
      
      // Fallback for entries with neither task_id nor client_id, or if type isn't set
      if (!entryType) {
        entryType = "non_project_task"; // A safe default
      }

      return {
        ...entry,
        task,
        project,
        client,
        entry_type: entryType // Ensure entry_type is always present and correct for filtering
      };
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedClientId) return;
    
    setLoading(true);
    try {
      // Limit initial fetch and add pagination potential
      const entryData = await TimeEntry.filter({ is_running: false }, "-start_time", 50);
      
      const enrichedEntries = await enrichEntriesWithDetails(entryData);
      
      // Filter entries to only show those for the selected client
      const clientFilteredEntries = enrichedEntries.filter(entry => {
        // For project tasks, check if the project belongs to the selected client
        if (entry.entry_type === "project_task" && entry.project) {
          return entry.project.client_id === selectedClientId;
        }
        // For non-project entries, check the client_id directly
        if (entry.entry_type !== "project_task") {
          return entry.client_id === selectedClientId;
        }
        return false;
      });
      
      setEntries(clientFilteredEntries);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }, [selectedClientId, enrichEntriesWithDetails]);

  const applyFilters = useCallback((searchTermParam = '', billableFilterParam = 'all') => {
    let filtered = [...entries];

    if (searchTermParam) {
      const lowerSearchTerm = searchTermParam.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.task?.name?.toLowerCase().includes(lowerSearchTerm) ||
        entry.project?.name?.toLowerCase().includes(lowerSearchTerm) ||
        entry.client?.name?.toLowerCase().includes(lowerSearchTerm) ||
        entry.title?.toLowerCase().includes(lowerSearchTerm) ||
        entry.description?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (billableFilterParam !== "all") {
      filtered = filtered.filter(entry => entry.billable === (billableFilterParam === "billable"));
    }

    setFilteredEntries(filtered);
  }, [entries]);

  // Debounced search to improve performance
  const debouncedSearch = useCallback((term, billable) => {
    const timeoutId = setTimeout(() => {
      applyFilters(term, billable);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [applyFilters]);

  useEffect(() => {
    if (selectedClientId) {
      loadData();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    const cleanup = debouncedSearch(searchTerm, filterBillable);
    return cleanup;
  }, [searchTerm, filterBillable, debouncedSearch]);

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDuplicateEntry = (entry) => {
    const duplicateEntry = {
      ...entry,
      id: undefined,
      created_date: undefined,
      updated_date: undefined,
      created_by: undefined,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      is_running: false
    };
    
    setEditingEntry(duplicateEntry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await TimeEntry.delete(entryId);
      loadData();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleSaveEntry = async (entryData, originalEntry) => {
    try {
      if (originalEntry && originalEntry.id) {
        await TimeEntry.update(originalEntry.id, entryData);
      } else {
        if (entryData.entry_type !== "project_task") {
          entryData.client_id = selectedClientId;
        }
        await TimeEntry.create(entryData);
      }
      setShowEntryForm(false);
      setEditingEntry(null);
      loadData();
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleExport = async (formatType) => {
    if (!formatType) return;
    setIsExporting(true);
    try {
      // Fetch a broader range of entries for export, not just the currently displayed 50
      const allTimeEntries = await TimeEntry.list('-start_time', 5000); 
      const enriched = await enrichEntriesWithDetails(allTimeEntries);

      const dataToExport = enriched.filter(entry => {
        const entryDate = new Date(entry.start_time);
        // Ensure the entry belongs to the currently selected client
        const clientMatch = entry.project ? entry.project.client_id === selectedClientId : entry.client_id === selectedClientId;
        return clientMatch && entryDate >= startOfDay(exportStartDate) && entryDate <= endOfDay(exportEndDate);
      });

      if (dataToExport.length === 0) {
        alert("No entries found in the selected date range for this client to export.");
        setIsExporting(false);
        return;
      }

      let fileContent = '';
      const fileExtension = formatType;
      const mimeType = formatType === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';

      const escapeCsvField = (field) => `"${String(field || '').replace(/"/g, '""')}"`;

      if (formatType === 'csv') {
        const header = ['Date', 'Client', 'Project', 'Task/Title', 'Description', 'Duration (Hours)', 'Billable'];
        const rows = dataToExport.map(e => [
          format(new Date(e.start_time), 'yyyy-MM-dd'),
          escapeCsvField(e.client?.name),
          escapeCsvField(e.project?.name),
          escapeCsvField(e.task?.name || e.title),
          escapeCsvField(e.description),
          (e.duration_minutes / 60).toFixed(2),
          e.billable ? 'Yes' : 'No'
        ].join(','));
        fileContent = [header.join(','), ...rows].join('\n');
      } else { // txt
        fileContent = dataToExport.map(e => `
----------------------------------------
Date: ${format(new Date(e.start_time), 'PPP')}
Client: ${e.client?.name || 'N/A'}
Project: ${e.project?.name || 'N/A'}
Task/Title: ${e.task?.name || e.title || 'N/A'}
Duration: ${(e.duration_minutes / 60).toFixed(2)} hours
Billable: ${e.billable ? 'Yes' : 'No'}
Description: ${e.description || 'No description.'}
----------------------------------------
`).join('');
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `time-entries-${selectedClient?.name?.toLowerCase()?.replace(/\s/g, '_') || 'export'}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      alert("An error occurred during the export process: " + error.message);
    } finally {
      setIsExporting(false);
      setIsExportPopoverOpen(false);
      setExportFormat(null);
    }
  };
  
  const stats = useMemo(() => {
    if (!selectedClient || !filteredEntries) {
      return { totalHours: 0, billableHours: 0, utilization: 0 };
    }

    let totalMinutes = 0;
    let billableMinutes = 0;

    filteredEntries.forEach(entry => {
      const rawMinutes = entry.duration_minutes || 0;
      totalMinutes += rawMinutes;
      if (entry.billable) {
        const roundedMinutes = applyTimeRounding(rawMinutes, selectedClient);
        billableMinutes += roundedMinutes;
      }
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const billableHours = Math.round((billableMinutes / 60) * 10) / 10;

    return {
      totalHours,
      billableHours,
      utilization: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
    };
  }, [filteredEntries, selectedClient]);


  if (!selectedClientId) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Time Entries</h1>
            <p className="text-slate-600 mt-1">View and manage your time tracking history</p>
          </div>
        </div>
        <div className="text-center py-20 text-slate-500">
          <Clock className="mx-auto h-12 w-12 mb-4 text-slate-400" />
          <p className="text-xl font-semibold">No Client Selected</p>
          <p className="mt-2">Please select a client from the sidebar to view their time entries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Time Entries</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">View and manage your time tracking history</p>
        </div>
      </div>
      
      {/* Full width time entry card */}
      <ManualTimeEntry onEntryAdded={loadData} />
      
      {/* Stats cards below in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-900">{stats.totalHours}h</div>
                <p className="text-xs text-slate-600">Total time tracked for this client.</p>
            </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Billable Hours</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-emerald-900">{stats.billableHours}h</div>
                <p className="text-xs text-slate-600">Includes time rounding rules.</p>
            </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Utilization</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-orange-900">{stats.utilization}%</div>
                <p className="text-xs text-slate-600">Billable vs. Total hours.</p>
            </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
              Time Entries
            </CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                <Select value={filterBillable} onValueChange={setFilterBillable}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="billable">Billable</SelectItem>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                  </SelectContent>
                </Select>
                 <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
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
                                    <Label htmlFor="start-date-entries" className="text-sm font-semibold text-slate-700">Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="start-date-entries"
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
                                    <Label htmlFor="end-date-entries" className="text-sm font-semibold text-slate-700">End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="end-date-entries"
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
                                        <RadioGroupItem value="csv" id="csv-entries" />
                                        <Label htmlFor="csv-entries">CSV</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="txt" id="txt-entries" />
                                        <Label htmlFor="txt-entries">TXT</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Button
                                className="w-full h-11 mt-4"
                                disabled={!exportFormat || isExporting}
                                onClick={() => handleExport(exportFormat)}
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Download
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="w-full overflow-hidden">
          <TimeEntryList
            entries={filteredEntries}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onDuplicateEntry={handleDuplicateEntry}
            loading={loading}
          />
        </CardContent>
      </Card>

      {showEntryForm && (
        <TimeEntryForm
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => {
            setShowEntryForm(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
