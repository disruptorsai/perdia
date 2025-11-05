
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import QuarterlySessionForm from './QuarterlySessionForm';
import { EOSQuarterlySession } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";

export default function QuarterlyPlanning({ client }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const { toast } = useToast();

  const loadSessions = useCallback(async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const sessionData = await EOSQuarterlySession.filter({ client_id: client.id }, '-session_date');
      setSessions(sessionData);
    } catch (error) {
      console.error('Error loading quarterly sessions:', error);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    if (client) {
      loadSessions();
    }
  }, [client, loadSessions]);

  const handleSaveSession = async (sessionData) => {
    try {
      if (editingSession) {
        await EOSQuarterlySession.update(editingSession.id, sessionData);
        toast({
          title: "Session Updated",
          description: "The quarterly planning session has been updated successfully.",
        });
      } else {
        await EOSQuarterlySession.create({ ...sessionData, client_id: client.id });
        toast({
          title: "Session Scheduled",
          description: "The quarterly planning session has been scheduled successfully.",
        });
      }
      
      setShowForm(false);
      setEditingSession(null);
      loadSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (confirm('Are you sure you want to delete this quarterly planning session?')) {
      try {
        await EOSQuarterlySession.delete(sessionId);
        toast({
          title: "Session Deleted",
          description: "The quarterly planning session has been deleted.",
        });
        loadSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
        toast({
          title: "Error",
          description: "Failed to delete session. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuarterFromDate = (date) => {
    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  };

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
          <h3 className="text-xl font-bold text-slate-900">Quarterly Planning Sessions</h3>
          <p className="text-slate-600 mt-1">Schedule and manage your EOS quarterly planning sessions</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            setEditingSession(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Planning Sessions Scheduled</h3>
            <p className="text-slate-500 mb-6">Schedule your quarterly planning sessions to keep your team aligned and focused</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingSession(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sessions.map(session => (
            <Card key={session.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      {getQuarterFromDate(session.session_date)} Planning Session
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(session.session_date), 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.start_time} - {session.end_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {session.attendee_emails?.length || 0} attendees
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSession(session);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        Attendees
                      </h4>
                      {session.attendee_emails && session.attendee_emails.length > 0 ? (
                        <div className="space-y-1">
                          {session.attendee_emails.map((email, index) => (
                            <div key={index} className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded">
                              {email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">No attendees specified</p>
                      )}
                    </div>
                    
                    {session.location && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Location</h4>
                        <p className="text-sm text-slate-600">{session.location}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        Agenda Items
                      </h4>
                      {session.agenda_items && session.agenda_items.length > 0 ? (
                        <ul className="space-y-1">
                          {session.agenda_items.map((item, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 text-sm">No agenda items specified</p>
                      )}
                    </div>

                    {session.objectives && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Session Objectives</h4>
                        <p className="text-sm text-slate-600">{session.objectives}</p>
                      </div>
                    )}
                  </div>
                </div>

                {session.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <QuarterlySessionForm
          session={editingSession}
          onSave={handleSaveSession}
          onCancel={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
}
