
import React, { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/api/entities';
import { SocialPost } from '@/api/entities';
import CalendarView from '../components/blog/CalendarView';
import PostEditorModal from '../components/blog/PostEditorModal';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar } from 'lucide-react';
import SocialPostEditorModal from '../components/social/SocialPostEditorModal';

export default function ContentCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [blogPostData, socialPostData] = await Promise.all([
        BlogPost.filter({ status: 'Scheduled' }),
        SocialPost.filter({ status: 'Scheduled' })
      ]);
      
      const blogEvents = blogPostData.map(post => ({
        ...post,
        type: 'blog',
        date: post.scheduled_date
      }));
      
      const socialEvents = socialPostData.map(post => ({
        ...post,
        type: 'social',
        title: post.channel,
        date: post.scheduled_date
      }));

      setEvents([...blogEvents, ...socialEvents]);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      toast({
        title: "Error",
        description: "Could not load calendar data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  const handleEventSelect = (event) => {
    setEditingEvent(event);
  };

  const handlePostUpdate = async (updatedData) => {
    if (!editingEvent) return;

    try {
      if (editingEvent.type === 'blog') {
        await BlogPost.update(editingEvent.id, updatedData);
        toast({
          title: "Article Updated",
          description: `"${updatedData.title}" has been saved successfully.`,
        });
      } else if (editingEvent.type === 'social') {
        await SocialPost.update(editingEvent.id, updatedData);
        toast({
            title: "Social Post Updated",
            description: `Post for ${updatedData.channel} has been saved.`,
        });
      }
      
      setEditingEvent(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Update Failed",
        description: "Could not save the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderEditorModal = () => {
    if (!editingEvent) return null;

    if (editingEvent.type === 'blog') {
        return (
            <PostEditorModal 
                post={editingEvent}
                onSave={handlePostUpdate}
                onClose={() => setEditingEvent(null)}
            />
        );
    }

    if (editingEvent.type === 'social') {
        return (
            <SocialPostEditorModal
                post={editingEvent}
                onSave={handlePostUpdate}
                onClose={() => setEditingEvent(null)}
            />
        );
    }

    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 pcc-text-blue" />
              Content Calendar
            </h1>
            <p className="text-slate-600 mt-1">Global overview of all scheduled blog and social media content.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <CalendarView events={events} onEventSelect={handleEventSelect} />
        )}
      </div>
      {renderEditorModal()}
    </div>
  );
}
