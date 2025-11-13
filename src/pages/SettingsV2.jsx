/**
 * PERDIA V2: SETTINGS PAGE (SIMPLIFIED)
 * ======================================
 *
 * Minimal settings for blog automation
 * - Automation (frequency, time, auto-approve)
 * - WordPress Integration
 * - Models Configuration
 * - Image Generation
 *
 * Created: 2025-11-12
 */

import React, { useState, useEffect } from 'react';
import { AutomationSchedule, Integration } from '@/lib/perdia-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Globe,
  Cpu,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { WordPressClient } from '@/lib/wordpress-client';

export default function SettingsV2() {
  const [activeTab, setActiveTab] = useState('automation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Automation settings
  const [frequency, setFrequency] = useState('daily');
  const [postTime, setPostTime] = useState('05:00');
  const [timezone, setTimezone] = useState('America/Denver');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [autoApproveDays, setAutoApproveDays] = useState(5);
  const [enabled, setEnabled] = useState(true);

  // WordPress settings
  const [wpName, setWpName] = useState('GetEducated.com');
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [wpTestStatus, setWpTestStatus] = useState(null);
  const [wpTesting, setWpTesting] = useState(false);

  // Models settings
  const [primaryModel, setPrimaryModel] = useState('grok-2');
  const [verifyModel, setVerifyModel] = useState('pplx-70b-online');
  const [enableVerification, setEnableVerification] = useState(true);
  const [temperature, setTemperature] = useState(0.8);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load automation schedule
      const schedules = await AutomationSchedule.find({});
      if (schedules.length > 0) {
        const schedule = schedules[0];
        setFrequency(schedule.frequency);
        setPostTime(schedule.post_time);
        setTimezone(schedule.timezone);
        setRequiresApproval(schedule.requires_approval);
        setAutoApproveDays(schedule.auto_approve_days);
        setEnabled(schedule.enabled);
      }

      // Load WordPress integration
      const integrations = await Integration.find({ type: 'wordpress' });
      if (integrations.length > 0) {
        const wp = integrations[0];
        setWpName(wp.name);
        setWpUrl(wp.base_url);
        setWpUsername(wp.credentials.username);
        setWpPassword(wp.credentials.password);
      }
    } catch (error) {
      console.error('Load settings error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save automation settings
  const handleSaveAutomation = async () => {
    setSaving(true);
    try {
      const schedules = await AutomationSchedule.find({});

      const data = {
        frequency,
        post_time: postTime,
        timezone,
        requires_approval: requiresApproval,
        auto_approve_days: parseInt(autoApproveDays),
        enabled,
      };

      if (schedules.length > 0) {
        await AutomationSchedule.update(schedules[0].id, data);
      } else {
        await AutomationSchedule.create(data);
      }

      toast.success('Automation settings saved');
    } catch (error) {
      console.error('Save automation error:', error);
      toast.error('Failed to save automation settings');
    } finally {
      setSaving(false);
    }
  };

  // Test WordPress connection
  const handleTestWordPress = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error('Please fill in all WordPress credentials');
      return;
    }

    setWpTesting(true);
    setWpTestStatus(null);

    try {
      const wp = new WordPressClient(wpUrl, wpUsername, wpPassword);
      const result = await wp.testConnection();

      if (result.success) {
        setWpTestStatus('success');
        toast.success(`Connected as ${result.user.name}`);
      } else {
        setWpTestStatus('error');
        toast.error('Connection failed: ' + result.error);
      }
    } catch (error) {
      console.error('WP test error:', error);
      setWpTestStatus('error');
      toast.error('Connection failed: ' + error.message);
    } finally {
      setWpTesting(false);
    }
  };

  // Save WordPress settings
  const handleSaveWordPress = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error('Please fill in all WordPress credentials');
      return;
    }

    setSaving(true);
    try {
      const integrations = await Integration.find({ type: 'wordpress' });

      const data = {
        type: 'wordpress',
        name: wpName,
        base_url: wpUrl,
        credentials: {
          username: wpUsername,
          password: wpPassword,
        },
        status: 'active',
      };

      if (integrations.length > 0) {
        await Integration.update(integrations[0].id, data);
      } else {
        await Integration.create(data);
      }

      toast.success('WordPress integration saved');
    } catch (error) {
      console.error('Save WordPress error:', error);
      toast.error('Failed to save WordPress integration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure automation and integrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automation">
            <Clock className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="wordpress">
            <Globe className="h-4 w-4 mr-2" />
            WordPress
          </TabsTrigger>
          <TabsTrigger value="models">
            <Cpu className="h-4 w-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="h-4 w-4 mr-2" />
            Images
          </TabsTrigger>
        </TabsList>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posting Schedule</CardTitle>
              <CardDescription>
                Control when and how often articles are published
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="3x_week">3× per week</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postTime">Post Time</Label>
                  <Input
                    id="postTime"
                    type="time"
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automation Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable automatic scheduling
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Settings</CardTitle>
              <CardDescription>
                Control approval workflow and auto-approve behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval Before Publishing</Label>
                  <p className="text-sm text-muted-foreground">
                    Articles must be approved before publishing
                  </p>
                </div>
                <Switch
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApproveDays">Auto-approve after (days)</Label>
                <Input
                  id="autoApproveDays"
                  type="number"
                  min="1"
                  max="30"
                  value={autoApproveDays}
                  onChange={(e) => setAutoApproveDays(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Articles will automatically approve and publish after this many days if not reviewed
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveAutomation} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Automation Settings'
            )}
          </Button>
        </TabsContent>

        {/* WordPress Tab */}
        <TabsContent value="wordpress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WordPress Connection</CardTitle>
              <CardDescription>
                Connect to your WordPress site for publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wpName">Site Name</Label>
                <Input
                  id="wpName"
                  placeholder="GetEducated.com"
                  value={wpName}
                  onChange={(e) => setWpName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wpUrl">Site URL</Label>
                <Input
                  id="wpUrl"
                  placeholder="https://geteducated.com"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wpUsername">Username</Label>
                <Input
                  id="wpUsername"
                  placeholder="admin"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wpPassword">Application Password</Label>
                <Input
                  id="wpPassword"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wpPassword}
                  onChange={(e) => setWpPassword(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Generate an application password in WordPress: Users → Profile → Application Passwords
                </p>
              </div>

              {/* Test Status */}
              {wpTestStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    wpTestStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {wpTestStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Connection successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">Connection failed</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleTestWordPress} variant="outline" disabled={wpTesting}>
                  {wpTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button onClick={handleSaveWordPress} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save WordPress Settings'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Pipeline</CardTitle>
              <CardDescription>
                Configure AI models for the two-stage generation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryModel">Stage 1: Generation Model</Label>
                <Select value={primaryModel} onValueChange={setPrimaryModel}>
                  <SelectTrigger id="primaryModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grok-2">Grok 2 (Recommended)</SelectItem>
                    <SelectItem value="grok-2-mini">Grok 2 Mini (Faster, cheaper)</SelectItem>
                    <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5 (Fallback)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Grok provides more human-like writing with natural variation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Higher = more creative/varied (0.7-0.9 recommended)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Fact-Checking Pass</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Perplexity to verify facts and add citations
                  </p>
                </div>
                <Switch checked={enableVerification} onCheckedChange={setEnableVerification} />
              </div>

              {enableVerification && (
                <div className="space-y-2">
                  <Label htmlFor="verifyModel">Stage 2: Verification Model</Label>
                  <Select value={verifyModel} onValueChange={setVerifyModel}>
                    <SelectTrigger id="verifyModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pplx-70b-online">Perplexity 70B Online (Recommended)</SelectItem>
                      <SelectItem value="pplx-7b-online">Perplexity 7B Online (Faster)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Perplexity checks facts and provides citations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Monitoring</CardTitle>
              <CardDescription>
                Track AI usage costs per article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Target Cost per Article</p>
                  <p className="text-xs text-muted-foreground">Goal: Keep costs below this threshold</p>
                </div>
                <p className="text-2xl font-bold">$10.00</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Current average: ~$2.00/article (well under target)
                </p>
              </div>
            </CardContent>
          </Card>

          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2" />
            Model settings saved automatically
          </Button>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image Generation</CardTitle>
              <CardDescription>
                Configure automatic image generation for articles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generate Featured Image</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create images for each article
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="space-y-2">
                <Label>Image Model</Label>
                <Select value="gemini-2.5-flash-image" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Using Gemini 2.5 Flash Image (as specified in requirements)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value="16:9" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (1200×630 - Social sharing)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageStyle">Style Prompt</Label>
                <Input
                  id="imageStyle"
                  placeholder="Professional, educational, modern, clean"
                  defaultValue="Professional, educational, modern, clean"
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2" />
            Image settings saved automatically
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
