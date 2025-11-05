import React, { useState, useEffect, useRef } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, CheckSquare, Clock, Users } from "lucide-react";

export default function ProjectSelector({ onTaskSelect, selectedTask, description, onDescriptionChange }) {
  const { selectedClientId } = useClient();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [entryType, setEntryType] = useState("project_task");
  const [customTitle, setCustomTitle] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (selectedClientId && entryType === "project_task") {
      const timer = setTimeout(() => {
        loadProjects();
      }, 200);
      return () => clearTimeout(timer);
    }
    setSelectedProject("");
    setSelectedTaskId("");
  }, [selectedClientId, entryType]);

  useEffect(() => {
    if (selectedProject && entryType === "project_task") {
      const timer = setTimeout(() => {
        loadTasks();
      }, 200);
      return () => clearTimeout(timer);
      setSelectedTaskId("");
    }
  }, [selectedProject, entryType]);

  useEffect(() => {
    if (entryType === "project_task") {
      if (selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId);
        onTaskSelect(task);
      } else {
        onTaskSelect(null);
      }
    } else {
      // For non-project entries, create a mock task object with the custom info
      if (customTitle.trim()) {
        onTaskSelect({
          id: null,
          name: customTitle,
          entry_type: entryType,
          is_non_project: true
        });
      } else {
        onTaskSelect(null);
      }
    }
  }, [selectedTaskId, tasks, entryType, customTitle]);

  const loadProjects = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingProjects(true);
    
    try {
      const projectData = await Project.filter({ 
        client_id: selectedClientId,
        status: "active" 
      }, "name");
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoadingProjects(false);
      loadingRef.current = false;
    }
  };

  const loadTasks = async () => {
    try {
      const taskData = await Task.filter({ project_id: selectedProject }, "name");
      setTasks(taskData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  if (!selectedClientId) {
    return (
      <Card className="bg-slate-50/50 border-slate-200">
        <CardContent className="pt-6 text-center text-slate-500">
          Please select a client from the sidebar to start tracking time.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-50/50 border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">What are you working on?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Entry Type
          </Label>
          <Select value={entryType} onValueChange={setEntryType}>
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

        {entryType === "project_task" ? (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Project
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loadingProjects}>
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

            {selectedProject && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Task
                </Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Choose a task" />
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
              {entryType === "meeting" ? "Meeting Title" : 
               entryType === "admin" ? "Admin Task" : "Activity Title"}
            </Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={
                entryType === "meeting" ? "e.g., Client Strategy Meeting" :
                entryType === "admin" ? "e.g., Email Management" :
                "e.g., Research and Development"
              }
              className="bg-white border-slate-300"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Description (Optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="What are you working on?"
            className="bg-white border-slate-300 min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );
}