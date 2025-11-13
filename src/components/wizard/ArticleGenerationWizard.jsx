/**
 * Article Generation Wizard
 *
 * Zero-typing, click-through UX for content generation
 *
 * Flow:
 * Step 1: Select Topic/Idea (auto-populated from 4 sources)
 * Step 2: Select Article Type (ranking, career_guide, listicle, guide, faq)
 * Step 3: Select Title (AI generates 5 options)
 * Step 4: Generation Progress (typing animation of pipeline steps)
 * Step 5: Success (article sent to review queue)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { getAllSuggestions } from '@/lib/suggestion-service';
import { InvokeLLM, Article } from '@/lib/perdia-sdk';
import { generateArticlePipeline } from '@/lib/content-pipeline';
import { markSuggestionAsUsed } from '@/lib/suggestion-service';
import { toast } from 'sonner';

const ARTICLE_TYPES = [
  {
    id: 'ranking',
    name: 'Ranking Article',
    description: 'Best programs, top schools, ranked lists',
    icon: '🏆',
    example: 'Top 10 Online MBA Programs 2025'
  },
  {
    id: 'career_guide',
    name: 'Career Guide',
    description: 'Career paths, job outlooks, salary guides',
    icon: '💼',
    example: 'Complete Guide to Becoming a Nurse Practitioner'
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Tips, strategies, actionable lists',
    icon: '📝',
    example: '7 Ways to Finance Your Graduate Degree'
  },
  {
    id: 'guide',
    name: 'Comprehensive Guide',
    description: 'In-depth educational content',
    icon: '📚',
    example: 'Ultimate Guide to Online Learning'
  },
  {
    id: 'faq',
    name: 'FAQ Article',
    description: 'Question-answer format, common queries',
    icon: '❓',
    example: 'Common Questions About Online Degrees'
  }
];

export default function ArticleGenerationWizard({ open, onClose, preSelectedTopic = null }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(preSelectedTopic ? 2 : 1);
  const [selectedTopic, setSelectedTopic] = useState(preSelectedTopic);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [generatedArticle, setGeneratedArticle] = useState(null);

  // Step 1: Topic suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Step 3: Title options
  const [titleOptions, setTitleOptions] = useState([]);
  const [generatingTitles, setGeneratingTitles] = useState(false);

  // Step 4: Generation progress
  const [generationProgress, setGenerationProgress] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load suggestions on mount (Step 1)
  useEffect(() => {
    if (open && !preSelectedTopic) {
      loadSuggestions();
    }
  }, [open, preSelectedTopic]);

  // Auto-generate titles when type is selected (Step 2 → Step 3)
  useEffect(() => {
    if (selectedType && selectedTopic && currentStep === 3) {
      generateTitles();
    }
  }, [selectedType, selectedTopic, currentStep]);

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    try {
      const data = await getAllSuggestions({ limit: 20 });
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function generateTitles() {
    setGeneratingTitles(true);
    setTitleOptions([]);

    try {
      const response = await InvokeLLM({
        prompt: `You are an SEO expert writing for an education website (GetEducated.com).

Topic: ${selectedTopic.title}
Article Type: ${selectedType.name}
Keywords: ${selectedTopic.keywords.join(', ')}

Generate 5 SEO-optimized article titles for this topic and type.

Requirements:
- 50-70 characters (optimal for SEO)
- Include primary keyword
- Compelling and click-worthy
- Match the ${selectedType.name} format
- Appeal to students researching education options

Return ONLY a JSON array:
["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`,
        provider: 'claude',
        model: 'claude-haiku-4-5-20251001', // Fast model for titles
        temperature: 0.8,
        max_tokens: 500
      });

      // Parse titles
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const titles = JSON.parse(jsonMatch[0]);
        setTitleOptions(titles);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error('Failed to generate titles');
      // Fallback titles
      setTitleOptions([
        selectedTopic.title,
        `Complete Guide to ${selectedTopic.title}`,
        `Everything You Need to Know About ${selectedTopic.title}`,
        `${selectedTopic.title}: A Comprehensive Overview`,
        `Understanding ${selectedTopic.title} in 2025`
      ]);
    } finally {
      setGeneratingTitles(false);
    }
  }

  async function startArticleGeneration() {
    setIsGenerating(true);
    setGenerationProgress([]);
    setCurrentStep(4);

    try {
      const article = await generateArticlePipeline(selectedTopic.title, {
        onProgress: (progress) => {
          setGenerationProgress(prev => [...prev, progress]);
        },
        contentType: selectedType.id,
        title: selectedTitle,
        keywords: selectedTopic.keywords,
        targetWordCount: 2000
      });

      setGeneratedArticle(article);

      // Mark suggestion as used
      await markSuggestionAsUsed(selectedTopic, article.id);

      // Move to success step
      setCurrentStep(5);
      toast.success('Article generated successfully!');
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Failed to generate article: ' + error.message);
      setCurrentStep(3); // Go back to title selection
    } finally {
      setIsGenerating(false);
    }
  }

  function handleTopicSelect(topic) {
    setSelectedTopic(topic);
    setCurrentStep(2);
  }

  function handleTypeSelect(type) {
    setSelectedType(type);
    setCurrentStep(3);
  }

  function handleTitleSelect(title) {
    setSelectedTitle(title);
    // Auto-start generation
    setTimeout(() => startArticleGeneration(), 500);
  }

  function handleClose() {
    // Reset state
    setCurrentStep(preSelectedTopic ? 2 : 1);
    setSelectedTopic(preSelectedTopic);
    setSelectedType(null);
    setSelectedTitle(null);
    setTitleOptions([]);
    setGenerationProgress([]);
    setGeneratedArticle(null);
    onClose();
  }

  function goToReviewQueue() {
    navigate('/v2/approval');
    handleClose();
  }

  function viewArticle() {
    if (generatedArticle) {
      navigate(`/v2/approval?article=${generatedArticle.id}`);
      handleClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Article
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors ${
                step === currentStep
                  ? 'bg-primary'
                  : step < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Topic Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Select a Topic</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from trending questions, keywords, or news topics
                </p>
              </div>

              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => handleTopicSelect(suggestion)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{suggestion.sourceIcon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.source}
                              </Badge>
                              {suggestion.keywords.slice(0, 3).map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Article Type Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Article Type</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Topic: <span className="font-medium">{selectedTopic?.title}</span>
                </p>
              </div>

              <div className="grid gap-3">
                {ARTICLE_TYPES.map((type, index) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card
                      className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handleTypeSelect(type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{type.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{type.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {type.description}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            Example: {type.example}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Title Selection */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Title</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Type: <span className="font-medium">{selectedType?.name}</span>
                </p>
              </div>

              {generatingTitles ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Generating SEO-optimized titles...
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {titleOptions.map((title, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => handleTitleSelect(title)}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">{title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {title.length} characters
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2"
                  disabled={generatingTitles}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generation Progress */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Generating Article</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTitle}
                </p>
              </div>

              <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
                {generationProgress.map((progress, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-1"
                  >
                    <span className="text-gray-500">[{new Date(progress.timestamp).toLocaleTimeString()}]</span>{' '}
                    {progress.message}
                  </motion.div>
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Article Generated!</h3>
                  <p className="text-muted-foreground">
                    Your article has been created and sent to the review queue
                  </p>
                </div>

                {generatedArticle && (
                  <Card className="p-4 w-full text-left">
                    <h4 className="font-semibold mb-2">{generatedArticle.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{generatedArticle.word_count} words</span>
                      <span>${generatedArticle.total_cost?.toFixed(2) || '0.00'}</span>
                      <Badge>{generatedArticle.status}</Badge>
                    </div>
                  </Card>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={viewArticle} className="gap-2">
                    <FileText className="h-4 w-4" />
                    View Article
                  </Button>
                  <Button variant="outline" onClick={goToReviewQueue}>
                    Go to Review Queue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
