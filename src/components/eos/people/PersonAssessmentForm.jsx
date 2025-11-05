import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserCheck } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function PersonAssessmentForm({ assessment, client, seats, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    person_name: '',
    person_email: '',
    seat_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    core_values_scores: {},
    overall_core_values_score: 3,
    gwc_scores: {
      gets_it: 3,
      wants_it: 3,
      capacity: 3
    },
    overall_gwc_score: 3,
    right_person: true,
    right_seat: true,
    assessment_notes: '',
    action_items: [''],
    next_review_date: ''
  });

  useEffect(() => {
    if (assessment) {
      setFormData({
        person_name: assessment.person_name || '',
        person_email: assessment.person_email || '',
        seat_id: assessment.seat_id || '',
        assessment_date: assessment.assessment_date || new Date().toISOString().split('T')[0],
        core_values_scores: assessment.core_values_scores || {},
        overall_core_values_score: assessment.overall_core_values_score || 3,
        gwc_scores: assessment.gwc_scores || {
          gets_it: 3,
          wants_it: 3,
          capacity: 3
        },
        overall_gwc_score: assessment.overall_gwc_score || 3,
        right_person: assessment.right_person ?? true,
        right_seat: assessment.right_seat ?? true,
        assessment_notes: assessment.assessment_notes || '',
        action_items: assessment.action_items && assessment.action_items.length > 0 ? assessment.action_items : [''],
        next_review_date: assessment.next_review_date || ''
      });
    }
  }, [assessment]);

  useEffect(() => {
    // Calculate averages
    const gwcAverage = (formData.gwc_scores.gets_it + formData.gwc_scores.wants_it + formData.gwc_scores.capacity) / 3;
    setFormData(prev => ({
      ...prev,
      overall_gwc_score: gwcAverage,
      right_person: prev.overall_core_values_score >= 3,
      right_seat: gwcAverage >= 3
    }));
  }, [formData.gwc_scores, formData.overall_core_values_score]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      action_items: formData.action_items.filter(item => item.trim() !== '')
    };
    onSave(cleanedData);
  };

  const updateGWCScore = (field, value) => {
    setFormData(prev => ({
      ...prev,
      gwc_scores: {
        ...prev.gwc_scores,
        [field]: value[0] // Slider returns array
      }
    }));
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      action_items: [...prev.action_items, '']
    }));
  };

  const updateActionItem = (index, value) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeActionItem = (index) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }));
  };

  // Create core values sliders based on client's core values
  const coreValues = client.core_values || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            {assessment ? "Edit Person Assessment" : "New Person Assessment"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="person_name">Person Name *</Label>
                <Input
                  id="person_name"
                  value={formData.person_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="person_email">Email *</Label>
                <Input
                  id="person_email"
                  type="email"
                  value={formData.person_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_email: e.target.value }))}
                  placeholder="email@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seat_id">Accountability Seat</Label>
                <Select 
                  value={formData.seat_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, seat_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select seat (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific seat</SelectItem>
                    {seats.map(seat => (
                      <SelectItem key={seat.id} value={seat.id}>
                        {seat.seat_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment_date">Assessment Date</Label>
                <Input
                  id="assessment_date"
                  type="date"
                  value={formData.assessment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Core Values Assessment */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-lg font-semibold text-slate-900">Core Values Assessment</h4>
                <p className="text-sm text-slate-600">Rate alignment with company core values (1-5 scale)</p>
              </div>

              {coreValues.length > 0 ? (
                <div className="space-y-4">
                  {coreValues.map((value, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{value}</Label>
                        <span className="text-sm font-medium text-slate-600">
                          {formData.core_values_scores[value] || 3}
                        </span>
                      </div>
                      <Slider
                        value={[formData.core_values_scores[value] || 3]}
                        onValueChange={(val) => setFormData(prev => ({
                          ...prev,
                          core_values_scores: {
                            ...prev.core_values_scores,
                            [value]: val[0]
                          }
                        }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>1 - Poor</span>
                        <span>3 - Good</span>
                        <span>5 - Excellent</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Overall Core Values Score</Label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Overall alignment with core values</span>
                    <span className="text-sm font-medium text-slate-600">
                      {formData.overall_core_values_score}
                    </span>
                  </div>
                  <Slider
                    value={[formData.overall_core_values_score]}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, overall_core_values_score: val[0] }))}
                    max={5}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* GWC Assessment */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-lg font-semibold text-slate-900">GWC Assessment</h4>
                <p className="text-sm text-slate-600">Rate Gets it, Wants it, Capacity (1-5 scale)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Gets It</Label>
                    <span className="text-sm font-medium text-slate-600">
                      {formData.gwc_scores.gets_it}
                    </span>
                  </div>
                  <Slider
                    value={[formData.gwc_scores.gets_it]}
                    onValueChange={(val) => updateGWCScore('gets_it', val)}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">Understands the role and requirements</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Wants It</Label>
                    <span className="text-sm font-medium text-slate-600">
                      {formData.gwc_scores.wants_it}
                    </span>
                  </div>
                  <Slider
                    value={[formData.gwc_scores.wants_it]}
                    onValueChange={(val) => updateGWCScore('wants_it', val)}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">Has passion and desire for the role</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Capacity</Label>
                    <span className="text-sm font-medium text-slate-600">
                      {formData.gwc_scores.capacity}
                    </span>
                  </div>
                  <Slider
                    value={[formData.gwc_scores.capacity]}
                    onValueChange={(val) => updateGWCScore('capacity', val)}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">Has time, skill, and mental capacity</p>
                </div>
              </div>
            </div>

            {/* Assessment Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-slate-600">Right Person</div>
                <div className={`text-lg font-bold ${formData.right_person ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.right_person ? 'YES' : 'NO'}
                </div>
                <div className="text-xs text-slate-500">Core Values ≥ 3.0</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600">Right Seat</div>
                <div className={`text-lg font-bold ${formData.right_seat ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.right_seat ? 'YES' : 'NO'}
                </div>
                <div className="text-xs text-slate-500">GWC Average ≥ 3.0</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment_notes">Assessment Notes</Label>
              <Textarea
                id="assessment_notes"
                value={formData.assessment_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, assessment_notes: e.target.value }))}
                placeholder="Additional observations, strengths, areas for improvement..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Action Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                  Add Item
                </Button>
              </div>
              {formData.action_items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateActionItem(index, e.target.value)}
                    placeholder={`Action item ${index + 1}`}
                  />
                  {formData.action_items.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeActionItem(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_review_date">Next Review Date</Label>
              <Input
                id="next_review_date"
                type="date"
                value={formData.next_review_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_review_date: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {assessment ? "Update Assessment" : "Create Assessment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}