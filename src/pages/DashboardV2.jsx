/**
 * PERDIA V2 - DASHBOARD/LANDING PAGE
 * ===================================
 * Simple landing page explaining the V2 workflow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  MessageCircleQuestion,
  Settings as SettingsIcon,
  ArrowRight,
  Sparkles,
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { supabase } from '@/lib/supabase-client';

export default function DashboardV2() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingArticles: 0,
    approvedArticles: 0,
    avgCost: 0,
    articlesThisMonth: 0,
    slaExpiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get pending articles count
      const { count: pendingCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      // Get approved articles count
      const { count: approvedCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get articles this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get average cost
      const { data: costData } = await supabase
        .from('articles')
        .select('total_cost')
        .gt('total_cost', 0);

      const avgCost = costData && costData.length > 0
        ? costData.reduce((sum, a) => sum + (a.total_cost || 0), 0) / costData.length
        : 0;

      // Get SLA expiring soon (within 24 hours)
      const in24Hours = new Date();
      in24Hours.setHours(in24Hours.getHours() + 24);

      const { count: slaCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')
        .lte('auto_approve_at', in24Hours.toISOString());

      setStats({
        pendingArticles: pendingCount || 0,
        approvedArticles: approvedCount || 0,
        avgCost: avgCost || 0,
        articlesThisMonth: monthCount || 0,
        slaExpiringSoon: slaCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    {
      number: 1,
      title: 'Find Questions',
      description: 'Browse top 50 monthly questions about higher education',
      icon: MessageCircleQuestion,
      action: () => navigate('/v2/topics'),
      actionLabel: 'View Questions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      number: 2,
      title: 'Generate Article',
      description: 'Click "Create Article" → Grok generates → Perplexity verifies',
      icon: Sparkles,
      action: () => navigate('/v2/topics'),
      actionLabel: 'Start Generating',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      number: 3,
      title: 'Review & Approve',
      description: 'Review in Approval Queue → Approve or request changes',
      icon: CheckSquare,
      action: () => navigate('/v2/approval'),
      actionLabel: 'Review Now',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      number: 4,
      title: 'Auto-Publish',
      description: 'Articles auto-approve after 5 days if not reviewed',
      icon: Clock,
      action: () => navigate('/v2/settings'),
      actionLabel: 'Configure SLA',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Perdia V2
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Simplified blog writer for GetEducated.com
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Questions-First Strategy
        </Badge>
      </div>

      {/* Alert if SLA expiring */}
      {stats.slaExpiringSoon > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.slaExpiringSoon} article(s)</strong> will auto-approve within 24 hours.{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-destructive underline"
              onClick={() => navigate('/v2/approval')}
            >
              Review now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingArticles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approvedArticles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to publish
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.articlesThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Articles generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.avgCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per article
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Steps */}
      <div>
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Card
              key={step.number}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${step.bgColor}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${step.bgColor}`}>
                    <step.icon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {step.number}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={step.action}
                >
                  {step.actionLabel}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/v2/topics')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5" />
                Find New Questions
              </CardTitle>
              <CardDescription>
                Browse and generate articles from top monthly questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Go to Topics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/v2/approval')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Review Articles
              </CardTitle>
              <CardDescription>
                Approve, reject, or request changes to pending articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Go to Approval Queue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/v2/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Configure Settings
              </CardTitle>
              <CardDescription>
                Set up automation, WordPress connection, and AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Go to Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>What's New in V2?</CardTitle>
          <CardDescription>
            Simplified workflow focused on GetEducated.com's needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageCircleQuestion className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Questions-First Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly ingest of top 50 real user questions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Two-Model Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Grok generates → Perplexity verifies with citations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">5-Day Auto-Approve</h3>
                <p className="text-sm text-muted-foreground">
                  Articles auto-publish if not reviewed within SLA
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Cost Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Per-article cost visibility (~$0.07/article)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
