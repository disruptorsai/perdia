import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Target } from 'lucide-react';

export default function AccountabilitySeatForm({ seat, client, seats, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    seat_name: '',
    level: 1,
    reports_to_seat_id: '',
    core_responsibilities: [''],
    key_metrics: [''],
    gwc_requirements: {
      gets_it: '',
      wants_it: '',
      capacity: ''
    },
    status: 'empty',
    filled_by_name: '',
    filled_by_email: ''
  });

  useEffect(() => {
    if (seat) {
      setFormData({
        seat_name: seat.seat_name || '',
        level: seat.level || 1,
        reports_to_seat_id: seat.reports_to_seat_id || '',
        core_responsibilities: seat.core_responsibilities && seat.core_responsibilities.length > 0 ? seat.core_responsibilities : [''],
        key_metrics: seat.key_metrics && seat.key_metrics.length > 0 ? seat.key_metrics : [''],
        gwc_requirements: seat.gwc_requirements || {
          gets_it: '',
          wants_it: '',
          capacity: ''
        },
        status: seat.status || 'empty',
        filled_by_name: seat.filled_by_name || '',
        filled_by_email: seat.filled_by_email || ''
      });
    }
  }, [seat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      core_responsibilities: formData.core_responsibilities.filter(r => r.trim() !== ''),
      key_metrics: formData.key_metrics.filter(m => m.trim() !== ''),
      level: parseInt(formData.level)
    };
    onSave(cleanedData);
  };

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      core_responsibilities: [...prev.core_responsibilities, '']
    }));
  };

  const updateResponsibility = (index, value) => {
    setFormData(prev => ({
      ...prev,
      core_responsibilities: prev.core_responsibilities.map((resp, i) => i === index ? value : resp)
    }));
  };

  const removeResponsibility = (index) => {
    setFormData(prev => ({
      ...prev,
      core_responsibilities: prev.core_responsibilities.filter((_, i) => i !== index)
    }));
  };

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      key_metrics: [...prev.key_metrics, '']
    }));
  };

  const updateMetric = (index, value) => {
    setFormData(prev => ({
      ...prev,
      key_metrics: prev.key_metrics.map((metric, i) => i === index ? value : metric)
    }));
  };

  const removeMetric = (index) => {
    setFormData(prev => ({
      ...prev,
      key_metrics: prev.key_metrics.filter((_, i) => i !== index)
    }));
  };

  const updateGWC = (field, value) => {
    setFormData(prev => ({
      ...prev,
      gwc_requirements: {
        ...prev.gwc_requirements,
        [field]: value
      }
    }));
  };

  const availableParentSeats = seats.filter(s => 
    s.id !== seat?.id && s.level < formData.level
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            {seat ? "Edit Accountability Seat" : "Create New Accountability Seat"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seat_name">Seat Name *</Label>
                <Input
                  id="seat_name"
                  value={formData.seat_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, seat_name: e.target.value }))}
                  placeholder="e.g., Sales Manager, Operations Lead"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Organizational Level *</Label>
                <Select 
                  value={formData.level.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {availableParentSeats.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="reports_to">Reports To</Label>
                <Select 
                  value={formData.reports_to_seat_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reports_to_seat_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent seat (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No parent seat</SelectItem>
                    {availableParentSeats.map(parentSeat => (
                      <SelectItem key={parentSeat.id} value={parentSeat.id}>
                        {parentSeat.seat_name} (Level {parentSeat.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Core Responsibilities (5-7 recommended)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addResponsibility}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {formData.core_responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.core_responsibilities.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeResponsibility(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Key Metrics (2-3 recommended)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMetric}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {formData.key_metrics.map((metric, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={metric}
                    onChange={(e) => updateMetric(index, e.target.value)}
                    placeholder={`Metric ${index + 1}`}
                  />
                  {formData.key_metrics.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeMetric(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">GWC Requirements</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gets_it">Gets It</Label>
                  <Textarea
                    id="gets_it"
                    value={formData.gwc_requirements.gets_it}
                    onChange={(e) => updateGWC('gets_it', e.target.value)}
                    placeholder="What must this person understand? What knowledge, experience, or insights are required?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wants_it">Wants It</Label>
                  <Textarea
                    id="wants_it"
                    value={formData.gwc_requirements.wants_it}
                    onChange={(e) => updateGWC('wants_it', e.target.value)}
                    placeholder="What passion, drive, or motivation should this person have for this role?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Textarea
                    id="capacity"
                    value={formData.gwc_requirements.capacity}
                    onChange={(e) => updateGWC('capacity', e.target.value)}
                    placeholder="What skills, time availability, and mental/physical capacity are needed?"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Seat Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Empty (Open Position)</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="issues">Has Issues</SelectItem>
                    <SelectItem value="transition">In Transition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'filled' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="filled_by_name">Person Name</Label>
                    <Input
                      id="filled_by_name"
                      value={formData.filled_by_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, filled_by_name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filled_by_email">Person Email</Label>
                    <Input
                      id="filled_by_email"
                      type="email"
                      value={formData.filled_by_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, filled_by_email: e.target.value }))}
                      placeholder="email@company.com"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {seat ? "Update Seat" : "Create Seat"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}