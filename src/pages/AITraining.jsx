import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrainingData, SystemSetting, InvokeLLM } from '@/lib/perdia-sdk';
import { toast } from 'sonner';
import {
  Brain,
  TrendingUp,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  AlertCircle,
  FileText,
  Loader2,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AITraining() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trainingData, setTrainingData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    applied: 0,
    avgImpact: 0
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [patternDistribution, setPatternDistribution] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all training data
      const data = await TrainingData.find({}, {
        orderBy: { column: 'created_date', ascending: false },
        limit: 100
      });
      setTrainingData(data);

      // Calculate stats
      const total = data.length;
      const pending = data.filter(d => d.status === 'pending_review').length;
      const applied = data.filter(d => d.status === 'applied_to_system').length;
      const avgImpact = total > 0
        ? data.reduce((sum, d) => sum + (d.impact_score || 0), 0) / total
        : 0;

      setStats({ total, pending, applied, avgImpact: Math.round(avgImpact * 10) / 10 });

      // Calculate pattern distribution
      const distribution = {};
      data.forEach(d => {
        const pattern = d.pattern_type || 'other';
        distribution[pattern] = (distribution[pattern] || 0) + 1;
      });
      setPatternDistribution(distribution);

    } catch (error) {
      console.error('Failed to load training data:', error);
      toast.error('Failed to load training data');
    }
    setLoading(false);
  }

  async function handleApplyTraining() {
    const pendingData = trainingData.filter(d => d.status === 'pending_review');

    if (pendingData.length === 0) {
      toast.error('No pending training data to apply');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStatus('Analyzing feedback patterns...');

    try {
      // Step 1: Analyze patterns (20%)
      setTrainingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Group by pattern type (40%)
      setTrainingStatus('Grouping feedback by pattern type...');
      setTrainingProgress(40);

      const patterns = {};
      pendingData.forEach(data => {
        const type = data.pattern_type || 'general';
        if (!patterns[type]) {
          patterns[type] = [];
        }
        patterns[type].push(data);
      });

      // Step 3: Generate improvement prompts for each pattern (60%)
      setTrainingStatus('Generating AI improvement prompts...');
      setTrainingProgress(60);

      const improvements = {};
      for (const [pattern, items] of Object.entries(patterns)) {
        const feedbackSummary = items.map(item => ({
          lesson: item.lesson_learned,
          impact: item.impact_score,
          feedback_items: item.feedback_items
        }));

        // Use AI to analyze patterns and generate improvement
        const analysisPrompt = `Analyze the following editorial feedback patterns for ${pattern} issues and provide a concise system prompt improvement (2-3 sentences max):

Feedback Items (${items.length} total):
${feedbackSummary.slice(0, 10).map((f, i) => `${i + 1}. ${f.lesson} (Impact: ${f.impact})`).join('\n')}

Common Issues:
${Array.from(new Set(feedbackSummary.flatMap(f => f.feedback_items?.map(fi => fi.category) || []))).join(', ')}

Generate a system prompt improvement that addresses these patterns.`;

        const result = await InvokeLLM({
          prompt: analysisPrompt,
          provider: 'claude',
          model: 'claude-haiku-4-5-20251001', // Fast model for analysis
          temperature: 0.3,
          max_tokens: 300
        });

        improvements[pattern] = result.trim();
      }

      // Step 4: Update system settings (80%)
      setTrainingStatus('Updating AI system prompts...');
      setTrainingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get or create system settings
      const existingSettings = await SystemSetting.find({ key: 'ai_improvements' });
      const currentImprovements = existingSettings.length > 0
        ? JSON.parse(existingSettings[0].value || '{}')
        : {};

      // Merge improvements
      const updatedImprovements = {
        ...currentImprovements,
        ...improvements,
        last_updated: new Date().toISOString(),
        training_batch_count: (currentImprovements.training_batch_count || 0) + 1
      };

      if (existingSettings.length > 0) {
        await SystemSetting.update(existingSettings[0].id, {
          value: JSON.stringify(updatedImprovements),
          updated_date: new Date().toISOString()
        });
      } else {
        await SystemSetting.create({
          key: 'ai_improvements',
          value: JSON.stringify(updatedImprovements),
          description: 'AI system prompt improvements learned from editorial feedback'
        });
      }

      // Step 5: Mark training data as applied (100%)
      setTrainingStatus('Marking training data as applied...');
      setTrainingProgress(100);

      await Promise.all(
        pendingData.map(data =>
          TrainingData.update(data.id, {
            status: 'applied_to_system',
            applied_date: new Date().toISOString()
          })
        )
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success(`Applied ${pendingData.length} training items to AI system`);
      await loadData();

    } catch (error) {
      console.error('Failed to apply training:', error);
      toast.error('Failed to apply training');
    } finally {
      setIsTraining(false);
      setTrainingStatus('');
      setTrainingProgress(0);
    }
  }

  function getSeverityColor(severity) {
    const colors = {
      critical: 'bg-red-600',
      major: 'bg-orange-600',
      moderate: 'bg-yellow-600',
      minor: 'bg-blue-600'
    };
    return colors[severity] || 'bg-gray-600';
  }

  function getCategoryIcon(category) {
    const icons = {
      accuracy: <Target className="w-4 h-4" />,
      tone: <Sparkles className="w-4 h-4" />,
      structure: <FileText className="w-4 h-4" />,
      seo: <TrendingUp className="w-4 h-4" />,
      compliance: <CheckCircle className="w-4 h-4" />,
      grammar: <AlertCircle className="w-4 h-4" />,
      style: <Zap className="w-4 h-4" />,
      formatting: <BarChart3 className="w-4 h-4" />
    };
    return icons[category] || <FileText className="w-4 h-4" />;
  }

  const filteredData = trainingData.filter(data => {
    if (activeTab === 'pending') return data.status === 'pending_review';
    if (activeTab === 'applied') return data.status === 'applied_to_system';
    return true; // insights shows all
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              AI Training Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Learn from editorial feedback to improve AI content generation
            </p>
          </div>

          <Button
            onClick={handleApplyTraining}
            disabled={stats.pending === 0 || isTraining}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {isTraining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Apply Training ({stats.pending})
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Training Data</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applied to System</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.applied}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Impact Score</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgImpact}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Overlay */}
        <AnimatePresence>
          {isTraining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Training AI System</h3>
                  <p className="text-gray-600 mb-6">{trainingStatus}</p>

                  <div className="space-y-2">
                    <Progress value={trainingProgress} className="h-2" />
                    <p className="text-sm font-medium text-gray-700">{trainingProgress}%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="applied" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Applied ({stats.applied})
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading training data...</p>
              </Card>
            ) : filteredData.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Training Data</h3>
                <p className="text-gray-600 mb-4">
                  Training data will appear here when editors provide feedback on AI-generated articles.
                </p>
                <Button onClick={() => navigate('/v2/approval')}>
                  View Approval Queue
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredData.map((data, index) => (
                  <motion.div
                    key={data.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {data.article_title}
                              </h3>
                              <Badge variant="outline" className="capitalize">
                                {data.content_type || 'article'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Created {new Date(data.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-600">Impact Score</p>
                            <p className="text-2xl font-bold text-purple-600">{data.impact_score || 0}</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-blue-900 mb-2">Pattern Type:</p>
                          <Badge className="bg-blue-600 text-white capitalize">
                            {data.pattern_type || 'general'}
                          </Badge>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">Lesson Learned:</p>
                          <p className="text-sm text-gray-700">{data.lesson_learned}</p>
                        </div>

                        {data.feedback_items && data.feedback_items.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              Feedback Items ({data.feedback_items.length}):
                            </p>
                            <div className="space-y-2">
                              {data.feedback_items.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getCategoryIcon(item.category)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {item.category}
                                      </Badge>
                                      <Badge className={`text-xs text-white ${getSeverityColor(item.severity)}`}>
                                        {item.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-700">{item.comment}</p>
                                  </div>
                                </div>
                              ))}
                              {data.feedback_items.length > 3 && (
                                <p className="text-xs text-gray-500 italic">
                                  +{data.feedback_items.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Applied Tab */}
          <TabsContent value="applied">
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading training data...</p>
              </Card>
            ) : filteredData.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Applied Training Yet</h3>
                <p className="text-gray-600">
                  Applied training data will appear here after you click "Apply Training".
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredData.map((data, index) => (
                  <motion.div
                    key={data.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h3 className="text-lg font-bold text-gray-900">
                                {data.article_title}
                              </h3>
                              <Badge className="bg-green-600 text-white">Applied</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Applied {new Date(data.applied_date).toLocaleDateString()} •
                              Pattern: <span className="font-medium capitalize">{data.pattern_type || 'general'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-600">Impact</p>
                            <p className="text-2xl font-bold text-purple-600">{data.impact_score || 0}</p>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-900 mb-2">Lesson Learned:</p>
                          <p className="text-sm text-green-800">{data.lesson_learned}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid gap-6">
              {/* Pattern Distribution */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Pattern Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(patternDistribution).length === 0 ? (
                    <p className="text-center text-gray-600 py-8">
                      No patterns detected yet. Train the AI to see insights.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(patternDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([pattern, count]) => {
                          const percentage = Math.round((count / stats.total) * 100);
                          return (
                            <div key={pattern}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {pattern}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Training Impact */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Training Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Total Feedback Items</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {trainingData.reduce((sum, d) => sum + (d.feedback_items?.length || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-900 mb-1">Avg. Impact Score</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.avgImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
