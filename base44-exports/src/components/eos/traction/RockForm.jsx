import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, CalendarIcon, Plus, Target, Users, Flag } from 'lucide-react';
import { format, addDays, startOfQuarter, endOfQuarter } from 'date-fns';
import { useClient } from '@/components/contexts/ClientContext';

export default function RockForm({ rock, onSave, onCancel }) {
  const { users } = useClient();
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
  const quarterEnd = endOfQuarter(new Date());

  const [formData, setFormData] = useState({
    title: rock?.title || '',
    description: rock?.description || '',
    owner_email: rock?.owner_email || '',
    owner_name: rock?.owner_name || '',
    quarter: rock?.quarter || currentQuarter,
    due_date: rock?.due_date || format(quarterEnd, 'yyyy-MM-dd'),
    priority: rock?.priority || 1,
    status: rock?.status || 'On Track',
    completion_percentage: rock?.completion_percentage || 0,
    milestones: rock?.milestones || [],
    // SMART Goal components
    specific_details: rock?.specific_details || '',
    measurable_criteria: rock?.measurable_criteria || '',
    achievable_plan: rock?.achievable_plan || '',
    relevant_impact: rock?.relevant_impact || '',
    time_bound_deadline: rock?.time_bound_deadline || format(quarterEnd, 'yyyy-MM-dd')
  });

  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '', completed: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find owner name from users list
    const owner = users.find(u => u.email === formData.owner_email);
    const dataToSave = {
      ...formData,
      owner_name: owner?.full_name || formData.owner_name,
      milestones: formData.milestones.filter(m => m.title.trim() !== '')
    };
    
    onSave(dataToSave);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    if (newMilestone.title.trim()) {
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, { ...newMilestone, id: Date.now() }]
      }));
      setNewMilestone({ title: '', due_date: '', completed: false });
    }
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-xl">{rock ? 'Edit Rock' : 'Create New Quarterly Rock'}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Rock Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Rock Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Increase monthly recurring revenue by 25%"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Ranking (1-7) *</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => handleInputChange('priority', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          Priority {num} {num <= 3 ? '(High)' : num <= 5 ? '(Medium)' : '(Low)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Companies should have 3-7 Rocks per quarter</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Rock Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of what this Rock entails and why it's important..."
                  rows={3}
                />
              </div>
            </div>

            {/* Assignment & Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Assignment & Timeline</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_email">Rock Owner *</Label>
                  <Select value={formData.owner_email} onValueChange={(value) => handleInputChange('owner_email', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Input
                    id="quarter"
                    value={formData.quarter}
                    onChange={(e) => handleInputChange('quarter', e.target.value)}
                    placeholder="Q1 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Current Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Track">On Track</SelectItem>
                      <SelectItem value="At Risk">At Risk</SelectItem>
                      <SelectItem value="Off Track">Off Track</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion_percentage">Completion Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="completion_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completion_percentage}
                      onChange={(e) => handleInputChange('completion_percentage', parseInt(e.target.value) || 0)}
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SMART Goals Framework */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">SMART Goal Framework</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specific_details">
                    <Badge variant="outline" className="mr-2">S</Badge>
                    Specific Details
                  </Label>
                  <Textarea
                    id="specific_details"
                    value={formData.specific_details}
                    onChange={(e) => handleInputChange('specific_details', e.target.value)}
                    placeholder="What exactly will be accomplished? Who is involved? What are the requirements?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurable_criteria">
                    <Badge variant="outline" className="mr-2">M</Badge>
                    Measurable Criteria
                  </Label>
                  <Textarea
                    id="measurable_criteria"
                    value={formData.measurable_criteria}
                    onChange={(e) => handleInputChange('measurable_criteria', e.target.value)}
                    placeholder="How will progress be measured? What are the specific metrics?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievable_plan">
                    <Badge variant="outline" className="mr-2">A</Badge>
                    Achievable Plan
                  </Label>
                  <Textarea
                    id="achievable_plan"
                    value={formData.achievable_plan}
                    onChange={(e) => handleInputChange('achievable_plan', e.target.value)}
                    placeholder="How will this goal be accomplished? What resources are needed?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relevant_impact">
                    <Badge variant="outline" className="mr-2">R</Badge>
                    Relevant Impact
                  </Label>
                  <Textarea
                    id="relevant_impact"
                    value={formData.relevant_impact}
                    onChange={(e) => handleInputChange('relevant_impact', e.target.value)}
                    placeholder="Why is this goal important? How does it align with company objectives?"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_bound_deadline">
                  <Badge variant="outline" className="mr-2">T</Badge>
                  Time-Bound Deadline
                </Label>
                <Input
                  id="time_bound_deadline"
                  type="date"
                  value={formData.time_bound_deadline}
                  onChange={(e) => handleInputChange('time_bound_deadline', e.target.value)}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Milestones & Checkpoints</h3>
              </div>
              
              {/* Add New Milestone */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Milestone Description</Label>
                    <Input
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Complete market research"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date</Label>
                    <Input
                      type="date"
                      value={newMilestone.due_date}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <Button type="button" onClick={addMilestone} disabled={!newMilestone.title.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              </div>

              {/* Existing Milestones */}
              {formData.milestones.length > 0 && (
                <div className="space-y-3">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={(e) => updateMilestone(index, 'completed', e.target.checked)}
                        className="h-4 w-4 text-purple-600"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {milestone.title}
                        </p>
                        {milestone.due_date && (
                          <p className="text-sm text-slate-500">
                            Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {rock ? 'Update Rock' : 'Create Rock'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}