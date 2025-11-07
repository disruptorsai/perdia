import React, { useState, useEffect } from 'react';
import { Client } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ClientConfig({ client, onUpdate }) {
  const [aiProvider, setAiProvider] = useState('claude');
  const [openaiAssistantId, setOpenaiAssistantId] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setAiProvider(client.ai_provider || 'claude');
      setOpenaiAssistantId(client.openai_assistant_id || '');
      setClaudeApiKey(client.claude_api_key || '');
      setOpenaiApiKey(client.openai_api_key || '');
    }
  }, [client]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Client.update(client.id, {
        ai_provider: aiProvider,
        openai_assistant_id: openaiAssistantId,
        claude_api_key: claudeApiKey,
        openai_api_key: openaiApiKey,
      });
      onUpdate(); // Notify parent to refresh client data
      toast({
        title: "Configuration Saved",
        description: "AI provider settings have been updated for this client.",
      });
    } catch (error) {
      console.error("Error saving client config:", error);
      toast({
        title: "Error",
        description: "Failed to save AI configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!client) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          AI Provider Configuration for {client.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 pt-2">
            <Label className="font-semibold text-base">AI Provider</Label>
            <p className="text-sm text-slate-500 -mt-2">
                Choose the AI model for content generation. <br/>
                <span className="font-medium text-amber-700">Note: The ability to use custom API keys is not yet enabled by the platform, but you can store them here securely for future use.</span>
            </p>
            <RadioGroup value={aiProvider} onValueChange={setAiProvider} className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50">
                    <RadioGroupItem value="claude" id="claude" />
                    <Label htmlFor="claude" className="font-medium">Claude API (Default)</Label>
                </div>
                {aiProvider === 'claude' && (
                    <div className="space-y-2 pl-8 pb-2">
                        <Label htmlFor="claudeKey" className="font-semibold text-sm">Claude API Key</Label>
                        <Input
                            id="claudeKey"
                            type="password"
                            placeholder="sk-ant-..."
                            value={claudeApiKey}
                            onChange={(e) => setClaudeApiKey(e.target.value)}
                        />
                    </div>
                )}
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50">
                    <RadioGroupItem value="openai" id="openai" />
                    <Label htmlFor="openai" className="font-medium">OpenAI API</Label>
                </div>
            </RadioGroup>
        </div>

        {aiProvider === 'openai' && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="assistantId" className="font-semibold">OpenAI Assistant ID</Label>
                    <p className="text-sm text-slate-500">Enter the ID of your custom OpenAI assistant.</p>
                    <Input
                        id="assistantId"
                        placeholder="asst_..."
                        value={openaiAssistantId}
                        onChange={(e) => setOpenaiAssistantId(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="openaiKey" className="font-semibold">OpenAI API Key</Label>
                    <Input
                        id="openaiKey"
                        type="password"
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                    />
                </div>
            </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}