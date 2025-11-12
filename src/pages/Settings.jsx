/**
 * PERDIA V2: SETTINGS PAGE
 * ========================
 *
 * Comprehensive settings for:
 * - Automation (5-day SLA, posting frequency)
 * - WordPress Integration
 * - AI Providers
 * - Pipeline Configuration
 *
 * Created: 2025-11-12
 */

import React, { useState, useEffect } from 'react';
import { AutomationSettings, WordPressConnection, PipelineConfiguration } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings as SettingsIcon,
  Zap,
  Wordpress,
  Cpu,
  Workflow,
  Loader2,
  Save,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AI_PROVIDERS = [
  { value: 'claude', label: 'Anthropic Claude (Primary)' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'grok', label: 'xAI Grok' },
  { value: 'perplexity', label: 'Perplexity (Fact-checking)' }
];

const CLAUDE_MODELS = [
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Primary)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Fast)' },
  { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1 (Advanced)' }
];

const POST_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'publish', label: 'Publish' },
  { value: 'pending', label: 'Pending Review' }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('automation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Automation Settings
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);
  const [autoPublishDays, setAutoPublishDays] = useState(5);
  const [postingFrequency, setPostingFrequency] = useState(10);
  const [autoQuoteInjection, setAutoQuoteInjection] = useState(true);

  // WordPress Settings
  const [wpSiteUrl, setWpSiteUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [wpDefaultStatus, setWpDefaultStatus] = useState('draft');
  const [wpDefaultCategory, setWpDefaultCategory] = useState('');

  // AI Provider Settings
  const [defaultProvider, setDefaultProvider] = useState('claude');
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-5-20250929');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);

  // Pipeline Settings
  const [activePipeline, setActivePipeline] = useState(null);
  const [availablePipelines, setAvailablePipelines] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load automation settings
      const automationData = await AutomationSettings.find({}, { limit: 1 });
      if (automationData.length > 0) {
        const settings = automationData[0];
        setAutoPublishEnabled(settings.auto_publish_enabled ?? true);
        setAutoPublishDays(settings.auto_publish_days || 5);
        setPostingFrequency(settings.posting_frequency || 10);
        setAutoQuoteInjection(settings.auto_quote_injection ?? true);
        setDefaultProvider(settings.default_ai_provider || 'claude');
        setDefaultModel(settings.default_ai_model || 'claude-sonnet-4-5-20250929');
        setTemperature(settings.ai_temperature || 0.7);
        setMaxTokens(settings.ai_max_tokens || 4000);
      }

      // Load WordPress connection
      const wpData = await WordPressConnection.find({}, { limit: 1 });
      if (wpData.length > 0) {
        const wp = wpData[0];
        setWpSiteUrl(wp.site_url || '');
        setWpUsername(wp.username || '');
        setWpDefaultStatus(wp.default_post_status || 'draft');
        setWpDefaultCategory(wp.default_category || '');
      }

      // Load pipelines
      const pipelineData = await PipelineConfiguration.find({});
      setAvailablePipelines(pipelineData);
      const active = pipelineData.find(p => p.is_active);
      setActivePipeline(active);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveAutomationSettings = async () => {
    setSaving(true);
    try {
      const automationData = await AutomationSettings.find({}, { limit: 1 });

      const settings = {
        auto_publish_enabled: autoPublishEnabled,
        auto_publish_days: autoPublishDays,
        posting_frequency: postingFrequency,
        auto_quote_injection: autoQuoteInjection,
        default_ai_provider: defaultProvider,
        default_ai_model: defaultModel,
        ai_temperature: temperature,
        ai_max_tokens: maxTokens
      };

      if (automationData.length > 0) {
        await AutomationSettings.update(automationData[0].id, settings);
      } else {
        await AutomationSettings.create(settings);
      }

      toast.success('Automation settings saved');
    } catch (error) {
      console.error("Error saving automation settings:", error);
      toast.error("Failed to save automation settings");
    } finally {
      setSaving(false);
    }
  };

  const saveWordPressSettings = async () => {
    setSaving(true);
    try {
      const wpData = await WordPressConnection.find({}, { limit: 1 });

      const settings = {
        site_url: wpSiteUrl,
        username: wpUsername,
        app_password: wpAppPassword || undefined,
        default_post_status: wpDefaultStatus,
        default_category: wpDefaultCategory,
        is_active: true
      };

      if (wpData.length > 0) {
        // Don't overwrite app_password if it's empty (keep existing)
        if (!wpAppPassword) {
          delete settings.app_password;
        }
        await WordPressConnection.update(wpData[0].id, settings);
      } else {
        await WordPressConnection.create(settings);
      }

      toast.success('WordPress settings saved');
    } catch (error) {
      console.error("Error saving WordPress settings:", error);
      toast.error("Failed to save WordPress settings");
    } finally {
      setSaving(false);
    }
  };

  const testWordPressConnection = async () => {
    setSaving(true);
    try {
      const wpData = await WordPressConnection.find({}, { limit: 1 });

      if (wpData.length === 0) {
        toast.error('Please save WordPress settings first');
        return;
      }

      const wp = wpData[0];

      // Test connection by fetching site info
      const auth = btoa(`${wp.username}:${wp.app_password}`);
      const response = await fetch(`${wp.site_url}/wp-json`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (response.ok) {
        toast.success('WordPress connection successful');
      } else {
        toast.error('WordPress connection failed');
      }
    } catch (error) {
      console.error("Error testing WordPress connection:", error);
      toast.error('WordPress connection failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-slate-600" />
            Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure automation, integrations, and AI providers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="wordpress">
            <Wordpress className="w-4 h-4 mr-2" />
            WordPress
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Cpu className="w-4 h-4 mr-2" />
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <Workflow className="w-4 h-4 mr-2" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        {/* Automation Settings */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 5-Day SLA Auto-Publish */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">5-Day SLA Auto-Publish</div>
                  <div className="text-sm text-slate-500">
                    Automatically publish articles after {autoPublishDays} days if not reviewed (MANDATORY)
                  </div>
                </div>
                <Switch
                  checked={autoPublishEnabled}
                  onCheckedChange={setAutoPublishEnabled}
                />
              </div>

              {autoPublishEnabled && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auto-Publish After (days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={autoPublishDays}
                    onChange={(e) => setAutoPublishDays(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              )}

              {/* Posting Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Posting Frequency (articles per week)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={postingFrequency}
                  onChange={(e) => setPostingFrequency(parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Target: From 6-8/day manual → 100+/week automated
                </p>
              </div>

              {/* Auto Quote Injection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Auto Quote Injection</div>
                  <div className="text-sm text-slate-500">
                    Automatically inject 2-5 real quotes (60%+ requirement)
                  </div>
                </div>
                <Switch
                  checked={autoQuoteInjection}
                  onCheckedChange={setAutoQuoteInjection}
                />
              </div>

              <div className="pt-4">
                <Button onClick={saveAutomationSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Automation Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WordPress Settings */}
        <TabsContent value="wordpress">
          <Card>
            <CardHeader>
              <CardTitle>WordPress Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Site URL *
                </label>
                <Input
                  placeholder="https://geteducated.com"
                  value={wpSiteUrl}
                  onChange={(e) => setWpSiteUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username *
                </label>
                <Input
                  placeholder="admin"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Application Password *
                </label>
                <Input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Generate in WordPress: Users → Profile → Application Passwords
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Post Status
                </label>
                <Select value={wpDefaultStatus} onValueChange={setWpDefaultStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Category (ID)
                </label>
                <Input
                  placeholder="1"
                  value={wpDefaultCategory}
                  onChange={(e) => setWpDefaultCategory(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={saveWordPressSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save WordPress Settings
                </Button>
                <Button variant="outline" onClick={testWordPressConnection} disabled={saving}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Provider Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default AI Provider
                </label>
                <Select value={defaultProvider} onValueChange={setDefaultProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Model
                </label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLAUDE_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperature (0.0 - 1.0)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher = more creative, Lower = more focused
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Tokens
                </label>
                <Input
                  type="number"
                  min="1000"
                  max="8000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recommended: 4000 for SEO articles
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={saveAutomationSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Settings */}
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Active Pipeline Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {activePipeline ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{activePipeline.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    </div>
                    {activePipeline.description && (
                      <p className="text-slate-600 text-sm">{activePipeline.description}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Enabled Stages:</p>
                    <div className="space-y-2">
                      {activePipeline.stages
                        .filter(s => s.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((stage) => (
                          <div key={stage.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                            <span className="text-xs font-semibold text-slate-500 w-6">#{stage.order}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{stage.displayName}</div>
                              <div className="text-xs text-slate-500">{stage.description}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {activePipeline.articles_generated > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">{activePipeline.articles_generated}</span> articles generated with this pipeline
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No active pipeline configured</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Go to Pipeline Configuration to set up your content generation pipeline
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
