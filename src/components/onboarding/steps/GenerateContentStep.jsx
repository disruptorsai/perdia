import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GENERATE_CONTENT, ANIMATIONS } from '@/lib/onboarding-config';
import { FileText, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { agentSDK } from '@/lib/agent-sdk';
import { ContentQueue } from '@/lib/perdia-sdk';
import { toast } from 'sonner';

/**
 * GenerateContentStep - Generate first article with AI
 * Shows real-time generation progress and tips
 */
export default function GenerateContentStep({ onNext, onPrevious, onboardingData }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [error, setError] = useState('');
  const [articleData, setArticleData] = useState(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Cycle through loading tips
  useEffect(() => {
    if (!generating) return;

    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % GENERATE_CONTENT.loadingTips.length);
      setProgress((prev) => Math.min(prev + 15, 95)); // Increment progress
    }, 3000);

    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = async () => {
    if (!onboardingData?.keyword_data) {
      setError('No keyword found. Please go back and add a keyword.');
      return;
    }

    setGenerating(true);
    setError('');
    setProgress(10);

    try {
      const keyword = onboardingData.keyword_data.keyword;

      // Create conversation with SEO Content Writer agent
      const conversation = await agentSDK.createConversation({
        agent_name: 'seo_content_writer',
        initial_message: `Write a comprehensive, SEO-optimized article about "${keyword}". The article should be 1500-2500 words, include proper heading structure (H1, H2, H3), and naturally integrate the target keyword throughout.`,
      });

      setProgress(30);

      // Get the AI response (this may take 30-60 seconds)
      const messages = conversation.messages || [];
      const aiResponse = messages.find((msg) => msg.role === 'assistant');

      if (!aiResponse || !aiResponse.content) {
        throw new Error('No content generated');
      }

      setProgress(80);

      // Save to content queue
      const contentData = await ContentQueue.create({
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Complete Guide`,
        content: aiResponse.content,
        content_type: 'new_article',
        status: 'draft',
        target_keywords: [keyword],
        word_count: aiResponse.content.split(/\s+/).length,
        meta_description: `Discover everything you need to know about ${keyword}. Comprehensive guide with expert insights.`,
        agent_used: 'seo_content_writer',
        conversation_id: conversation.id,
      });

      setProgress(100);
      setArticleData(contentData);
      setGenerationComplete(true);
      toast.success('Article generated successfully!');

      // Auto-advance after showing success
      setTimeout(() => {
        onNext({
          article_generated: true,
          article_data: contentData,
        });
      }, 2000);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate article. Please try again or skip this step.');
      toast.error('Failed to generate article');
      setGenerating(false);
      setProgress(0);
    }
  };

  const Agent = GENERATE_CONTENT.agent_info;
  const AgentIcon = Agent.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div className="text-center mb-8" {...ANIMATIONS.fadeIn}>
        <Badge variant="secondary" className="mb-4">
          {GENERATE_CONTENT.badge}
        </Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {GENERATE_CONTENT.title}
        </h2>
        <p className="text-lg text-gray-600">
          {GENERATE_CONTENT.subtitle}
        </p>
      </motion.div>

      {/* Description */}
      <motion.p
        className="text-gray-600 text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {GENERATE_CONTENT.description}
      </motion.p>

      {/* Keyword Display */}
      {onboardingData?.keyword_data && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Target Keyword</div>
                <div className="text-lg font-semibold text-gray-900">
                  {onboardingData.keyword_data.keyword}
                </div>
              </div>
              <Badge variant="outline">New Target</Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Agent Info */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <AgentIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {Agent.name}
              </h3>
              <p className="text-sm text-gray-600">
                AI agent specialized in SEO content creation
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Capabilities:</p>
            {Agent.capabilities.map((capability, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{capability}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Generation Status */}
      <AnimatePresence mode="wait">
        {!generating && !generationComplete && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Tips */}
            <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                What to Expect
              </h3>
              <ul className="space-y-2">
                {GENERATE_CONTENT.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}

        {generating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-8">
              <div className="text-center mb-6">
                <motion.div
                  className="inline-block mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-12 h-12 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {GENERATE_CONTENT.generatingText}
                </h3>
                <p className="text-gray-600">This may take 30-60 seconds</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <Progress
                  value={progress}
                  className="h-3"
                  indicatorClassName="bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Generating...</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {/* Rotating Tips */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTip}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="p-4 bg-blue-50 rounded-lg"
                >
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    {GENERATE_CONTENT.loadingTips[currentTip]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </Card>
          </motion.div>
        )}

        {generationComplete && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8">
              <div className="text-center">
                <motion.div
                  className="inline-block mb-4"
                  {...ANIMATIONS.checkmark}
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Article Generated Successfully!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your {articleData?.word_count || '~2000'} word SEO-optimized
                  article is ready
                </p>
                <Alert className="bg-green-50 border-green-200 text-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Moving to completion step...
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {!generating && !generationComplete && (
        <motion.div
          className="flex items-center justify-between mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button variant="ghost" onClick={onPrevious}>
            Previous
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={!onboardingData?.keyword_data}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {GENERATE_CONTENT.generateButtonText}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
