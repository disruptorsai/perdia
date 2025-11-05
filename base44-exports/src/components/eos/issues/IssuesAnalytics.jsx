import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EOSIssue } from '@/api/entities';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Eye, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#10B981', '#8B5CF6'];

export default function IssuesAnalytics({ client }) {
  const [analytics, setAnalytics] = useState({
    statusDistribution: [],
    priorityDistribution: [],
    categoryDistribution: [],
    resolutionTrends: [],
    overdueIssues: 0,
    avgResolutionTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      loadAnalytics();
    }
  }, [client]);

  const loadAnalytics = async () => {
    try {
      const issues = await EOSIssue.filter({ company_id: client.id });
      
      // Status distribution
      const statusCounts = {};
      issues.forEach(issue => {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count
      }));

      // Priority distribution
      const priorityCounts = {};
      issues.forEach(issue => {
        const priority = `Priority ${issue.priority}`;
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });
      const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority,
        value: count
      }));

      // Category distribution
      const categoryCounts = {};
      issues.forEach(issue => {
        if (issue.category) {
          categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
        }
      });
      const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
        name: category,
        value: count
      }));

      // Resolution trends (last 12 weeks)
      const resolutionTrends = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const resolvedThisWeek = issues.filter(issue => {
          if (!issue.resolved_date) return false;
          const resolvedDate = new Date(issue.resolved_date);
          return resolvedDate >= weekStart && resolvedDate <= weekEnd;
        }).length;
        
        const identifiedThisWeek = issues.filter(issue => {
          const identifiedDate = new Date(issue.identified_date);
          return identifiedDate >= weekStart && identifiedDate <= weekEnd;
        }).length;
        
        resolutionTrends.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          identified: identifiedThisWeek,
          resolved: resolvedThisWeek
        });
      }

      // Overdue issues
      const overdueIssues = issues.filter(issue => {
        if (issue.status === 'Solved' || !issue.target_resolution_date) return false;
        return new Date(issue.target_resolution_date) < today;
      }).length;

      // Average resolution time
      const solvedIssues = issues.filter(issue => issue.status === 'Solved' && issue.resolved_date);
      const avgResolutionTime = solvedIssues.length > 0 
        ? Math.round(solvedIssues.reduce((sum, issue) => {
            const identifiedDate = new Date(issue.identified_date);
            const resolvedDate = new Date(issue.resolved_date);
            const daysDiff = Math.ceil((resolvedDate - identifiedDate) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / solvedIssues.length)
        : 0;

      setAnalytics({
        statusDistribution,
        priorityDistribution,
        categoryDistribution,
        resolutionTrends,
        overdueIssues,
        avgResolutionTime
      });

    } catch (error) {
      console.error('Error loading issues analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Issues Analytics</h3>
          <p className="text-slate-600 mt-1">Insights and trends from your issue resolution process</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Overdue Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{analytics.overdueIssues}</div>
            <div className="text-xs text-red-600 mt-1">Past target date</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{analytics.avgResolutionTime}d</div>
            <div className="text-xs text-blue-600 mt-1">Average days</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {analytics.statusDistribution.find(s => s.name === 'Solved')?.value || 0}
            </div>
            <div className="text-xs text-green-600 mt-1">Issues solved</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {analytics.statusDistribution.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-xs text-purple-600 mt-1">All time</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-600" />
              Issues by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Issues by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EF4444" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Trends */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Issues Identified vs Resolved (Last 12 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.resolutionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="identified" stroke="#EF4444" strokeWidth={2} name="Identified" />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {analytics.categoryDistribution.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-600" />
              Issues by EOS Component
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}