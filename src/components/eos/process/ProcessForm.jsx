import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Settings, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProcessForm({ process, client, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    process_name: '',
    process_description: '',
    category: 'Core',
    department: '',
    process_type: 'Operations',
    complexity_level: 'Moderate',
    frequency: 'Weekly',
    owner_name: '',
    owner_email: '',
    stakeholders: [],
    process_steps: [{ step_number: 1, step_name: '', description: '', responsible_role: '', estimated_duration: '', resources_needed: [], decision_point: false, quality_checkpoint: false }],
    inputs: [''],
    outputs: [''],
    kpis: [{ metric_name: '', target_value: '', current_value: '', unit: '' }],
    risks: [{ risk_description: '', probability: 'Medium', impact: 'Medium', mitigation_strategy: '' }],
    status: 'Draft',
    estimated_cycle_time: '',
    cost_per_execution: '',
    training_required: false,
    compliance_requirements: ['']
  });

  useEffect(() => {
    if (process) {
      setFormData({
        process_name: process.process_name || '',
        process_description: process.process_description || '',
        category: process.category || 'Core',
        department: process.department || '',
        process_type: process.process_type || 'Operations',
        complexity_level: process.complexity_level || 'Moderate',
        frequency: process.frequency || 'Weekly',
        owner_name: process.owner_name || '',
        owner_email: process.owner_email || '',
        stakeholders: process.stakeholders || [],
        process_steps: process.process_steps && process.process_steps.length > 0 ? process.process_steps : [{ step_number: 1, step_name: '', description: '', responsible_role: '', estimated_duration: '', resources_needed: [], decision_point: false, quality_checkpoint: false }],
        inputs: process.inputs && process.inputs.length > 0 ? process.inputs : [''],
        outputs: process.outputs && process.outputs.length > 0 ? process.outputs : [''],
        kpis: process.kpis && process.kpis.length > 0 ? process.kpis : [{ metric_name: '', target_value: '', current_value: '', unit: '' }],
        risks: process.risks && process.risks.length > 0 ? process.risks : [{ risk_description: '', probability: 'Medium', impact: 'Medium', mitigation_strategy: '' }],
        status: process.status || 'Draft',
        estimated_cycle_time: process.estimated_cycle_time || '',
        cost_per_execution: process.cost_per_execution || '',
        training_required: process.training_required || false,
        compliance_requirements: process.compliance_requirements && process.compliance_requirements.length > 0 ? process.compliance_requirements : ['']
      });
    }
  }, [process]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      process_steps: formData.process_steps.filter(step => step.step_name.trim() !== ''),
      inputs: formData.inputs.filter(input => input.trim() !== ''),
      outputs: formData.outputs.filter(output => output.trim() !== ''),
      kpis: formData.kpis.filter(kpi => kpi.metric_name.trim() !== ''),
      risks: formData.risks.filter(risk => risk.risk_description.trim() !== ''),
      compliance_requirements: formData.compliance_requirements.filter(req => req.trim() !== ''),
      estimated_cycle_time: formData.estimated_cycle_time ? parseInt(formData.estimated_cycle_time) : null,
      cost_per_execution: formData.cost_per_execution ? parseFloat(formData.cost_per_execution) : null
    };
    onSave(cleanedData);
  };

  const addProcessStep = () => {
    setFormData(prev => ({
      ...prev,
      process_steps: [...prev.process_steps, {
        step_number: prev.process_steps.length + 1,
        step_name: '',
        description: '',
        responsible_role: '',
        estimated_duration: '',
        resources_needed: [],
        decision_point: false,
        quality_checkpoint: false
      }]
    }));
  };

  const updateProcessStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      process_steps: prev.process_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeProcessStep = (index) => {
    setFormData(prev => ({
      ...prev,
      process_steps: prev.process_steps.filter((_, i) => i !== index)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'kpis' ? { metric_name: '', target_value: '', current_value: '', unit: '' } : 
               field === 'risks' ? { risk_description: '', probability: 'Medium', impact: 'Medium', mitigation_strategy: '' } : '']
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            {process ? "Edit Process" : "Create New Process"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="steps">Process Steps</TabsTrigger>
                <TabsTrigger value="metrics">Metrics & KPIs</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="process_name">Process Name *</Label>
                    <Input
                      id="process_name"
                      value={formData.process_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, process_name: e.target.value }))}
                      placeholder="e.g., Customer Onboarding Process"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Core">Core Process</SelectItem>
                        <SelectItem value="Support">Support Process</SelectItem>
                        <SelectItem value="Management">Management Process</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process_description">Process Description</Label>
                  <Textarea
                    id="process_description"
                    value={formData.process_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, process_description: e.target.value }))}
                    placeholder="Describe what this process accomplishes and its purpose..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="process_type">Process Type</Label>
                    <Select 
                      value={formData.process_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, process_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                        <SelectItem value="Quality">Quality</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complexity_level">Complexity</Label>
                    <Select 
                      value={formData.complexity_level} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, complexity_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simple">Simple</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                        <SelectItem value="As Needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Process Owner Name</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                      placeholder="Person responsible for this process"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner_email">Process Owner Email *</Label>
                    <Input
                      id="owner_email"
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner_email: e.target.value }))}
                      placeholder="owner@company.com"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Process Steps</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addProcessStep}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.process_steps.map((step, index) => (
                    <Card key={index} className="p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Step {index + 1}</h4>
                        {formData.process_steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProcessStep(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Step name"
                          value={step.step_name}
                          onChange={(e) => updateProcessStep(index, 'step_name', e.target.value)}
                        />
                        <Input
                          placeholder="Responsible role"
                          value={step.responsible_role}
                          onChange={(e) => updateProcessStep(index, 'responsible_role', e.target.value)}
                        />
                      </div>
                      
                      <Textarea
                        placeholder="Step description"
                        value={step.description}
                        onChange={(e) => updateProcessStep(index, 'description', e.target.value)}
                        className="mt-3"
                        rows={2}
                      />
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cycle_time">Estimated Cycle Time (minutes)</Label>
                    <Input
                      id="estimated_cycle_time"
                      type="number"
                      value={formData.estimated_cycle_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_cycle_time: e.target.value }))}
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_per_execution">Cost per Execution ($)</Label>
                    <Input
                      id="cost_per_execution"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_execution}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_execution: e.target.value }))}
                      placeholder="e.g., 25.50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Key Performance Indicators</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('kpis')}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add KPI
                    </Button>
                  </div>
                  
                  {formData.kpis.map((kpi, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Input
                          placeholder="Metric name"
                          value={kpi.metric_name}
                          onChange={(e) => updateArrayItem('kpis', index, { ...kpi, metric_name: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Target"
                          value={kpi.target_value}
                          onChange={(e) => updateArrayItem('kpis', index, { ...kpi, target_value: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Current"
                          value={kpi.current_value}
                          onChange={(e) => updateArrayItem('kpis', index, { ...kpi, current_value: e.target.value })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Unit"
                          value={kpi.unit}
                          onChange={(e) => updateArrayItem('kpis', index, { ...kpi, unit: e.target.value })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('kpis', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="governance" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Process Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Compliance Requirements</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('compliance_requirements')}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Requirement
                    </Button>
                  </div>
                  
                  {formData.compliance_requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={req}
                        onChange={(e) => updateArrayItem('compliance_requirements', index, e.target.value)}
                        placeholder="e.g., ISO 9001, GDPR, SOX"
                      />
                      {formData.compliance_requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('compliance_requirements', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                {process ? "Update Process" : "Create Process"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}