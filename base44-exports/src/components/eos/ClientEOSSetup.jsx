import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, X, Building2, Users, Briefcase } from 'lucide-react';

export default function ClientEOSSetup({ client, onComplete, onSkip }) {
  const [formData, setFormData] = useState({
    industry: client?.industry || '',
    employee_count: client?.employee_count || '',
    core_values: client?.core_values || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      ...formData,
      employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
      core_values: formData.core_values.filter(value => value.trim() !== '')
    });
  };

  const addCoreValue = () => {
    setFormData(prev => ({
      ...prev,
      core_values: [...prev.core_values, '']
    }));
  };

  const updateCoreValue = (index, value) => {
    setFormData(prev => ({
      ...prev,
      core_values: prev.core_values.map((val, i) => i === index ? value : val)
    }));
  };

  const removeCoreValue = (index) => {
    setFormData(prev => ({
      ...prev,
      core_values: prev.core_values.filter((_, i) => i !== index)
    }));
  };

  const isFormValid = formData.industry.trim() && formData.employee_count && formData.core_values.some(val => val.trim());

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-600" />
          EOS Setup for {client.name}
        </CardTitle>
        <p className="text-slate-600 mt-2">
          To get started with EOS implementation, we need some basic information about the company.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Industry
            </Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g., Technology, Healthcare, Manufacturing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_count" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Number of Employees
            </Label>
            <Input
              id="employee_count"
              type="number"
              min="1"
              value={formData.employee_count}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_count: e.target.value }))}
              placeholder="e.g., 25"
              required
            />
            <p className="text-xs text-slate-500">EOS is typically best for companies with 10-250 employees</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Core Values (3-7 recommended)
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addCoreValue}>
                <Plus className="w-4 h-4 mr-1" />
                Add Value
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Core values are the essential and enduring principles that guide your company's behavior and decision-making.
            </p>
            
            {formData.core_values.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-slate-400 text-sm">No core values added yet</p>
              </div>
            )}
            
            {formData.core_values.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => updateCoreValue(index, e.target.value)}
                  placeholder={`Core Value ${index + 1}`}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => removeCoreValue(index)}
                  className="px-3"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {formData.core_values.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.core_values.filter(val => val.trim()).map((value, index) => (
                  <Badge key={index} variant="outline">
                    {value}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
              Skip for Now
            </Button>
            <Button type="submit" disabled={!isFormValid} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Complete Setup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}