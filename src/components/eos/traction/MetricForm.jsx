import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, BarChart3 } from 'lucide-react';

export default function MetricForm({ metric, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    metric_name: metric?.metric_name || '',
    description: metric?.description || '',
    category: metric?.category || '',
    owner_email: metric?.owner_email || '',
    target_value: metric?.target_value || 0,
    target_type: metric?.target_type || 'minimum',
    unit: metric?.unit || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.metric_name || !formData.owner_email || formData.target_value === '') {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            {metric ? 'Edit Metric' : 'Add New Metric'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric_name">Metric Name *</Label>
                <Input
                  id="metric_name"
                  value={formData.metric_name}
                  onChange={(e) => handleInputChange('metric_name', e.target.value)}
                  placeholder="e.g., Weekly Sales Calls"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="e.g., Sales, Marketing, Operations"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What does this metric measure?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_value">Target Value *</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) => handleInputChange('target_value', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_type">Target Type *</Label>
                <Select value={formData.target_type} onValueChange={(value) => handleInputChange('target_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimum">Minimum (≥)</SelectItem>
                    <SelectItem value="maximum">Maximum (≤)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="e.g., calls, $, %"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_email">Owner Email *</Label>
              <Input
                id="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={(e) => handleInputChange('owner_email', e.target.value)}
                placeholder="person.responsible@company.com"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {metric ? 'Update Metric' : 'Create Metric'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}