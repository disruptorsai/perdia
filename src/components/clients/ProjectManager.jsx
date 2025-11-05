import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";
import TaskManager from "./TaskManager";

export default function ProjectManager({ clientId, client }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [clientId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectData = await Project.filter({ client_id: clientId }, "-created_date");
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
    setLoading(false);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        await Project.create({ ...projectData, client_id: clientId });
      }
      
      setShowProjectForm(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await Project.delete(projectId);
      loadProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                Projects for {client.name}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Manage projects and tasks for this client
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingProject(null);
                setShowProjectForm(true);
              }}
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectList
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            loading={loading}
          />
        </CardContent>
      </Card>

      {selectedProject && (
        <TaskManager projectId={selectedProject.id} project={selectedProject} />
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleSaveProject}
          onCancel={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}