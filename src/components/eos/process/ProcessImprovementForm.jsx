import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, TrendingUp } from 'lucide-react';

export default function ProcessImprovementForm({ improvement, client, processes, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    process_id: '',
    improvement_title: '',
    description: '',
    suggested_by_name: '',
    suggested_by_email: '',
    problem_statement: '',
    proposed_solution: '',
    expected_benefits: [''],
    impact_assessment: {
      time_savings: '',
      cost_savings: '',
      quality_improvement: '',
      customer_impact: '',
      effort_required: 'Medium'
    },
    priority: 'Medium',
    status: 'Submitted',
    assigned_to_name: '',
    assigned_to_email: '',
    target_completion_date: '',
    implementation_notes: '',
    results_achieved: '',
    lessons_learned: ''
  });

  useEffect(() => {
    if (improvement) {
      setFormData({
        process_id: improvement.process_id || '',
        improvement_title: improvement.improvement_title || '',
        description: improvement.description || '',
        suggested_by_name: improvement.suggested_by_name || '',
        suggested_by_email: improvement.suggested_by_email || '',
        problem_statement: improvement.problem_statement || '',
        proposed_solution: improvement.proposed_solution || '',
        expected_benefits: improvement.expected_benefits && improvement.expected_benefits.length > 0 ? improvement.expected_benefits : [''],
        impact_assessment: improvement.impact_assessment || {
          time_savings: '',
          cost_savings: '',
          quality_improvement: '',
          customer_impact: '',
          effort_required: 'Medium'
        },
        priority: improvement.priority || 'Medium',
        status: improvement.status || 'Submitted',
        assigned_to_name: improvement.assigned_to_name || '',
        assigned_to_email: improvement.assigned_to_email || '',
        target_completion_date: improvement.target_completion_date || '',
        implementation_notes: improvement.implementation_notes || '',
        results_achieved: improvement.results_achieved || '',
        lessons_learned: improvement.lessons_learned || ''
      });
    }
  }, [improvement]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      expected_benefits: formData.expected_benefits.filter(benefit => benefit.trim() !== ''),
      impact_assessment: {
        ...formData.impact_assessment,
        time_savings: formData.impact_assessment.time_savings ? parseFloat(formData.impact_assessment.time_savings) : null,
        cost_savings: formData.impact_assessment.cost_savings ? parseFloat(formData.impact_assessment.cost_savings) : null
      }
    };
    onSave(cleanedData);
  };

  const addExpectedBenefit = () => {
    setFormData(prev => ({
      ...prev,
      expected_benefits: [...prev.expected_benefits, '']
    }));
  };

  const updateExpectedBenefit = (index, value) => {
    setFormData(prev => ({
      ...prev,
      expected_benefits: prev.expected_benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const removeExpectedBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      expected_benefits: prev.expected_benefits.filter((_, i) => i !== index)
    }));
  };

  const updateImpactAssessment = (field, value) => {
    setFormData(prev => ({
      ...prev,
      impact_assessment: {
        ...prev.impact_assessment,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            {improvement ? "Edit Process Improvement" : "Suggest Process Improvement"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="improvement_title">Improvement Title *</Label>
                <Input
                  id="improvement_title"
                  value={formData.improvement_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, improvement_title: e.target.value }))}
                  placeholder="Brief title for the improvement"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="process_id">Related Process</Label>
                <Select 
                  value={formData.process_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, process_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select process (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific process</SelectItem>
                    {processes.map(process => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.process_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the improvement idea in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suggested_by_name">Suggested By (Name)</Label>
                <Input
                  id="suggested_by_name"
                  value={formData.suggested_by_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, suggested_by_name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested_by_email">Suggested By (Email) *</Label>
                <Input
                  id="suggested_by_email"
                  type="email"
                  value={formData.suggested_by_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, suggested_by_email: e.target.value }))}
                  placeholder="your.email@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem_statement">Problem Statement</Label>
              <Textarea
                id="problem_statement"
                value={formData.problem_statement}
                onChange={(e) => setFormData(prev => ({ ...prev, problem_statement: e.target.value }))}
                placeholder="What problem does this improvement solve?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed_solution">Proposed Solution</Label>
              <Textarea
                id="proposed_solution"
                value={formData.proposed_solution}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_solution: e.target.value }))}
                placeholder="How would you solve this problem?"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Expected Benefits</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExpectedBenefit}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Benefit
                </Button>
              </div>
              
              {formData.expected_benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateExpectedBenefit(index, e.target.value)}
                    placeholder={`Benefit ${index + 1}`}
                  />
                  {formData.expected_benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpectedBenefit(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Impact Assessment</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time_savings">Time Savings (minutes/execution)</Label>
                  <Input
                    id="time_savings"
                    type="number"
                    value={formData.impact_assessment.time_savings}
                    onChange={(e) => updateImpactAssessment('time_savings', e.target.value)}
                    placeholder="e.g., 15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_savings">Cost Savings ($/execution)</Label>
                  <Input
                    id="cost_savings"
                    type="number"
                    step="0.01"
                    value={formData.impact_assessment.cost_savings}
                    onChange={(e) => updateImpactAssessment('cost_savings', e.target.value)}
                    placeholder="e.g., 25.50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality_improvement">Quality Improvement</Label>
                <Textarea
                  id="quality_improvement"
                  value={formData.impact_assessment.quality_improvement}
                  onChange={(e) => updateImpactAssessment('quality_improvement', e.target.value)}
                  placeholder="How will this improve quality?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_impact">Customer Impact</Label>
                <Textarea
                  id="customer_impact"
                  value={formData.impact_assessment.customer_impact}
                  onChange={(e) => updateImpactAssessment('customer_impact', e.target.value)}
                  placeholder="How will this affect customers?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effort_required">Effort Required</Label>
                <Select 
                  value={formData.impact_assessment.effort_required} 
                  onValueChange={(value) => updateImpactAssessment('effort_required', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Implemented">Implemented</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status !== 'Submitted' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_to_name">Assigned To (Name)</Label>
                  <Input
                    id="assigned_to_name"
                    value={formData.assigned_to_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to_name: e.target.value }))}
                    placeholder="Person implementing this"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_completion_date">Target Completion</Label>
                  <Input
                    id="target_completion_date"
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_completion_date: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                {improvement ? "Update Improvement" : "Submit Improvement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}