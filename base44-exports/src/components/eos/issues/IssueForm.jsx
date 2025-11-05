import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle } from 'lucide-react';

export default function IssueForm({ issue, client, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    owner_name: '',
    owner_email: '',
    category: '',
    status: 'Identified',
    target_resolution_date: '',
    resolution_notes: ''
  });

  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        priority: issue.priority || 3,
        owner_name: issue.owner_name || '',
        owner_email: issue.owner_email || '',
        category: issue.category || '',
        status: issue.status || 'Identified',
        target_resolution_date: issue.target_resolution_date || '',
        resolution_notes: issue.resolution_notes || ''
      });
    }
  }, [issue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      priority: parseInt(formData.priority),
      target_resolution_date: formData.target_resolution_date || null
    };
    onSave(cleanedData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            {issue ? "Edit Issue" : "Identify New Issue"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Clearly describe the issue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Issue Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed context about the issue, its impact, and any relevant background information..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Critical (Crisis/Emergency)</SelectItem>
                    <SelectItem value="2">2 - High (Urgent - 1 week)</SelectItem>
                    <SelectItem value="3">3 - Medium (Important - 1 month)</SelectItem>
                    <SelectItem value="4">4 - Low (1 quarter)</SelectItem>
                    <SelectItem value="5">5 - Very Low (When time permits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">EOS Component</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific component</SelectItem>
                    <SelectItem value="Vision">Vision</SelectItem>
                    <SelectItem value="People">People</SelectItem>
                    <SelectItem value="Data">Data</SelectItem>
                    <SelectItem value="Issues">Issues</SelectItem>
                    <SelectItem value="Process">Process</SelectItem>
                    <SelectItem value="Traction">Traction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Issue Owner (Name)</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                  placeholder="Person responsible for resolving"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_email">Issue Owner (Email)</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_email: e.target.value }))}
                  placeholder="owner@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">IDS Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Identified">Identified</SelectItem>
                    <SelectItem value="Discussing">Discussing</SelectItem>
                    <SelectItem value="Solving">Solving</SelectItem>
                    <SelectItem value="Solved">Solved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_resolution_date">Target Resolution Date</Label>
                <Input
                  id="target_resolution_date"
                  type="date"
                  value={formData.target_resolution_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_resolution_date: e.target.value }))}
                />
              </div>
            </div>

            {formData.status === 'Solved' && (
              <div className="space-y-2">
                <Label htmlFor="resolution_notes">Resolution Notes</Label>
                <Textarea
                  id="resolution_notes"
                  value={formData.resolution_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, resolution_notes: e.target.value }))}
                  placeholder="Describe how this issue was permanently solved..."
                  rows={3}
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">IDS Methodology Reminder</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Identify:</strong> Clearly identify the real issue, not just symptoms</div>
                <div><strong>Discuss:</strong> Have open, honest discussion with all stakeholders</div>
                <div><strong>Solve:</strong> Implement a permanent solution that prevents recurrence</div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                {issue ? "Update Issue" : "Identify Issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}