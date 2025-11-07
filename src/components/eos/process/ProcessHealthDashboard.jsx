import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EOSProcess } from '@/lib/perdia-sdk';
import { EOSProcessImprovement } from '@/lib/perdia-sdk';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Settings, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function ProcessHealthDashboard({ client }) {
  const [healthMetrics, setHealthMetrics] = useState({
    overallMaturityScore: 0,
    totalProcesses: 0,
    documentedProcesses: 0,
    activeProcesses: 0,
    processesNeedingReview: 0,
    recentImprovements: 0,
    avgCycleTime: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      loadHealthMetrics();
    }
  }, [client]);

  const loadHealthMetrics = async () => {
    try {
      const [processes, improvements] = await Promise.all([
        EOSProcess.filter({ client_id: client.id }),
        EOSProcessImprovement.filter({ client_id: client.id }, '-created_date', 10)
      ]);

      const totalProcesses = processes.length;
      const documentedProcesses = processes.filter(p => p.process_steps && p.process_steps.length > 0).length;
      const activeProcesses = processes.filter(p => p.status === 'Active').length;
      
      // Calculate processes needing review (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const processesNeedingReview = processes.filter(p => {
        if (!p.last_review_date) return true;
        return new Date(p.last_review_date) < sixMonthsAgo;
      }).length;

      const recentImprovements = improvements.filter(imp => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(imp.created_date) > thirtyDaysAgo;
      }).length;

      // Calculate average cycle time
      const processesWithCycleTime = processes.filter(p => p.estimated_cycle_time);
      const avgCycleTime = processesWithCycleTime.length > 0 
        ? Math.round(processesWithCycleTime.reduce((sum, p) => sum + p.estimated_cycle_time, 0) / processesWithCycleTime.length)
        : 0;

      // Calculate maturity score based on documentation completeness
      const maturityScore = totalProcesses > 0 
        ? Math.round((documentedProcesses / totalProcesses) * 100)
        : 0;

      setHealthMetrics({
        overallMaturityScore: maturityScore,
        totalProcesses,
        documentedProcesses,
        activeProcesses,
        processesNeedingReview,
        recentImprovements,
        avgCycleTime
      });

      // Set recent activity
      const activity = [
        ...improvements.slice(0, 5).map(imp => ({
          type: 'improvement',
          title: imp.improvement_title,
          date: imp.created_date,
          status: imp.status
        })),
        ...processes.filter(p => p.status === 'Active').slice(0, 3).map(proc => ({
          type: 'process',
          title: proc.process_name,
          date: proc.last_review_date || proc.created_date,
          status: proc.status
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading process health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-50 to-green-100';
    if (score >= 60) return 'from-yellow-50 to-yellow-100';
    return 'from-red-50 to-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Process Maturity Score */}
      <Card className={`bg-gradient-to-br ${getScoreBg(healthMetrics.overallMaturityScore)} border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Process Maturity Score
            </span>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${getScoreColor(healthMetrics.overallMaturityScore)}`}>
              {healthMetrics.overallMaturityScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={healthMetrics.overallMaturityScore} className="h-3 mb-4" />
          <p className="text-sm text-slate-600">
            Based on process documentation completeness and standardization
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{healthMetrics.totalProcesses}</div>
            <div className="text-xs text-blue-600 mt-1">
              {healthMetrics.documentedProcesses} documented
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{healthMetrics.activeProcesses}</div>
            <div className="text-xs text-green-600 mt-1">Ready for execution</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Need Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{healthMetrics.processesNeedingReview}</div>
            <div className="text-xs text-yellow-600 mt-1">Overdue for review</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Cycle Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{healthMetrics.avgCycleTime}m</div>
            <div className="text-xs text-purple-600 mt-1">Average duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Create New Process</h4>
              <p className="text-sm text-slate-600">Document a new business process with flowcharts</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Build Flowchart</h4>
              <p className="text-sm text-slate-600">Visual process mapping with drag-and-drop builder</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Suggest Improvement</h4>
              <p className="text-sm text-slate-600">Submit ideas for process optimization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.type === 'improvement' ? (
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Settings className="w-4 h-4 text-orange-500" />
                    )}
                    <div>
                      <div className="font-medium text-slate-900">{activity.title}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No recent process activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EOS Process Philosophy */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">EOS Process Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-orange-700 mb-2">Consistency & Scalability</h4>
              <p className="text-sm text-slate-600">Document the way you do business to ensure consistent delivery of value to customers as you grow.</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Knowledge Capture</h4>
              <p className="text-sm text-slate-600">Transform tribal knowledge into documented processes that can be taught, improved, and scaled.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}