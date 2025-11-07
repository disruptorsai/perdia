import React, { useState, useEffect } from 'react';
import { AutomationSettings } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Save, Loader2, Play, Pause, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AutomationControls() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await AutomationSettings.list('-created_date', 1);
      if (data.length > 0) {
        setSettings(data[0]);
      } else {
        // Create default settings
        const defaultSettings = {
          automation_mode: 'manual',
          new_content_frequency: 3,
          optimization_frequency: 8,
          auto_publish_enabled: false,
          require_human_review: true,
          keyword_rotation_enabled: true,
          internal_linking_enabled: true,
          media_generation_enabled: true,
          target_daily_traffic: 4000,
          current_phase: 'testing',
          paused: false
        };
        const created = await AutomationSettings.create(defaultSettings);
        setSettings(created);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AutomationSettings.update(settings.id, settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    const newPausedState = !settings.paused;
    setSettings({ ...settings, paused: newPausedState });
    
    try {
      await AutomationSettings.update(settings.id, { paused: newPausedState });
      toast.success(newPausedState ? 'Automation paused' : 'Automation resumed');
    } catch (error) {
      console.error("Error toggling pause:", error);
      toast.error("Failed to toggle automation");
      setSettings({ ...settings, paused: !newPausedState });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-600" />
            Automation Controls
          </h1>
          <p className="text-slate-600 mt-1">Configure automation levels and content generation frequency</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={settings?.paused ? "default" : "outline"}
            onClick={handleTogglePause}
            className={settings?.paused ? "" : "text-red-600 border-red-600 hover:bg-red-50"}
          >
            {settings?.paused ? (
              <><Play className="w-4 h-4 mr-2" /> Resume</>
            ) : (
              <><Pause className="w-4 h-4 mr-2" /> Pause All</>
            )}
          </Button>
        </div>
      </div>

      {settings?.paused && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Automation is currently <strong>paused</strong>. No content will be generated until you resume.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 capitalize">{settings?.automation_mode?.replace('_', ' ')}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 capitalize">{settings?.current_phase}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={settings?.paused ? "bg-red-500" : "bg-green-500"}>
              {settings?.paused ? 'Paused' : 'Active'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Mode</CardTitle>
          <CardDescription>
            Choose how much human oversight is required for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="automation-mode">Mode</Label>
            <Select 
              value={settings?.automation_mode} 
              onValueChange={(value) => setSettings({ ...settings, automation_mode: value })}
            >
              <SelectTrigger id="automation-mode" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div className="py-1">
                    <div className="font-semibold">Manual</div>
                    <div className="text-xs text-slate-500">Human initiates all content generation</div>
                  </div>
                </SelectItem>
                <SelectItem value="semi_automatic">
                  <div className="py-1">
                    <div className="font-semibold">Semi-Automatic</div>
                    <div className="text-xs text-slate-500">AI generates, human approves before publishing</div>
                  </div>
                </SelectItem>
                <SelectItem value="full_automatic">
                  <div className="py-1">
                    <div className="font-semibold">Full Automatic</div>
                    <div className="text-xs text-slate-500">AI generates and publishes automatically</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="current-phase">Current Phase</Label>
            <Select 
              value={settings?.current_phase} 
              onValueChange={(value) => setSettings({ ...settings, current_phase: value })}
            >
              <SelectTrigger id="current-phase" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="testing">Testing (Low volume, high oversight)</SelectItem>
                <SelectItem value="scaling">Scaling (Increasing volume)</SelectItem>
                <SelectItem value="autonomous">Autonomous (Full automation)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Generation Frequency</CardTitle>
          <CardDescription>
            Set how many pieces of content to generate per day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="new-content">New Articles Per Day</Label>
            <Input
              id="new-content"
              type="number"
              min="0"
              max="100"
              value={settings?.new_content_frequency || 0}
              onChange={(e) => setSettings({ ...settings, new_content_frequency: parseInt(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Target: Start with 2-3, scale to 100+ per week</p>
          </div>

          <div>
            <Label htmlFor="optimizations">Page Optimizations Per Day</Label>
            <Input
              id="optimizations"
              type="number"
              min="0"
              max="100"
              value={settings?.optimization_frequency || 0}
              onChange={(e) => setSettings({ ...settings, optimization_frequency: parseInt(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Target: Start with 6-8, scale to 20+ per day</p>
          </div>

          <div>
            <Label htmlFor="target-traffic">Target Daily Traffic</Label>
            <Input
              id="target-traffic"
              type="number"
              min="0"
              value={settings?.target_daily_traffic || 0}
              onChange={(e) => setSettings({ ...settings, target_daily_traffic: parseInt(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Goal: 4,000-6,000 daily visitors</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Features</CardTitle>
          <CardDescription>
            Enable or disable specific automation capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Auto-Publish Approved Content</Label>
              <p className="text-sm text-slate-500">Automatically publish content after approval</p>
            </div>
            <Switch
              checked={settings?.auto_publish_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_publish_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Require Human Review</Label>
              <p className="text-sm text-slate-500">All content must be reviewed before publishing</p>
            </div>
            <Switch
              checked={settings?.require_human_review || false}
              onCheckedChange={(checked) => setSettings({ ...settings, require_human_review: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Keyword Rotation</Label>
              <p className="text-sm text-slate-500">Automatically cycle through keywords</p>
            </div>
            <Switch
              checked={settings?.keyword_rotation_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, keyword_rotation_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Auto Internal Linking</Label>
              <p className="text-sm text-slate-500">Automatically add internal links to content</p>
            </div>
            <Switch
              checked={settings?.internal_linking_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, internal_linking_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>AI Media Generation</Label>
              <p className="text-sm text-slate-500">Generate images and infographics with AI</p>
            </div>
            <Switch
              checked={settings?.media_generation_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, media_generation_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}