import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EOSProcessImprovement } from '@/lib/perdia-sdk';
import { EOSProcess } from '@/lib/perdia-sdk';
import { Plus, TrendingUp, Lightbulb, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProcessImprovementForm from './ProcessImprovementForm';

export default function ProcessImprovement({ client }) {
  const [improvements, setImprovements] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingImprovement, setEditingImprovement] = useState(null);

  useEffect(() => {
    if (client) {
      loadData();
    }
  }, [client]);

  const loadData = async () => {
    try {
      const [improvementData, processData] = await Promise.all([
        EOSProcessImprovement.filter({ client_id: client.id }, '-created_date'),
        EOSProcess.filter({ client_id: client.id })
      ]);
      setImprovements(improvementData);
      setProcesses(processData);
    } catch (error) {
      console.error('Error loading improvement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImprovement = async (improvementData) => {
    try {
      if (editingImprovement) {
        await EOSProcessImprovement.update(editingImprovement.id, improvementData);
      } else {
        await EOSProcessImprovement.create({ ...improvementData, client_id: client.id });
      }
      setShowForm(false);
      setEditingImprovement(null);
      loadData();
    } catch (error) {
      console.error('Error saving improvement:', error);
    }
  };

  const handleEditImprovement = (improvement) => {
    setEditingImprovement(improvement);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Implemented':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Implemented':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Under Review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Organize improvements by status
  const improvementsByStatus = {
    submitted: improvements.filter(i => i.status === 'Submitted'),
    underReview: improvements.filter(i => i.status === 'Under Review'),
    approved: improvements.filter(i => i.status === 'Approved'),
    inProgress: improvements.filter(i => i.status === 'In Progress'),
    implemented: improvements.filter(i => i.status === 'Implemented')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Process Improvement</h3>
          <p className="text-slate-600 mt-1">Continuous improvement initiatives and suggestions</p>
        </div>
        <Button
          onClick={() => {
            setEditingImprovement(null);
            setShowForm(true);
          }}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Suggest Improvement
        </Button>
      </div>

      {/* Improvement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{improvementsByStatus.submitted.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{improvementsByStatus.underReview.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{improvementsByStatus.approved.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{improvementsByStatus.inProgress.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{improvementsByStatus.implemented.length}</div>
          </CardContent>
        </Card>
      </div>

      {improvements.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Improvements Yet</h3>
            <p className="text-slate-500 mb-6">Start the continuous improvement journey by suggesting your first process improvement.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Suggest First Improvement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {improvements.map(improvement => {
            const process = processes.find(p => p.id === improvement.process_id);
            return (
              <Card key={improvement.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{improvement.improvement_title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={getStatusColor(improvement.status)}>
                          {getStatusIcon(improvement.status)}
                          <span className="ml-1">{improvement.status}</span>
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(improvement.priority)}>
                          {improvement.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditImprovement(improvement)}
                    >
                      Edit
                    </Button>
                  </div>
                  {process && (
                    <Badge variant="outline" className="w-fit bg-slate-100 text-slate-700">
                      {process.process_name}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {improvement.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {improvement.description}
                      </p>
                    )}
                    
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Suggested by:</div>
                      <div>{improvement.suggested_by_name || improvement.suggested_by_email}</div>
                    </div>

                    {improvement.expected_benefits && improvement.expected_benefits.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Expected Benefits:</div>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {improvement.expected_benefits.slice(0, 2).map((benefit, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                          {improvement.expected_benefits.length > 2 && (
                            <li className="text-slate-400">...and {improvement.expected_benefits.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="text-xs text-slate-500">
                        {new Date(improvement.created_date).toLocaleDateString()}
                      </div>
                      {improvement.target_completion_date && (
                        <div className="text-xs text-slate-500">
                          Due: {new Date(improvement.target_completion_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProcessImprovementForm
          improvement={editingImprovement}
          client={client}
          processes={processes}
          onSave={handleSaveImprovement}
          onCancel={() => {
            setShowForm(false);
            setEditingImprovement(null);
          }}
        />
      )}
    </div>
  );
}