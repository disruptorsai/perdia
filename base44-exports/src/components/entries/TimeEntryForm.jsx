import React, { useState, useEffect } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Client } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Calendar as CalendarIcon, FolderOpen, CheckSquare, Clock, Edit, Building2 } from "lucide-react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";

export default function TimeEntryForm({ entry: entryToEdit, onSave, onCancel }) {
  const { selectedClientId: contextClientId } = useClient();
  const isEditing = !!entryToEdit;

  const getInitialClientId = () => {
    if (isEditing) {
      return entryToEdit.project?.client_id || entryToEdit.client_id;
    }
    return contextClientId;
  };

  const [date, setDate] = useState(isEditing ? new Date(entryToEdit.start_time) : new Date());
  const [startTime, setStartTime] = useState(isEditing ? format(new Date(entryToEdit.start_time), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(isEditing ? format(new Date(entryToEdit.end_time), "HH:mm") : "10:00");
  const [entryType, setEntryType] = useState(isEditing ? entryToEdit.entry_type : "project_task");
  
  const [formClientId, setFormClientId] = useState(getInitialClientId());
  const [selectedProjectId, setSelectedProjectId] = useState(isEditing ? entryToEdit.task?.project_id : "");
  const [selectedTaskId, setSelectedTaskId] = useState(isEditing ? entryToEdit.task_id : "");
  
  const [customTitle, setCustomTitle] = useState(isEditing ? (entryToEdit.title || "") : "");
  const [description, setDescription] = useState(isEditing ? (entryToEdit.description || "") : "");
  const [billable, setBillable] = useState(isEditing ? entryToEdit.billable : true);

  const [allClients, setAllClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    async function getClients() {
      setLoadingClients(true);
      try {
        const clientData = await Client.list("name");
        setAllClients(clientData);
        if (!formClientId && clientData.length > 0) {
          setFormClientId(clientData[0].id);
        }
      } catch (error) {
        console.error("Failed to load clients", error);
      } finally {
        setLoadingClients(false);
      }
    }
    getClients();
  }, []);

  useEffect(() => {
    if (formClientId && entryType === "project_task") {
      loadProjects();
    } else {
      setProjects([]);
    }
    if(!isEditing) {
        setSelectedProjectId("");
        setSelectedTaskId("");
    }
  }, [formClientId, entryType, isEditing]);

  useEffect(() => {
    if (selectedProjectId && entryType === "project_task") {
      loadTasks();
    } else {
      setTasks([]);
    }
    if(!isEditing){
        setSelectedTaskId("");
    }
  }, [selectedProjectId, entryType, isEditing]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const projectData = await Project.filter({ client_id: formClientId, status: "active" }, "name");
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const taskData = await Task.filter({ project_id: selectedProjectId }, "name");
      setTasks(taskData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (entryType === "project_task" && !selectedTaskId) {
      alert("Please select a project and task.");
      return;
    }
    if (entryType !== "project_task" && !customTitle.trim()) {
      alert("Please enter a title for this entry.");
      return;
    }
    if (!date || !startTime || !endTime) {
      alert("Please fill all required fields.");
      return;
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const startDateTime = setSeconds(setMinutes(setHours(date, startH), startM), 0);

    const [endH, endM] = endTime.split(":").map(Number);
    const endDateTime = setSeconds(setMinutes(setHours(date, endH), endM), 0);
    
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    if (durationMinutes <= 0) {
      alert("End time must be after start time.");
      return;
    }

    const entryData = {
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration_minutes: durationMinutes,
      entry_type: entryType,
      description,
      billable,
      is_running: false,
    };

    if (entryType === "project_task") {
      entryData.task_id = selectedTaskId;
      entryData.title = null;
      entryData.client_id = null;
    } else {
      entryData.title = customTitle;
      entryData.task_id = null;
      entryData.client_id = formClientId;
    }

    onSave(entryData, entryToEdit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-emerald-600" />
            {isEditing ? "Edit Time Entry" : "Add New Time Entry"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Client *
                </Label>
                <Select
                    value={formClientId || ''}
                    onValueChange={setFormClientId}
                    disabled={isEditing || loadingClients}
                >
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingClients ? (
                            <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                        ) : (
                            allClients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: client.color}} />
                                        {client.name}
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entryType" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Entry Type *
              </Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_task">Project Task</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entryType === "project_task" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-semibold text-slate-700">Project *</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loadingProjects}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProjects ? <SelectItem value="loading" disabled>Loading...</SelectItem> : projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task" className="text-sm font-semibold text-slate-700">Task *</Label>
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!selectedProjectId || loadingTasks}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingTasks ? <SelectItem value="loading" disabled>Loading...</SelectItem> : tasks.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customTitle" className="text-sm font-semibold text-slate-700">Title *</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Client sync call"
                  required
                  className="h-11"
                />
              </div>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes about the work done..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4"/> Date *
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-11 justify-start font-normal">
                                {date ? format(date, "PPP") : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Start Time *
                    </Label>
                    <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> End Time *
                    </Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="h-11" />
                </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="billable" checked={billable} onCheckedChange={setBillable} />
                <Label htmlFor="billable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    This is a billable entry
                </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                {isEditing ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}