import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { useToast } from "@/components/ui/use-toast";

export default function TitleGenerator({ client, onTitlesGenerated }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateTitles = async () => {
    if (!client?.focus_keywords) {
      toast({
        title: "Missing Keywords",
        description: "Please add focus keywords in the AI Settings tab first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let prompt;
      if (client.ai_provider === 'openai' && client.openai_assistant_id) {
        prompt = `
          You are an expert SEO content writer using the OpenAI assistant with ID: ${client.openai_assistant_id}.
          Based on the following SEO keywords, generate a list of 5 engaging and SEO-friendly blog post titles.
          
          These titles should be designed for comprehensive, long-form content (1500-1800 words).
          
          Keywords: ${client.focus_keywords}
          Client Directives for tone and style: ${client.ai_writing_directives || 'general audience'}
          
          REQUIREMENTS:
          - Titles should suggest in-depth, comprehensive coverage of the topic
          - Include power words that indicate thorough content (Complete Guide, Ultimate, Comprehensive, Step-by-Step, etc.)
          - Optimize for search intent and user engagement
          - Ensure titles can support 1500-1800 word articles
          
          Return the titles as a JSON object with a single key "titles" which is an array of strings.
        `;
      } else {
        prompt = `
          Based on the following SEO keywords, generate a list of 5 engaging and SEO-friendly blog post titles.
          
          These titles should be designed for comprehensive, long-form content (1500-1800 words).
          
          Keywords: ${client.focus_keywords}
          Client Directives for tone and style: ${client.ai_writing_directives || 'general audience'}

          REQUIREMENTS:
          - Titles should suggest in-depth, comprehensive coverage of the topic
          - Include power words that indicate thorough content (Complete Guide, Ultimate, Comprehensive, Step-by-Step, etc.)
          - Optimize for search intent and user engagement
          - Ensure titles can support 1500-1800 word articles

          Return the titles as a JSON object with a single key "titles" which is an array of strings.
          Example format: {"titles": ["The Complete Guide to...", "Ultimate Strategy for...", "Comprehensive Analysis of...", "Step-by-Step Approach to...", "Everything You Need to Know About..."]}
        `;
      }

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      if (response && response.titles) {
        onTitlesGenerated(response.titles);
        toast({
          title: "Long-Form Titles Generated!",
          description: "Select a title below to start writing your comprehensive article.",
        });
      } else {
        throw new Error("Invalid response format from AI.");
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate titles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Step 1: Generate Long-Form Blog Titles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-slate-600">Generate compelling, SEO-optimized blog titles designed for comprehensive 1500-1800 word articles.</p>
            {!client?.focus_keywords && (
              <p className="text-sm text-amber-600 mt-2">⚠️ Please configure focus keywords in the AI Settings tab first.</p>
            )}
          </div>
          <Button 
            onClick={handleGenerateTitles} 
            disabled={isLoading || !client?.focus_keywords}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : "Generate 5 Long-Form Titles"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}