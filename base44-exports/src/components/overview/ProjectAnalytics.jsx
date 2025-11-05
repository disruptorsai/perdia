import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FolderOpen, Target, TrendingUp, CheckCircle } from "lucide-react";
import { applyTimeRounding } from '@/components/lib/rounding';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

export default function ProjectAnalytics({ entries }) {
  const projectData = useMemo(() => {
    const projects = {};
    entries.forEach(entry => {
      let projectName = 'Other Work';
      let clientName = 'Unknown Client';
      
      if (entry.project) {
        projectName = entry.project.name;
        clientName = entry.client?.name || 'Unknown Client';
      } else if (entry.title) {
        projectName = entry.title;
        clientName = entry.client?.name || 'Unknown Client';
      }
      
      const key = `${clientName} / ${projectName}`;
      
      if (!projects[key]) {
        projects[key] = {
          name: projectName,
          clientName,
          fullName: key,
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
          earnings: 0
        };
      }
      
      const minutes = entry.duration_minutes || 0;
      projects[key].totalMinutes += minutes;
      projects[key].entryCount += 1;
      
      if (entry.billable && entry.client) {
        const roundedMinutes = applyTimeRounding(minutes, entry.client);
        projects[key].billableMinutes += roundedMinutes;
        const hours = roundedMinutes / 60;
        projects[key].earnings += hours * (entry.client.hourly_rate || 0);
      }
    });
    
    return Object.values(projects)
      .map(project => ({
        ...project,
        totalHours: Math.round((project.totalMinutes / 60) * 10) / 10,
        billableHours: Math.round((project.billableMinutes / 60) * 10) / 10,
        earnings: Math.round(project.earnings * 100) / 100,
        utilization: project.totalMinutes > 0 ? Math.round((project.billableMinutes / project.totalMinutes) * 100) : 0
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [entries]);

  const entryTypeData = useMemo(() => {
    const types = {};
    entries.forEach(entry => {
      const type = entry.entry_type || 'other';
      const minutes = entry.duration_minutes || 0;
      types[type] = (types[type] || 0) + minutes;
    });
    
    return Object.entries(types)
      .map(([type, minutes]) => ({
        type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        hours: Math.round((minutes / 60) * 10) / 10,
        value: Math.round((minutes / 60) * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const totalProjects = projectData.length;
  const totalEntries = entries.length;
  const avgEntriesPerProject = totalProjects > 0 ? Math.round(totalEntries / totalProjects) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalProjects}</div>
            <div className="text-xs text-blue-600 mt-1">With time tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{totalEntries}</div>
            <div className="text-xs text-emerald-600 mt-1">Time entries logged</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Avg Entries/Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{avgEntriesPerProject}</div>
            <div className="text-xs text-purple-600 mt-1">Per project average</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-600" />
              Top Projects by Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}h`, 
                      'Hours',
                      `Client: ${props.payload.clientName}`
                    ]} 
                  />
                  <Bar dataKey="totalHours" fill="#10B981" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Work Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entryTypeData}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, value }) => `${type}: ${value}h`}
                  >
                    {entryTypeData.map((entry, index) => (
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

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Project Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData.filter(p => p.earnings > 0).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `$${value}`, 
                    'Earnings',
                    `${props.payload.billableHours}h billable`
                  ]} 
                />
                <Bar dataKey="earnings" fill="#8B5CF6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Project Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectData.slice(0, 10).map((project, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{project.name}</h4>
                  <p className="text-sm text-slate-600 truncate">{project.clientName}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{project.totalHours}h</div>
                    <div className="text-slate-500 text-xs">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-emerald-600">{project.billableHours}h</div>
                    <div className="text-slate-500 text-xs">Billable</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">${project.earnings}</div>
                    <div className="text-slate-500 text-xs">Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{project.utilization}%</div>
                    <div className="text-slate-500 text-xs">Billable %</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}