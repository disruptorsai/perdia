import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, FileText, TrendingUp, Zap, CheckSquare, BarChart3, ArrowRight, Globe, Target, Clock, Smartphone, MousePointerClick, Eye, Search } from 'lucide-react';
import { AutomationSettings } from '@/lib/perdia-sdk';
import { Keyword } from '@/lib/perdia-sdk';
import { ContentQueue } from '@/lib/perdia-sdk';
import { PerformanceMetric } from '@/lib/perdia-sdk';

const features = [
    {
        title: "AI Content Engine",
        description: "Generate SEO-optimized content with custom-trained AI agents.",
        icon: BrainCircuit,
        url: createPageUrl("AIAgents"),
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Keyword Manager",
        description: "Upload, rotate, and track thousands of keywords automatically.",
        icon: TrendingUp,
        url: createPageUrl("KeywordManager"),
        color: "text-green-600",
        bg: "bg-green-50"
    },
    {
        title: "Content Library",
        description: "Manage all generated and optimized content in one place.",
        icon: FileText,
        url: createPageUrl("ContentLibrary"),
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        title: "Approval Queue",
        description: "Review and approve AI-generated content before publishing.",
        icon: CheckSquare,
        url: createPageUrl("ApprovalQueue"),
        color: "text-orange-600",
        bg: "bg-orange-50"
    },
    {
        title: "Automation Controls",
        description: "Configure automation levels and content generation frequency.",
        icon: Zap,
        url: createPageUrl("AutomationControls"),
        color: "text-yellow-600",
        bg: "bg-yellow-50"
    },
    {
        title: "Performance Dashboard",
        description: "Track rankings, traffic, and conversion metrics in real-time.",
        icon: BarChart3,
        url: createPageUrl("PerformanceDashboard"),
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    }
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    keywordsQueued: 0,
    contentPending: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgCTR: 0,
    avgPosition: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [keywords, queue, metrics] = await Promise.all([
          Keyword.find({ status: 'queued' }),
          ContentQueue.find({ status: 'pending_review' }),
          PerformanceMetric.find({}, { orderBy: { column: 'metric_date', ascending: false }, limit: 30 })
        ]);

        // Calculate Search Console metrics from last 30 days
        const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
        const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
        
        // Calculate average position (only from metrics that have a position)
        const metricsWithPosition = metrics.filter(m => m.google_ranking);
        const avgPosition = metricsWithPosition.length > 0 
          ? (metricsWithPosition.reduce((sum, m) => sum + m.google_ranking, 0) / metricsWithPosition.length).toFixed(1)
          : 0;

        setStats({
          keywordsQueued: keywords.length,
          contentPending: queue.length,
          totalClicks,
          totalImpressions,
          avgCTR,
          avgPosition
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="text-center p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Smartphone className="w-12 h-12" />
          <h1 className="text-4xl md:text-5xl font-bold">Perdia Education</h1>
        </div>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
          AI-Powered SEO Content Engine & Automation System
        </p>
      </div>

      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            Google Search Console Performance (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">Total Clicks</p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {loading ? '...' : stats.totalClicks.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">Total Impressions</p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {loading ? '...' : stats.totalImpressions.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-800">Average CTR</p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {loading ? '...' : `${stats.avgCTR}%`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">Avg Position</p>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {loading ? '...' : stats.avgPosition}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow-lg border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Keywords Queued</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {loading ? '...' : stats.keywordsQueued}
                </p>
              </div>
              <Target className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {loading ? '...' : stats.contentPending}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link to={feature.url} key={feature.title}>
            <Card className="group h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className={`text-lg font-bold ${feature.color}`}>{feature.title}</CardTitle>
                <div className={`p-3 rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{feature.description}</p>
                <div className={`flex items-center text-sm font-semibold ${feature.color} group-hover:translate-x-1 transition-transform`}>
                  Go to {feature.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Strategic Goals</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">📈 Traffic Growth</h4>
              <p className="text-slate-700">Double to triple organic traffic to 4,000-6,000 daily visitors within 12 months</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🔄 Content Automation</h4>
              <p className="text-slate-700">Scale from 6-8 pages/day to 100+ articles/week with AI optimization</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">🎯 Rankings Recovery</h4>
              <p className="text-slate-700">Reclaim lost rankings and authority through systematic AI content optimization</p>
            </div>
            <div>
              <h4 className="font-semibold text-orange-700 mb-2">🤖 Autonomous Operation</h4>
              <p className="text-slate-700">Achieve hands-off operation with minimal human oversight after initial training</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}