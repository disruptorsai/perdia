import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Zap, 
  Shield, 
  Clock,
  Save,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("workflow");

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemSetting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemSetting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  const getSetting = (key) => {
    return settings.find(s => s.setting_key === key);
  };

  const getSettingValue = (key, defaultValue = '') => {
    const setting = getSetting(key);
    return setting?.setting_value || defaultValue;
  };

  const handleUpdateSetting = async (key, value, type = 'workflow', description = '') => {
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
        description,
        editable_by: 'admin'
      });
    }
  };

  const [workflowSettings, setWorkflowSettings] = useState({
    requireReview: getSettingValue('require_review', 'true') === 'true',
    autoPublishDays: getSettingValue('auto_publish_days', '5'),
    dailyLimit: getSettingValue('daily_limit', '10'),
    weeklyLimit: getSettingValue('weekly_limit', '100')
  });

  const [aiSettings, setAiSettings] = useState({
    defaultModel: getSettingValue('default_model', 'gpt-4'),
    temperature: getSettingValue('temperature', '0.7'),
    maxTokens: getSettingValue('max_tokens', '4000')
  });

  const [qualitySettings, setQualitySettings] = useState({
    minWordCount: getSettingValue('min_word_count', '800'),
    minInternalLinks: getSettingValue('min_internal_links', '3'),
    requireExternalCitation: getSettingValue('require_external_citation', 'true') === 'true',
    enforceShortcodes: getSettingValue('enforce_shortcodes', 'true') === 'true'
  });

  const handleSaveWorkflow = async () => {
    await handleUpdateSetting('require_review', workflowSettings.requireReview.toString(), 'workflow', 'Require manual review before publishing');
    await handleUpdateSetting('auto_publish_days', workflowSettings.autoPublishDays, 'workflow', 'Auto-publish after N days if not reviewed');
    await handleUpdateSetting('daily_limit', workflowSettings.dailyLimit, 'throughput', 'Maximum articles per day');
    await handleUpdateSetting('weekly_limit', workflowSettings.weeklyLimit, 'throughput', 'Maximum articles per week');
  };

  const handleSaveAI = async () => {
    await handleUpdateSetting('default_model', aiSettings.defaultModel, 'ai', 'Default AI model for content generation');
    await handleUpdateSetting('temperature', aiSettings.temperature, 'ai', 'AI temperature setting');
    await handleUpdateSetting('max_tokens', aiSettings.maxTokens, 'ai', 'Maximum tokens for AI generation');
  };

  const handleSaveQuality = async () => {
    await handleUpdateSetting('min_word_count', qualitySettings.minWordCount, 'quality', 'Minimum word count for articles');
    await handleUpdateSetting('min_internal_links', qualitySettings.minInternalLinks, 'quality', 'Minimum internal links required');
    await handleUpdateSetting('require_external_citation', qualitySettings.requireExternalCitation.toString(), 'quality', 'Require at least one external citation');
    await handleUpdateSetting('enforce_shortcodes', qualitySettings.enforceShortcodes.toString(), 'quality', 'Enforce shortcode usage for monetization');
  };

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
                    checked={workflowSettings.requireReview}
                    onCheckedChange={(checked) => 
                      setWorkflowSettings({ ...workflowSettings, requireReview: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Auto-Publish After (Days)</Label>
                  <Input
                    type="number"
                    value={workflowSettings.autoPublishDays}
                    onChange={(e) => 
                      setWorkflowSettings({ ...workflowSettings, autoPublishDays: e.target.value })
                    }
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
                      value={workflowSettings.dailyLimit}
                      onChange={(e) => 
                        setWorkflowSettings({ ...workflowSettings, dailyLimit: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Article Limit</Label>
                    <Input
                      type="number"
                      value={workflowSettings.weeklyLimit}
                      onChange={(e) => 
                        setWorkflowSettings({ ...workflowSettings, weeklyLimit: e.target.value })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveWorkflow}
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Workflow Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Important Note</h4>
                    <p className="text-sm text-amber-800">
                      Changes to workflow settings will affect all future articles. Existing articles 
                      in the queue will maintain their current settings until manually updated.
                    </p>
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
                    value={aiSettings.defaultModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, defaultModel: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="gpt-4">GPT-4 (Recommended)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="gemini-pro">Gemini Pro</option>
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
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({ ...aiSettings, temperature: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Lower = more focused, Higher = more creative (0.7 recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Tokens</Label>
                  <Input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Maximum length for AI-generated content
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveAI}
                    className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save AI Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Generation Time</span>
                    <Badge className="bg-emerald-600">~15 seconds</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge className="bg-blue-600">98.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Quality Score</span>
                    <Badge className="bg-purple-600">8.2/10</Badge>
                  </div>
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
                  Quality & Compliance Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Minimum Word Count</Label>
                  <Input
                    type="number"
                    value={qualitySettings.minWordCount}
                    onChange={(e) => 
                      setQualitySettings({ ...qualitySettings, minWordCount: e.target.value })
                    }
                    placeholder="800"
                  />
                  <p className="text-xs text-gray-600">
                    Articles below this count will be flagged
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Internal Links</Label>
                  <Input
                    type="number"
                    value={qualitySettings.minInternalLinks}
                    onChange={(e) => 
                      setQualitySettings({ ...qualitySettings, minInternalLinks: e.target.value })
                    }
                    placeholder="3"
                  />
                  <p className="text-xs text-gray-600">
                    Required number of internal links to other content
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require External Citation</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      At least one authoritative external source (e.g., BLS, NCES)
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireExternalCitation}
                    onCheckedChange={(checked) => 
                      setQualitySettings({ ...qualitySettings, requireExternalCitation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Enforce Shortcodes</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Block publishing if monetization links bypass shortcodes
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.enforceShortcodes}
                    onCheckedChange={(checked) => 
                      setQualitySettings({ ...qualitySettings, enforceShortcodes: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveQuality}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Quality Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Schema Validation</span>
                    <Badge className="bg-emerald-600">100% Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Shortcode Enforcement</span>
                    <Badge className="bg-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">E-E-A-T Guidelines</span>
                    <Badge className="bg-emerald-600">Following</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}