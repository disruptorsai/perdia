import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function QuarterlySessionForm({ session, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    session_date: session?.session_date ? format(new Date(session.session_date), 'yyyy-MM-dd') : '',
    start_time: session?.start_time || '09:00',
    end_time: session?.end_time || '17:00',
    location: session?.location || '',
    objectives: session?.objectives || '',
    attendee_emails: session?.attendee_emails || [],
    agenda_items: session?.agenda_items || [],
    status: session?.status || 'scheduled',
    notes: session?.notes || ''
  });

  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAgendaItem, setNewAgendaItem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.session_date || !formData.start_time || !formData.end_time) {
      alert('Please fill in the required fields (date, start time, end time)');
      return;
    }
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAttendee = () => {
    if (newAttendeeEmail.trim() && !formData.attendee_emails.includes(newAttendeeEmail.trim())) {
      setFormData(prev => ({
        ...prev,
        attendee_emails: [...prev.attendee_emails, newAttendeeEmail.trim()]
      }));
      setNewAttendeeEmail('');
    }
  };

  const removeAttendee = (index) => {
    setFormData(prev => ({
      ...prev,
      attendee_emails: prev.attendee_emails.filter((_, i) => i !== index)
    }));
  };

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda_items: [...prev.agenda_items, newAgendaItem.trim()]
      }));
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (index) => {
    setFormData(prev => ({
      ...prev,
      agenda_items: prev.agenda_items.filter((_, i) => i !== index)
    }));
  };

  const defaultAgendaItems = [
    'Segue (Personal and Business Check-in)',
    'Scorecard Review',
    'Rock Review',
    'Customer/Employee Headlines',
    'To-Do List Review',
    'IDS (Issues List)',
    'Next Quarter Rock Setting',
    'Next Meeting Date',
    'Action Items and Conclusion'
  ];

  const addDefaultAgenda = () => {
    setFormData(prev => ({
      ...prev,
      agenda_items: [...new Set([...prev.agenda_items, ...defaultAgendaItems])]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-white z-10">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            {session ? 'Edit Quarterly Planning Session' : 'Schedule Quarterly Planning Session'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_date">Session Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Conference room, Zoom link, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <Label htmlFor="objectives">Session Objectives</Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => handleInputChange('objectives', e.target.value)}
                placeholder="What do you want to accomplish in this session?"
                rows={3}
              />
            </div>

            {/* Attendees Section */}
            <div className="space-y-3">
              <Label>Attendees</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newAttendeeEmail}
                  onChange={(e) => setNewAttendeeEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                />
                <Button type="button" onClick={addAttendee} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.attendee_emails.length > 0 && (
                <div className="space-y-2">
                  {formData.attendee_emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
                      <span className="text-sm">{email}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAttendee(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agenda Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Agenda Items</Label>
                <Button type="button" onClick={addDefaultAgenda} variant="outline" size="sm">
                  Add Default EOS Agenda
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter agenda item"
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAgendaItem())}
                />
                <Button type="button" onClick={addAgendaItem} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.agenda_items.length > 0 && (
                <div className="space-y-2">
                  {formData.agenda_items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
                      <span className="text-sm">{item}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAgendaItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Preparation notes, special instructions, etc."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {session ? 'Update Session' : 'Schedule Session'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}