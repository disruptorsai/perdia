import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const TrainingInterface = () => {
  const [settings, setSettings] = useState(null);
  const [writingDirectives, setWritingDirectives] = useState('');
  const [focusKeywords, setFocusKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('automation_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSettings(data);
          setWritingDirectives(data.ai_writing_directives || '');
          setFocusKeywords(data.focus_keywords || '');
        } else if (error && error.code === 'PGRST116') { // No rows found
          // Create a new settings record if one doesn't exist
          const { data: newSettings, error: insertError } = await supabase
            .from('automation_settings')
            .insert({ user_id: user.id })
            .single();
          
          if (newSettings) {
            setSettings(newSettings);
          } else {
            console.error('Error creating settings:', insertError);
          }
        } else {
          console.error('Error fetching settings:', error);
        }
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && settings) {
      const { error } = await supabase
        .from('automation_settings')
        .update({
          ai_writing_directives: writingDirectives,
          focus_keywords: focusKeywords,
        })
        .eq('id', settings.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Settings saved successfully.',
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">AI Training</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="focusKeywords" className="font-bold">Focus Keywords</label>
          <p className="text-sm text-gray-500 mb-2">Enter comma-separated keywords to guide the AI.</p>
          <Input
            id="focusKeywords"
            value={focusKeywords}
            onChange={(e) => setFocusKeywords(e.target.value)}
            placeholder="e.g., seo, content marketing, ai writing"
          />
        </div>
        <div>
          <label htmlFor="writingDirectives" className="font-bold">AI Writing Directives</label>
          <p className="text-sm text-gray-500 mb-2">Provide detailed instructions for the AI's tone, style, and content.</p>
          <Textarea
            id="writingDirectives"
            value={writingDirectives}
            onChange={(e) => setWritingDirectives(e.target.value)}
            rows={10}
            placeholder="e.g., Write in a friendly and approachable tone. Avoid jargon. Use short sentences."
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default TrainingInterface;