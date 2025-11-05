import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EOSIssue } from '@/api/entities';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Calendar, Target } from 'lucide-react';

export default function IssuesHealthDashboard({ client }) {
  const [healthMetrics, setHealthMetrics] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    activeIssues: 0,
    overdueIssues: 0,
    resolutionRate: 0,
    avgResolutionTime: 0,
    priorityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    categoryDistribution: {}
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      loadHealthMetrics();
    }
  }, [client]);

  const loadHealthMetrics = async () => {
    try {
      const issues = await EOSIssue.filter({ company_id: client.id });
      
      const totalIssues = issues.length;
      const resolvedIssues = issues.filter(issue => issue.status === 'Solved').length;
      const activeIssues = totalIssues - resolvedIssues;
      
      // Calculate overdue issues (past target resolution date)
      const today = new Date();
      const overdueIssues = issues.filter(issue => {
        if (issue.status === 'Solved' || !issue.target_resolution_date) return false;
        return new Date(issue.target_resolution_date) < today;
      }).length;

      const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

      // Calculate average resolution time for solved issues
      const solvedIssues = issues.filter(issue => issue.status === 'Solved' && issue.resolved_date);
      const avgResolutionTime = solvedIssues.length > 0 
        ? Math.round(solvedIssues.reduce((sum, issue) => {
            const identifiedDate = new Date(issue.identified_date);
            const resolvedDate = new Date(issue.resolved_date);
            const daysDiff = Math.ceil((resolvedDate - identifiedDate) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / solvedIssues.length)
        : 0;

      // Priority distribution
      const priorityDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      issues.forEach(issue => {
        priorityDistribution[issue.priority] = (priorityDistribution[issue.priority] || 0) + 1;
      });

      // Category distribution
      const categoryDistribution = {};
      issues.forEach(issue => {
        categoryDistribution[issue.category] = (categoryDistribution[issue.category] || 0) + 1;
      });

      setHealthMetrics({
        totalIssues,
        resolvedIssues,
        activeIssues,
        overdueIssues,
        resolutionRate,
        avgResolutionTime,
        priorityDistribution,
        categoryDistribution
      });

      // Get recent issues (last 5)
      const recentIssuesData = issues
        .sort((a, b) => new Date(b.identified_date) - new Date(a.identified_date))
        .slice(0, 5);
      setRecentIssues(recentIssuesData);

    } catch (error) {
      console.error('Error loading issues health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'Critical',
      2: 'High',
      3: 'Medium',
      4: 'Low',
      5: 'Very Low'
    };
    return labels[priority];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'text-red-600 bg-red-50 border-red-200',
      2: 'text-orange-600 bg-orange-50 border-orange-200',
      3: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      4: 'text-blue-600 bg-blue-50 border-blue-200',
      5: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Solving':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Discussing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
      {/* Overall Issues Health Score */}
      <Card className={`bg-gradient-to-br ${healthMetrics.resolutionRate >= 80 ? 'from-green-50 to-green-100' : healthMetrics.resolutionRate >= 60 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100'} border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-red-600" />
              Issues Resolution Rate
            </span>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${healthMetrics.resolutionRate >= 80 ? 'text-green-600' : healthMetrics.resolutionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {healthMetrics.resolutionRate}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={healthMetrics.resolutionRate} className="h-3 mb-4" />
          <p className="text-sm text-slate-600">
            {healthMetrics.resolvedIssues} of {healthMetrics.totalIssues} issues have been resolved
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{healthMetrics.activeIssues}</div>
            <div className="text-xs text-blue-600 mt-1">Currently open</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Resolved Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{healthMetrics.resolvedIssues}</div>
            <div className="text-xs text-green-600 mt-1">Permanently solved</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Overdue Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{healthMetrics.overdueIssues}</div>
            <div className="text-xs text-red-600 mt-1">Past target date</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{healthMetrics.avgResolutionTime}d</div>
            <div className="text-xs text-purple-600 mt-1">Average days to solve</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Issues by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(priority => (
              <div key={priority} className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${getPriorityColor(priority)}`}>
                  {healthMetrics.priorityDistribution[priority] || 0}
                </div>
                <div className="text-sm font-medium mt-2">{getPriorityLabel(priority)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIssues.length > 0 ? (
            <div className="space-y-3">
              {recentIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{issue.title}</div>
                      <div className="text-xs text-slate-500">
                        {issue.owner_name || issue.owner_email} • {new Date(issue.identified_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </Badge>
                    {issue.category && (
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No issues identified yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IDS Philosophy */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">IDS Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Identify
              </h4>
              <p className="text-sm text-slate-600">Clearly identify the real issue, not just symptoms. Get to the root cause.</p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Discuss
              </h4>
              <p className="text-sm text-slate-600">Have open, honest discussion about the issue and potential solutions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Solve
              </h4>
              <p className="text-sm text-slate-600">Implement a permanent solution that prevents the issue from recurring.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}