import React, { useState, useEffect } from 'react';
import { useClient } from '@/components/contexts/ClientContext';
import { Project } from '@/lib/perdia-sdk';
import { Task } from '@/lib/perdia-sdk';
import { TimeEntry } from '@/lib/perdia-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Clock, Calendar as CalendarIcon, Loader2, FolderOpen, Users, CheckSquare } from 'lucide-react';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';

export default function ManualTimeEntry({ onEntryAdded }) {
  const { selectedClientId } = useClient();
  
  const getInitialState = () => ({
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    entryType: "project_task",
    projectId: "",
    taskId: "",
    customTitle: "",
    description: "",
    billable: true,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedClientId && formData.entryType === "project_task") {
      loadProjects();
    } else {
      setProjects([]);
    }
    // Reset project/task selection when client or entry type changes
    setFormData(prev => ({ ...prev, projectId: "", taskId: "", customTitle: "" }));
  }, [selectedClientId, formData.entryType]);

  useEffect(() => {
    if (formData.projectId && formData.entryType === "project_task") {
      loadTasks(formData.projectId);
    } else {
      setTasks([]);
    }
    // Reset task selection when project changes
    setFormData(prev => ({ ...prev, taskId: "" }));
  }, [formData.projectId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const projectData = await Project.filter({ client_id: selectedClientId, status: "active" }, "name");
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
    setLoadingProjects(false);
  };

  const loadTasks = async (projectId) => {
    setLoadingTasks(true);
    try {
      const taskData = await Task.filter({ project_id: projectId }, "name");
      setTasks(taskData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
    setLoadingTasks(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.entryType === "project_task" && !formData.taskId) {
      alert("Please select a project and task.");
      return;
    }
    if (formData.entryType !== "project_task" && !formData.customTitle.trim()) {
      alert("Please enter a title for this entry.");
      return;
    }
    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const [startH, startM] = formData.startTime.split(":").map(Number);
      const startDateTime = setSeconds(setMinutes(setHours(formData.date, startH), startM), 0);

      const [endH, endM] = formData.endTime.split(":").map(Number);
      const endDateTime = setSeconds(setMinutes(setHours(formData.date, endH), endM), 0);
      
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      if (durationMinutes <= 0) {
        alert("End time must be after start time.");
        return;
      }

      const entryData = {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: durationMinutes,
        entry_type: formData.entryType,
        description: formData.description,
        billable: formData.billable,
        is_running: false,
      };

      if (formData.entryType === "project_task") {
        entryData.task_id = formData.taskId;
        entryData.title = null;
        entryData.client_id = null;
      } else {
        entryData.title = formData.customTitle;
        entryData.task_id = null;
        entryData.client_id = selectedClientId;
      }

      await TimeEntry.create(entryData);
      
      // Reset form
      setFormData(getInitialState());
      
      // Notify parent to refresh
      if (onEntryAdded) {
        onEntryAdded();
      }
      
    } catch (error) {
      console.error("Error saving time entry:", error);
      alert("Failed to save time entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedClientId) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
        <CardContent className="pt-6 text-center text-slate-500">
          Please select a client from the sidebar to add time entries.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
          <Plus className="w-5 h-5 text-emerald-600" />
          Add Time Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Entry Type
                </Label>
                <Select value={formData.entryType} onValueChange={(value) => handleInputChange("entryType", value)}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Choose entry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_task">Project Task</SelectItem>
                    <SelectItem value="meeting">Client Meeting</SelectItem>
                    <SelectItem value="admin">Administrative Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.entryType === "project_task" ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Project
                    </Label>
                    <Select 
                      value={formData.projectId} 
                      onValueChange={(value) => handleInputChange("projectId", value)} 
                      disabled={loadingProjects}
                    >
                      <SelectTrigger className="bg-white border-slate-300">
                        <SelectValue placeholder={loadingProjects ? "Loading..." : "Choose a project"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.projectId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        Task
                      </Label>
                      <Select 
                        value={formData.taskId} 
                        onValueChange={(value) => handleInputChange("taskId", value)}
                        disabled={loadingTasks}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder={loadingTasks ? "Loading..." : "Choose a task"} />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formData.entryType === "meeting" ? "Meeting Title" : 
                     formData.entryType === "admin" ? "Admin Task" : "Activity Title"}
                  </Label>
                  <Input
                    value={formData.customTitle}
                    onChange={(e) => handleInputChange("customTitle", e.target.value)}
                    placeholder={
                      formData.entryType === "meeting" ? "e.g., Client Strategy Meeting" :
                      formData.entryType === "admin" ? "e.g., Email Management" :
                      "e.g., Research and Development"
                    }
                    className="bg-white border-slate-300"
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-white border-slate-300">
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={formData.date} 
                      onSelect={(date) => handleInputChange("date", date)} 
                      initialFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="What did you work on?"
                className="bg-white border-slate-300 min-h-20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="billable" 
                  checked={formData.billable} 
                  onCheckedChange={(checked) => handleInputChange("billable", checked)} 
                />
                <Label htmlFor="billable" className="text-sm font-medium">
                  This is a billable entry
                </Label>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}