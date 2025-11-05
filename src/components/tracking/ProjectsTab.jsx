
import React, { useState, useEffect } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { Project } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import ProjectList from "../clients/ProjectList";
import ProjectForm from "../clients/ProjectForm";
import TaskManager from "../clients/TaskManager";

export default function ProjectsTab() {
  const { selectedClientId, clients } = useClient();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  useEffect(() => {
    if (selectedClientId) {
      loadProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
    setSelectedProject(null); // Reset selected project when client changes
  }, [selectedClientId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectData = await Project.filter({ client_id: selectedClientId }, "-created_date");
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
        await Project.create({ ...projectData, client_id: selectedClientId });
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
  
  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Client Selected</h3>
            <p className="text-slate-500">Please select a client from the sidebar to view projects.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects for {selectedClient?.name}</h1>
          <p className="text-slate-600 mt-1">Manage projects and tasks for the selected client</p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null);
            setShowProjectForm(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                Projects
              </CardTitle>
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
        </div>

        <div className="lg:col-span-2">
          {selectedProject ? (
            <TaskManager projectId={selectedProject.id} project={selectedProject} />
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="py-24">
                <div className="text-center">
                  <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Project</h3>
                  <p className="text-slate-500">Choose a project from the list to view its tasks.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
