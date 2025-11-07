import React, { useState, useEffect, useCallback } from 'react';
import { EOSScorecardMetric, EOSScorecardEntry } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BarChart3, TrendingUp, TrendingDown, Minus, Edit, Trash2, Save, X } from 'lucide-react';
import { startOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import MetricForm from './MetricForm';
import { useToast } from "@/components/ui/use-toast";

export default function ScorecardDashboard({ client }) {
  const [metrics, setMetrics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [editingValues, setEditingValues] = useState({});

  const { toast } = useToast();

  const loadScorecardData = useCallback(async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const [metricsData, entriesData] = await Promise.all([
        EOSScorecardMetric.filter({ client_id: client.id }, 'metric_name'),
        EOSScorecardEntry.filter({ client_id: client.id }, '-week_start_date', 100)
      ]);
      setMetrics(metricsData.filter(m => m.is_active !== false));
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading scorecard data:', error);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    if (client) {
      loadScorecardData();
    }
  }, [client, loadScorecardData]);

  const handleSaveMetric = async (metricData) => {
    try {
      if (editingMetric) {
        await EOSScorecardMetric.update(editingMetric.id, metricData);
        toast({
          title: "Metric Updated",
          description: `"${metricData.metric_name}" has been updated successfully.`,
        });
      } else {
        await EOSScorecardMetric.create({ ...metricData, client_id: client.id });
        toast({
          title: "Metric Created",
          description: `"${metricData.metric_name}" has been added to your scorecard.`,
        });
      }
      
      setShowForm(false);
      setEditingMetric(null);
      loadScorecardData();
    } catch (error) {
      console.error('Error saving metric:', error);
      toast({
        title: "Error",
        description: "Failed to save metric. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMetric = async (metricId) => {
    if (confirm('Are you sure you want to delete this metric? This will also delete all associated entries.')) {
      try {
        await EOSScorecardMetric.update(metricId, { is_active: false });
        toast({
          title: "Metric Deleted",
          description: "The metric has been removed from your scorecard.",
        });
        loadScorecardData();
      } catch (error) {
        console.error('Error deleting metric:', error);
        toast({
          title: "Error",
          description: "Failed to delete metric. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getWeekKey = (metricId, weekStart) => {
    return `${metricId}-${format(weekStart, 'yyyy-MM-dd')}`;
  };

  const getEntryForWeek = (metricId, weekStart) => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    return entries.find(e => e.metric_id === metricId && e.week_start_date === weekStartStr);
  };

  const handleValueChange = (metricId, weekStart, value) => {
    const key = getWeekKey(metricId, weekStart);
    setEditingValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveEntry = async (metricId, weekStart, value) => {
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const existingEntry = getEntryForWeek(metricId, weekStart);
      
      if (existingEntry) {
        await EOSScorecardEntry.update(existingEntry.id, { value: parseFloat(value) || 0 });
      } else {
        await EOSScorecardEntry.create({
          metric_id: metricId,
          client_id: client.id,
          week_start_date: weekStartStr,
          value: parseFloat(value) || 0
        });
      }
      
      // Clear editing state
      const key = getWeekKey(metricId, weekStart);
      setEditingValues(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      
      loadScorecardData();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMetricStatus = (metric, weekStart) => {
    const entry = getEntryForWeek(metric.id, weekStart);
    if (!entry) return 'no-data';
    
    const isTarget = metric.target_type === 'minimum' 
      ? entry.value >= metric.target_value
      : entry.value <= metric.target_value;
    
    return isTarget ? 'on-track' : 'off-track';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'off-track': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate array of weeks to display (current week and 3 weeks before)
  const weeksToShow = [];
  for (let i = 3; i >= 0; i--) {
    weeksToShow.push(subWeeks(currentWeekStart, i));
  }

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
          <h3 className="text-xl font-bold text-slate-900">Weekly Scorecard</h3>
          <p className="text-slate-600 mt-1">Track key metrics that predict success</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            ← Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            Next Week →
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              setEditingMetric(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Metric
          </Button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Metrics Defined</h3>
            <p className="text-slate-500 mb-6">Create 5-15 key metrics to track your business pulse</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingMetric(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Metric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Weekly Scorecard - {format(currentWeekStart, 'MMM d')} to {format(addWeeks(currentWeekStart, 1), 'MMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Metric</TableHead>
                  <TableHead className="w-24">Target</TableHead>
                  {weeksToShow.map((week, index) => (
                    <TableHead key={index} className="text-center w-32">
                      <div className="text-xs">Week of</div>
                      <div className="font-semibold">{format(week, 'MMM d')}</div>
                    </TableHead>
                  ))}
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{metric.metric_name}</div>
                        <div className="text-xs text-slate-500">{metric.category}</div>
                        <div className="text-xs text-slate-500">Owner: {metric.owner_email?.split('@')[0] || 'Unassigned'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {metric.target_type === 'minimum' ? '≥ ' : '≤ '}
                        {metric.target_value} {metric.unit}
                      </div>
                    </TableCell>
                    {weeksToShow.map((week, weekIndex) => {
                      const entry = getEntryForWeek(metric.id, week);
                      const status = getMetricStatus(metric, week);
                      const key = getWeekKey(metric.id, week);
                      const isEditing = key in editingValues;
                      const editValue = editingValues[key] ?? (entry?.value || '');
                      
                      return (
                        <TableCell key={weekIndex} className="text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => handleValueChange(metric.id, week, e.target.value)}
                                className="w-16 h-8 text-center text-xs"
                                step="0.01"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleSaveEntry(metric.id, week, editValue)}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingValues(prev => {
                                    const updated = { ...prev };
                                    delete updated[key];
                                    return updated;
                                  });
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-slate-50 rounded p-1"
                              onClick={() => handleValueChange(metric.id, week, entry?.value || '')}
                            >
                              {entry ? (
                                <div className="space-y-1">
                                  <div className="font-semibold">
                                    {entry.value} {metric.unit}
                                  </div>
                                  <Badge className={`text-xs ${getStatusColor(status)}`}>
                                    {status === 'on-track' ? 'On Track' : status === 'off-track' ? 'Off Track' : 'No Data'}
                                  </Badge>
                                </div>
                              ) : (
                                <div className="text-slate-400 text-xs">Click to add</div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingMetric(metric);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600"
                          onClick={() => handleDeleteMetric(metric.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <MetricForm
          metric={editingMetric}
          onSave={handleSaveMetric}
          onCancel={() => {
            setShowForm(false);
            setEditingMetric(null);
          }}
        />
      )}
    </div>
  );
}