
import React, { useState, useEffect, useCallback } from 'react';
import { EOSRock } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Calendar, User, TrendingUp, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import RockForm from './RockForm';
import { useToast } from "@/components/ui/use-toast";

export default function RocksDashboard({ client }) {
  const [rocks, setRocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRock, setEditingRock] = useState(null);
  const { toast } = useToast();

  const loadRocks = useCallback(async () => {
    if (!client) return; // Ensure client is available before making the call
    
    setLoading(true);
    try {
      const rockData = await EOSRock.filter({ company_id: client.id }, '-created_date');
      setRocks(rockData);
    } catch (error) {
      console.error('Error loading rocks:', error);
    }
    setLoading(false);
  }, [client]); // `loadRocks` depends on `client`

  useEffect(() => {
    // `loadRocks` already checks for `client` existence internally
    loadRocks();
  }, [loadRocks]); // `useEffect` now depends on `loadRocks`

  const handleSaveRock = async (rockData) => {
    try {
      if (editingRock) {
        await EOSRock.update(editingRock.id, rockData);
        toast({
          title: "Rock Updated",
          description: `"${rockData.title}" has been updated successfully.`,
        });
      } else {
        await EOSRock.create({ ...rockData, company_id: client.id });
        toast({
          title: "Rock Created",
          description: `"${rockData.title}" has been added to your quarterly rocks.`,
        });
      }
      
      setShowForm(false);
      setEditingRock(null);
      loadRocks();
    } catch (error) {
      console.error('Error saving rock:', error);
      toast({
        title: "Error",
        description: "Failed to save rock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditRock = (rock) => {
    setEditingRock(rock);
    setShowForm(true);
  };

  const handleDeleteRock = async (rockId) => {
    if (confirm('Are you sure you want to delete this rock? This action cannot be undone.')) {
      try {
        await EOSRock.delete(rockId);
        toast({
          title: "Rock Deleted",
          description: "The rock has been removed from your quarterly plan.",
        });
        loadRocks();
      } catch (error) {
        console.error('Error deleting rock:', error);
        toast({
          title: "Error",
          description: "Failed to delete rock. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-800';
      case 'At Risk': return 'bg-yellow-100 text-yellow-800';
      case 'Off Track': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority <= 3) return 'bg-red-100 text-red-800';
    if (priority <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
  const currentQuarterRocks = rocks.filter(rock => rock.quarter === currentQuarter);
  const sortedRocks = currentQuarterRocks.sort((a, b) => a.priority - b.priority);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Quarterly Rocks - {currentQuarter}</h3>
          <p className="text-slate-600 mt-1">90-day priorities that move your company forward (Target: 3-7 Rocks)</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            setEditingRock(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rock
        </Button>
      </div>

      {/* Rocks Overview Stats */}
      {sortedRocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Rocks</p>
                  <p className="text-2xl font-bold text-purple-900">{sortedRocks.length}</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">On Track</p>
                  <p className="text-2xl font-bold text-green-900">
                    {sortedRocks.filter(r => r.status === 'On Track').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {sortedRocks.filter(r => r.status === 'At Risk' || r.status === 'Off Track').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Avg. Completion</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {Math.round(sortedRocks.reduce((acc, rock) => acc + rock.completion_percentage, 0) / sortedRocks.length || 0)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {sortedRocks.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Rocks Set for {currentQuarter}</h3>
            <p className="text-slate-500 mb-6">Set 3-7 quarterly priorities to drive your business forward using the EOS methodology</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingRock(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedRocks.map((rock) => (
            <Card key={rock.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getPriorityColor(rock.priority)}>
                        Priority {rock.priority}
                      </Badge>
                      <Badge className={getStatusColor(rock.status)}>
                        {rock.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2">{rock.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {rock.owner_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due {format(new Date(rock.due_date), 'MMM d')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRock(rock)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRock(rock.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {rock.description && (
                  <p className="text-slate-700">{rock.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">{rock.completion_percentage}%</span>
                  </div>
                  <Progress value={rock.completion_percentage} className="h-2" />
                </div>

                {rock.milestones && rock.milestones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900">Milestones</h4>
                    <div className="space-y-1">
                      {rock.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className={milestone.completed ? 'text-slate-500 line-through' : 'text-slate-700'}>
                            {milestone.title}
                          </span>
                          {milestone.due_date && (
                            <span className="text-slate-500 ml-auto">
                              {format(new Date(milestone.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <RockForm
          rock={editingRock}
          onSave={handleSaveRock}
          onCancel={() => {
            setShowForm(false);
            setEditingRock(null);
          }}
        />
      )}
    </div>
  );
}
