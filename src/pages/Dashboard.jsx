import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  MousePointerClick,
  Eye,
  TrendingUp,
  Target,
  Clock,
  ArrowRight,
  BrainCircuit,
  FileText,
  CheckSquare,
  Zap,
  Globe,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner } from '@/components/ui';
import { PerformanceMetric, Keyword, ContentQueue } from '@/lib/perdia-sdk';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [keywordsQueued, setKeywordsQueued] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load performance metrics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const metricsData = await PerformanceMetric.find({
        date: { gte: thirtyDaysAgo.toISOString() }
      });

      // Calculate totals
      const totals = metricsData.reduce((acc, metric) => ({
        clicks: acc.clicks + (metric.clicks || 0),
        impressions: acc.impressions + (metric.impressions || 0),
        ctr: acc.ctr + (metric.ctr || 0),
        position: acc.position + (metric.position || 0),
        count: acc.count + 1
      }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 });

      setMetrics({
        totalClicks: totals.clicks,
        totalImpressions: totals.impressions,
        avgCtr: totals.count > 0 ? (totals.ctr / totals.count).toFixed(2) : 0,
        avgPosition: totals.count > 0 ? (totals.position / totals.count).toFixed(1) : 0
      });

      // Load keywords queued
      const queuedKeywords = await Keyword.count({ status: 'queued' });
      setKeywordsQueued(queuedKeywords);

      // Load pending review content
      const pendingContent = await ContentQueue.count({ status: 'pending_review' });
      setPendingReview(pendingContent);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'AI Content Engine',
      description: '9 specialized AI agents for automated content generation',
      icon: BrainCircuit,
      color: 'blue',
      link: '/ai-agents'
    },
    {
      title: 'Keyword Manager',
      description: 'Track and manage thousands of keywords with AI clustering',
      icon: TrendingUp,
      color: 'green',
      link: '/keywords'
    },
    {
      title: 'Content Library',
      description: 'View and manage all generated content in one place',
      icon: FileText,
      color: 'purple',
      link: '/content'
    },
    {
      title: 'Approval Queue',
      description: 'Review and approve content before publishing',
      icon: CheckSquare,
      color: 'orange',
      link: '/approvals'
    },
    {
      title: 'Automation Controls',
      description: 'Configure automation modes and content generation frequency',
      icon: Zap,
      color: 'yellow',
      link: '/automation'
    },
    {
      title: 'WordPress Integration',
      description: 'Seamlessly publish content directly to WordPress',
      icon: Globe,
      color: 'indigo',
      link: '/wordpress'
    }
  ];

  const goals = [
    { icon: '📈', title: '3X Traffic Growth', description: 'Increase from 2K to 6K daily visits' },
    { icon: '🤖', title: 'Content Automation', description: 'From 6-8 pages/day to 100+/week' },
    { icon: '🎯', title: 'Rankings Recovery', description: 'Recover lost positions from Google updates' },
    { icon: '⚡', title: 'Autonomous Operation', description: 'Full automation with human oversight' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#009fde] to-[#0077b5] text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-12 h-12" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Perdia Education</h1>
              <p className="text-blue-100 mt-1">AI-Powered SEO Content Engine & Automation System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Google Search Console Performance (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MousePointerClick className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Clicks</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">{metrics?.totalClicks?.toLocaleString() || 0}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Impressions</span>
                </div>
                <p className="text-3xl font-bold text-green-900">{metrics?.totalImpressions?.toLocaleString() || 0}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Average CTR</span>
                </div>
                <p className="text-3xl font-bold text-purple-900">{metrics?.avgCtr || 0}%</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">Avg Position</span>
                </div>
                <p className="text-3xl font-bold text-orange-900">{metrics?.avgPosition || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card accent="green" hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium">Keywords Queued</span>
                  </div>
                  <p className="text-2xl font-bold">{keywordsQueued}</p>
                  <p className="text-sm text-muted-foreground mt-1">Ready for content generation</p>
                </div>
                <Badge variant="success" size="lg">{keywordsQueued}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card accent="orange" hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Pending Review</span>
                  </div>
                  <p className="text-2xl font-bold">{pendingReview}</p>
                  <p className="text-sm text-muted-foreground mt-1">Content awaiting approval</p>
                </div>
                <Badge variant="orange" size="lg">{pendingReview}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600',
                orange: 'bg-orange-100 text-orange-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                indigo: 'bg-indigo-100 text-indigo-600'
              };

              return (
                <Link key={feature.title} to={feature.link}>
                  <Card className="h-full transition-all duration-200 hover:shadow-2xl hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color]} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                      <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                        <span>Learn more</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Strategic Goals */}
        <div className="bg-gradient-to-r from-[#009fde] to-[#0077b5] rounded-lg text-white p-8">
          <h2 className="text-2xl font-bold mb-6">Strategic Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl mb-3">{goal.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
                <p className="text-blue-100">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
