import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, User, FolderOpen } from "lucide-react";

export default function TaskForm({ task, users, projects, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    estimated_hours: task?.estimated_hours || "",
    status: task?.status || "todo",
    assigned_emails: Array.isArray(task?.assigned_emails) ? task.assigned_emails : (task?.assigned_emails ? [task.assigned_emails] : []),
    project_id: task?.project_id || (projects && projects.length > 0 ? projects[0].id : "")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
    };
    console.log("Saving task with assigned_emails:", dataToSave.assigned_emails);
    onSave(dataToSave);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeToggle = (userEmail, checked) => {
    setFormData(prev => ({
      ...prev,
      assigned_emails: checked 
        ? [...prev.assigned_emails, userEmail]
        : prev.assigned_emails.filter(email => email !== userEmail)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{task ? "Edit Task" : "Add New Task"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Task name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Task description..."
                rows={3}
              />
            </div>

            {projects && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project_id" className="flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" /> Project *
                </Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(value) => handleInputChange("project_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="w-3 h-3" /> Assigned To (Select Multiple)
              </Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2 bg-slate-50">
                {users && users.length > 0 ? (
                  users.map(user => (
                    <div key={user.email} className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded">
                      <Checkbox
                        id={user.email}
                        checked={formData.assigned_emails.includes(user.email)}
                        onCheckedChange={(checked) => handleAssigneeToggle(user.email, checked)}
                      />
                      <Label htmlFor={user.email} className="text-sm font-normal cursor-pointer flex-1">
                        {user.full_name} ({user.email})
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No users available</p>
                )}
              </div>
              {formData.assigned_emails.length > 0 && (
                <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                  ✓ {formData.assigned_emails.length} user{formData.assigned_emails.length !== 1 ? 's' : ''} assigned
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => handleInputChange("estimated_hours", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {task ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}