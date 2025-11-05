import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EOSIssue } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Target, Users, CheckCircle, ArrowRight, Clock } from 'lucide-react';

export default function IDSWorkflow({ client }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    if (client) {
      loadIssues();
    }
  }, [client]);

  const loadIssues = async () => {
    try {
      const issuesData = await EOSIssue.filter({ company_id: client.id }, '-identified_date');
      setIssues(issuesData);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const advanceIssueStatus = async (issue) => {
    const statusProgression = {
      'Identified': 'Discussing',
      'Discussing': 'Solving',
      'Solving': 'Solved'
    };

    const nextStatus = statusProgression[issue.status];
    if (nextStatus) {
      try {
        await EOSIssue.update(issue.id, { 
          status: nextStatus,
          ...(nextStatus === 'Solved' && { resolved_date: new Date().toISOString() })
        });
        loadIssues();
      } catch (error) {
        console.error('Error updating issue status:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-200',
      2: 'bg-orange-100 text-orange-800 border-orange-200',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-blue-100 text-blue-800 border-blue-200',
      5: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'Identified':
        return <Target className="w-5 h-5 text-red-500" />;
      case 'Discussing':
        return <Users className="w-5 h-5 text-yellow-500" />;
      case 'Solving':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'Solved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'Identified':
        return 'from-red-50 to-red-100 border-red-200';
      case 'Discussing':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'Solving':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'Solved':
        return 'from-green-50 to-green-100 border-green-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const issuesByStatus = {
    'Identified': issues.filter(i => i.status === 'Identified'),
    'Discussing': issues.filter(i => i.status === 'Discussing'),
    'Solving': issues.filter(i => i.status === 'Solving'),
    'Solved': issues.filter(i => i.status === 'Solved')
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
          <h3 className="text-xl font-bold text-slate-900">IDS Workflow</h3>
          <p className="text-slate-600 mt-1">Move issues through the Identify, Discuss, Solve process</p>
        </div>
      </div>

      {/* IDS Process Overview */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">IDS Process Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Identify</div>
                <div className="text-sm text-slate-600">Define the real issue</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Discuss</div>
                <div className="text-sm text-slate-600">Collaborate on solutions</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Solve</div>
                <div className="text-sm text-slate-600">Implement solution</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Solved</div>
                <div className="text-sm text-slate-600">Permanently resolved</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IDS Workflow Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(issuesByStatus).map(([status, statusIssues]) => (
          <Card key={status} className={`bg-gradient-to-br ${getStageColor(status)} border-0 shadow-lg`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getStageIcon(status)}
                {status}
                <Badge variant="outline" className="ml-auto">
                  {statusIssues.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusIssues.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm text-slate-500">No issues in this stage</div>
                </div>
              ) : (
                statusIssues.map(issue => (
                  <Card key={issue.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-slate-900 text-sm line-clamp-2">
                            {issue.title}
                          </h4>
                          <Badge className={`text-xs ml-2 flex-shrink-0 ${getPriorityColor(issue.priority)}`}>
                            P{issue.priority}
                          </Badge>
                        </div>
                        
                        {issue.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {issue.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="text-xs text-slate-500">
                            {issue.owner_name || 'No owner'}
                          </div>
                          {status !== 'Solved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => advanceIssueStatus(issue)}
                              className="text-xs h-6 px-2"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Next
                            </Button>
                          )}
                        </div>
                        
                        {issue.target_resolution_date && (
                          <div className="text-xs text-slate-500">
                            Due: {new Date(issue.target_resolution_date).toLocaleDateString()}
                          </div>
                        )}
                        
                        {issue.target_resolution_date && new Date(issue.target_resolution_date) < new Date() && status !== 'Solved' && (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                            <div className="text-xs text-red-600 font-medium">Overdue</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {issues.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Issues in Workflow</h3>
            <p className="text-slate-500">
              Issues that are identified will appear here and can be moved through the IDS process.
            </p>
          </CardContent>
        </Card>
      )}

      {/* IDS Best Practices */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">IDS Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Identify Stage
              </h4>
              <ul className="space-y-1">
                <li>• Focus on the real issue, not symptoms</li>
                <li>• Be specific and clear in description</li>
                <li>• Assign appropriate priority level</li>
                <li>• Get agreement that this IS an issue</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Discuss Stage
              </h4>
              <ul className="space-y-1">
                <li>• Include all relevant stakeholders</li>
                <li>• Encourage open, honest dialogue</li>
                <li>• Consider multiple solutions</li>
                <li>• Stay solution-focused</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Solve Stage
              </h4>
              <ul className="space-y-1">
                <li>• Create permanent solutions</li>
                <li>• Assign clear ownership</li>
                <li>• Set realistic timelines</li>
                <li>• Follow up to ensure success</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}