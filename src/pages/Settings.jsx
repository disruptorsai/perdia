import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SystemSetting } from "@/lib/perdia-sdk";
import {
  Settings as SettingsIcon,
  Zap,
  Shield,
  Clock,
  Save,
  AlertCircle,
  Bot
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("automation");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const result = await SystemSetting.find({}, {
        orderBy: { column: 'created_date', ascending: true },
        limit: 100
      });
      return result;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => SystemSetting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast.success('Settings saved successfully');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const createSettingMutation = useMutation({
    mutationFn: (data) => SystemSetting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  const getSetting = (key) => {
    return settings.find(s => s.setting_key === key);
  };

  const getSettingValue = (key, defaultValue = '') => {
    const setting = getSetting(key);
    if (!setting) return defaultValue;

    // Handle different setting value types
    if (typeof setting.setting_value === 'object') {
      return setting.setting_value;
    }
    return setting.setting_value || defaultValue;
  };

  const handleUpdateSetting = async (key, value, type = 'general', description = '') => {
    const existing = getSetting(key);

    if (existing) {
      await updateSettingMutation.mutateAsync({
        id: existing.id,
        data: { setting_value: value }
      });
    } else {
      await createSettingMutation.mutateAsync({
        setting_key: key,
        setting_value: value,
        setting_type: type,
        description
      });
    }
  };

  // State for settings
  const [automationLevel, setAutomationLevel] = useState('manual');
  const [requireReview, setRequireReview] = useState(true);
  const [autoPublishDays, setAutoPublishDays] = useState('5');
  const [dailyLimit, setDailyLimit] = useState('10');
  const [weeklyLimit, setWeeklyLimit] = useState('100');
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-5-20250929');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('4000');
  const [minWordCount, setMinWordCount] = useState('800');
  const [minInternalLinks, setMinInternalLinks] = useState('2');
  const [minExternalLinks, setMinExternalLinks] = useState('1');

  // Load settings when data is available
  useEffect(() => {
    if (settings.length > 0) {
      setAutomationLevel(getSettingValue('automation_level', 'manual'));
      setRequireReview(getSettingValue('require_review', 'true') === 'true');
      setAutoPublishDays(getSettingValue('auto_publish_days', '5'));
      setDailyLimit(getSettingValue('daily_limit', '10'));
      setWeeklyLimit(getSettingValue('weekly_limit', '100'));
      setDefaultModel(getSettingValue('default_model', 'claude-sonnet-4-5-20250929'));
      setTemperature(getSettingValue('temperature', '0.7'));
      setMaxTokens(getSettingValue('max_tokens', '4000'));
      setMinWordCount(getSettingValue('min_word_count', '800'));
      setMinInternalLinks(getSettingValue('min_internal_links', '2'));
      setMinExternalLinks(getSettingValue('min_external_links', '1'));
    }
  }, [settings]);

  const handleSaveAll = async () => {
    await Promise.all([
      handleUpdateSetting('automation_level', automationLevel, 'automation'),
      handleUpdateSetting('require_review', requireReview.toString(), 'workflow'),
      handleUpdateSetting('auto_publish_days', autoPublishDays, 'workflow'),
      handleUpdateSetting('daily_limit', dailyLimit, 'workflow'),
      handleUpdateSetting('weekly_limit', weeklyLimit, 'workflow'),
      handleUpdateSetting('default_model', defaultModel, 'ai'),
      handleUpdateSetting('temperature', temperature, 'ai'),
      handleUpdateSetting('max_tokens', maxTokens, 'ai'),
      handleUpdateSetting('min_word_count', minWordCount, 'quality'),
      handleUpdateSetting('min_internal_links', minInternalLinks, 'quality'),
      handleUpdateSetting('min_external_links', minExternalLinks, 'quality'),
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 p-6 md:p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-600 mt-1">Configure content engine behavior and policies</p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="automation">
              <Bot className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <Clock className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Zap className="w-4 h-4 mr-2" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Shield className="w-4 h-4 mr-2" />
              Quality Rules
            </TabsTrigger>
          </TabsList>

          {/* Automation Settings */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Automation Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onClick={() => { setAutomationLevel('manual'); setHasChanges(true); }}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    automationLevel === 'manual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      automationLevel === 'manual' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {automationLevel === 'manual' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Manual Mode</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Full human control. AI provides tools and suggestions, but your team initiates and approves every action.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">Human-Powered</Badge>
                        <Badge variant="outline" className="bg-white">Maximum Control</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => { setAutomationLevel('assisted'); setHasChanges(true); }}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    automationLevel === 'assisted'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      automationLevel === 'assisted' ? 'border-purple-500' : 'border-gray-300'
                    }`}>
                      {automationLevel === 'assisted' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Assisted Automation</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        AI generates complete articles automatically. Your team reviews, approves, and decides when to publish.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">AI Drafts</Badge>
                        <Badge variant="outline" className="bg-white">Human Approval</Badge>
                        <Badge variant="outline" className="bg-white">Recommended</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => { setAutomationLevel('full_auto'); setHasChanges(true); }}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    automationLevel === 'full_auto'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      automationLevel === 'full_auto' ? 'border-green-500' : 'border-gray-300'
                    }`}>
                      {automationLevel === 'full_auto' && <div className="w-3 h-3 rounded-full bg-green-500" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Full Automation</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Fully autonomous content engine. AI handles research, generation, review, optimization, and publishing.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">Autonomous</Badge>
                        <Badge variant="outline" className="bg-white">Hands-Free</Badge>
                        <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">Use Carefully</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Settings */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Review & Publishing Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Manual Review</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All articles must be reviewed before publishing
                    </p>
                  </div>
                  <Switch
                    checked={requireReview}
                    onCheckedChange={(checked) => { setRequireReview(checked); setHasChanges(true); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Auto-Publish After (Days)</Label>
                  <Input
                    type="number"
                    value={autoPublishDays}
                    onChange={(e) => { setAutoPublishDays(e.target.value); setHasChanges(true); }}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-600">
                    Automatically publish if not reviewed within this timeframe (0 to disable)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Article Limit</Label>
                    <Input
                      type="number"
                      value={dailyLimit}
                      onChange={(e) => { setDailyLimit(e.target.value); setHasChanges(true); }}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Article Limit</Label>
                    <Input
                      type="number"
                      value={weeklyLimit}
                      onChange={(e) => { setWeeklyLimit(e.target.value); setHasChanges(true); }}
                      placeholder="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <select
                    value={defaultModel}
                    onChange={(e) => { setDefaultModel(e.target.value); setHasChanges(true); }}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Primary)</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
                    <option value="grok-2">Grok-2 (xAI)</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                  <p className="text-xs text-gray-600">
                    Select the primary AI model for content generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Temperature (0.0 - 1.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={temperature}
                    onChange={(e) => { setTemperature(e.target.value); setHasChanges(true); }}
                  />
                  <p className="text-xs text-gray-600">
                    Lower = more focused, Higher = more creative (0.7 recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => { setMaxTokens(e.target.value); setHasChanges(true); }}
                  />
                  <p className="text-xs text-gray-600">
                    Maximum length for AI-generated content (4000 recommended)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Rules */}
          <TabsContent value="quality" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Content Quality Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Minimum Word Count</Label>
                  <Input
                    type="number"
                    value={minWordCount}
                    onChange={(e) => { setMinWordCount(e.target.value); setHasChanges(true); }}
                    placeholder="800"
                  />
                  <p className="text-xs text-gray-600">
                    Articles must meet this minimum word count
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Internal Links</Label>
                    <Input
                      type="number"
                      value={minInternalLinks}
                      onChange={(e) => { setMinInternalLinks(e.target.value); setHasChanges(true); }}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum External Citations</Label>
                    <Input
                      type="number"
                      value={minExternalLinks}
                      onChange={(e) => { setMinExternalLinks(e.target.value); setHasChanges(true); }}
                      placeholder="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Quality Gate</h4>
                    <p className="text-sm text-amber-800">
                      Articles that don't meet these quality standards will be flagged during review and cannot be published until corrected.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <Card className="border-none shadow-lg sticky bottom-6">
          <CardContent className="p-4">
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges || updateSettingMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
            >
              <Save className="w-4 h-4" />
              {updateSettingMutation.isPending ? 'Saving...' : 'Save All Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
