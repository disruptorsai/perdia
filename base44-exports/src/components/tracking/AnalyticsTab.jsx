
import React, { useState, useEffect } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { TimeEntry } from "@/api/entities";
import { Task } from "@/api/entities";
import { Project } from "@/api/entities";
import { Client } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, FolderOpen } from "lucide-react";
import { subDays, format, startOfWeek } from "date-fns";
import { applyTimeRounding } from '@/components/lib/rounding';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export default function AnalyticsTab() {
  const { selectedClientId, clients } = useClient();
  const [enrichedEntries, setEnrichedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last_30_days");
  const [stats, setStats] = useState({ totalHours: 0, billableHours: 0, utilization: 0 }); // Removed estimatedEarnings
  const [currentClient, setCurrentClient] = useState(null);

  useEffect(() => {
    if (selectedClientId) {
      loadData();
    } else {
      setEnrichedEntries([]);
      setLoading(false);
      setStats({ totalHours: 0, billableHours: 0, utilization: 0 }); // Removed estimatedEarnings
    }
  }, [timeRange, selectedClientId, clients]);

  useEffect(() => {
    // Recalculate stats when enrichedEntries, selectedClientId, or clients change
    getTotalStats().then(setStats);
  }, [enrichedEntries, selectedClientId, clients]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cutoffDate = getCutoffDate();
      const entryData = await TimeEntry.filter({ is_running: false }, "-start_time", 500);
      
      // Load current client data
      // Find the client from the context's 'clients' array instead of re-fetching from DB
      const clientData = clients.find(c => c.id === selectedClientId);
      setCurrentClient(clientData);
      
      const timeFilteredEntries = entryData.filter(entry => 
        new Date(entry.start_time) >= cutoffDate
      );
      
      const enriched = await enrichEntriesWithDetails(timeFilteredEntries);
      
      // Filter by selectedClientId AFTER enrichment
      const clientFilteredEntries = enriched.filter(e => {
        if (e.entry_type === "project_task" && e.project) {
          return e.project.client_id === selectedClientId;
        }
        if (e.entry_type !== "project_task") {
          return e.client_id === selectedClientId;
        }
        return false;
      });

      setEnrichedEntries(clientFilteredEntries);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setLoading(false);
  };

  const getCutoffDate = () => {
    const now = new Date();
    switch (timeRange) {
      case "last_7_days":
        return subDays(now, 7);
      case "last_30_days":
        return subDays(now, 30);
      case "last_90_days":
        return subDays(now, 90);
      default:
        return subDays(now, 30);
    }
  };

  const enrichEntriesWithDetails = async (entries) => {
    const tasks = await Task.list();
    const projects = await Project.list();
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const projectMap = new Map(projects.map(p => [p.id, p]));

    return entries.map(entry => {
      const task = taskMap.get(entry.task_id);
      const project = task ? projectMap.get(task.project_id) : null;
      return { ...entry, task, project };
    });
  };

  const getWeeklyData = () => {
    const weeklyHours = {};
    enrichedEntries.forEach(entry => {
      const weekStart = format(startOfWeek(new Date(entry.start_time)), 'MMM d');
      const roundedMinutes = applyTimeRounding(entry.duration_minutes || 0, currentClient);
      weeklyHours[weekStart] = (weeklyHours[weekStart] || 0) + roundedMinutes;
    });

    return Object.entries(weeklyHours)
      .map(([week, minutes]) => ({
        week,
        hours: Math.round((minutes / 60) * 10) / 10
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));
  };

  const getProjectData = () => {
    const projectHours = {};
    enrichedEntries.forEach(entry => {
      const projectName = entry.project?.name || entry.title || 'Other Work';
      const roundedMinutes = applyTimeRounding(entry.duration_minutes || 0, currentClient);
      projectHours[projectName] = (projectHours[projectName] || 0) + roundedMinutes;
    });

    return Object.entries(projectHours)
      .map(([name, minutes]) => ({
        name,
        hours: Math.round((minutes / 60) * 10) / 10,
        value: Math.round((minutes / 60) * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);
  };

  const getTotalStats = async () => {
    if (!selectedClientId || !currentClient) {
      return { totalHours: 0, billableHours: 0, utilization: 0 }; // Removed estimatedEarnings
    }
    
    // Removed hourlyRate as it's no longer used for estimated earnings

    let totalMinutes = 0;
    let billableMinutes = 0;

    enrichedEntries.forEach(entry => {
        const rawMinutes = entry.duration_minutes || 0;
        totalMinutes += rawMinutes;

        if(entry.billable) {
            const roundedMinutes = applyTimeRounding(rawMinutes, currentClient);
            billableMinutes += roundedMinutes;
        }
    });
    
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const billableHours = Math.round((billableMinutes / 60) * 10) / 10;
    
    // Removed estimatedEarnings calculation
    
    return {
      totalHours,
      billableHours,
      utilization: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0
    };
  };
  
  const weeklyData = getWeeklyData();
  const projectData = getProjectData();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  // If no client is selected or no data after filtering
  if (!selectedClientId) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600 mt-1">Insights into your time tracking and productivity</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange} disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-20 text-slate-500">
          <FolderOpen className="mx-auto h-12 w-12 mb-4" />
          <p className="text-xl font-semibold">No Client Selected</p>
          <p className="mt-2">Please select a client from the sidebar to view their analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Insights into your time tracking and productivity</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 days</SelectItem>
            <SelectItem value="last_30_days">Last 30 days</SelectItem>
            <SelectItem value="last_90_days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Changed grid-cols-4 to grid-cols-3 */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalHours}h</div>
            <div className="text-xs text-blue-600 mt-1">
              Actual time tracked
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Billable Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.billableHours}h</div>
            {currentClient?.time_rounding_increment !== "none" && (
              <div className="text-xs text-emerald-600 mt-1">
                Rounded to {currentClient?.time_rounding_increment?.replace('_', ' ')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Removed Estimated Earnings Card */}

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.utilization}%</div>
            <div className="text-xs text-orange-600 mt-1">Billable vs Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Weekly Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                  <Bar dataKey="hours" fill="#10B981" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              Time by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectData.slice(0, 6)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {projectData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}h`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Top Projects by Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#3B82F6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
