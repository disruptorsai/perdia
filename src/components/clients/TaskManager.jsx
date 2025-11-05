
import React, { useState, useEffect } from "react";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CheckSquare, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "./TaskList";
import TaskBoard from "./TaskBoard";
import TaskForm from "./TaskForm";
import { useClient } from "@/components/contexts/ClientContext";

export default function TaskManager({ projectId, project }) {
  const { users } = useClient();
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadTasks();
    loadCurrentUser();
  }, [projectId]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskData = await Task.filter({ project_id: projectId }, "-created_date");
      setTasks(taskData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
    setLoading(false);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        await Task.update(editingTask.id, taskData);
      } else {
        await Task.create({ ...taskData, project_id: projectId });
      }
      
      setShowTaskForm(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await Task.delete(taskId);
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    const originalTasks = [...tasks];
    // Optimistically update UI
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await Task.update(taskId, { status: newStatus });
      // The list will be accurate on the next full load, but this makes the UI feel instant.
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert if API call fails
      setTasks(originalTasks);
    }
  };

  const myTasks = currentUser ? tasks.filter(t => 
    t.assigned_emails && t.assigned_emails.includes(currentUser.email)
  ) : [];

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                Tasks for {project.name}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Organize work with tasks, boards, and assignments.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 mb-4 h-auto p-1 rounded-lg">
              <TabsTrigger value="list">All Tasks</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="mine">My Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <TaskList
                tasks={tasks}
                users={users}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="board">
              <TaskBoard
                tasks={tasks}
                users={users}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </TabsContent>
            <TabsContent value="mine">
               {!currentUser ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : (
                <TaskList
                  tasks={myTasks}
                  users={users}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  loading={loading}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          users={users}
          onSave={handleSaveTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </>
  );
}
