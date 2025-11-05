import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  AnimatedStatCard,
  AnimatedCard,
  GlassCard,
  StaggerContainer,
  AnimatedButton,
  FloatingLabel,
  Spinner
} from '@/components/ui';
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
          animate={{
            background: [
              'linear-gradient(to bottom right, rgb(239 246 255), rgb(250 245 255), rgb(254 242 242))',
              'linear-gradient(to bottom right, rgb(250 245 255), rgb(254 242 242), rgb(239 246 255))',
              'linear-gradient(to bottom right, rgb(254 242 242), rgb(239 246 255), rgb(250 245 255))',
              'linear-gradient(to bottom right, rgb(239 246 255), rgb(250 245 255), rgb(254 242 242))'
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Hero Section with glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#009fde] via-[#0088cc] to-[#0077b5]">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent)',
              ],
              backgroundPosition: ['0% 50%', '100% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="relative text-white px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-4 mb-4"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Smartphone className="w-12 h-12" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                  Perdia Education
                  <motion.span
                    animate={{
                      rotate: [0, 10, 0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.span>
                </h1>
                <p className="text-blue-100 mt-1 text-lg">AI-Powered SEO Content Engine & Automation System</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex gap-2 mt-4"
            >
              <FloatingLabel delay={0.5}>✨ 2025 Modern Design</FloatingLabel>
              <FloatingLabel delay={0.6}>🚀 Smooth Animations</FloatingLabel>
              <FloatingLabel delay={0.7}>💎 Glassmorphism</FloatingLabel>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Performance Metrics with animated stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold">Google Search Console Performance (Last 30 Days)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedStatCard
              value={metrics?.totalClicks || 0}
              label="Total Clicks"
              icon={MousePointerClick}
              color="blue"
              delay={0.1}
            />
            <AnimatedStatCard
              value={metrics?.totalImpressions || 0}
              label="Total Impressions"
              icon={Eye}
              color="green"
              delay={0.2}
            />
            <AnimatedStatCard
              value={metrics?.avgCtr || 0}
              label="Average CTR"
              icon={TrendingUp}
              color="purple"
              suffix="%"
              delay={0.3}
            />
            <AnimatedStatCard
              value={metrics?.avgPosition || 0}
              label="Avg Position"
              icon={Target}
              color="orange"
              delay={0.4}
            />
          </div>
        </motion.div>

        {/* Quick Stats with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <GlassCard intensity="medium" className="p-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium">Keywords Queued</span>
                  </div>
                  <motion.p
                    className="text-3xl font-bold text-green-900"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                  >
                    {keywordsQueued}
                  </motion.p>
                  <p className="text-sm text-gray-600 mt-1">Ready for content generation</p>
                </div>
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {keywordsQueued}
                </motion.div>
              </div>
            </motion.div>
          </GlassCard>

          <GlassCard intensity="medium" className="p-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Pending Review</span>
                  </div>
                  <motion.p
                    className="text-3xl font-bold text-orange-900"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.6 }}
                  >
                    {pendingReview}
                  </motion.p>
                  <p className="text-sm text-gray-600 mt-1">Content awaiting approval</p>
                </div>
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  {pendingReview}
                </motion.div>
              </div>
            </motion.div>
          </GlassCard>
        </motion.div>

        {/* Feature Grid with stagger animation */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Platform Features</h2>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/50',
                green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50',
                purple: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/50',
                orange: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/50',
                yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/50',
                indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/50'
              };

              return (
                <Link key={feature.title} to={feature.link}>
                  <AnimatedCard
                    glass
                    delay={index * 0.1}
                    className="h-full p-6 group cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`w-14 h-14 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-4 shadow-xl text-white`}
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>

                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>

                    <motion.div
                      className="flex items-center gap-2 text-blue-600 font-medium text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </AnimatedCard>
                </Link>
              );
            })}
          </StaggerContainer>
        </div>

        {/* Strategic Goals with enhanced glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#009fde] via-[#0088cc] to-[#0077b5]" />

          {/* Animated overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
            animate={{
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="relative p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Strategic Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.15)'
                  }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                >
                  <motion.div
                    className="text-5xl mb-3"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {goal.icon}
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
                  <p className="text-blue-100">{goal.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
