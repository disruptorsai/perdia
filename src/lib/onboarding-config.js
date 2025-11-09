import {
  Rocket,
  Zap,
  Target,
  CheckCircle2,
  Globe,
  Key,
  Bot,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Calendar,
  Users,
  BookOpen,
} from 'lucide-react';

/**
 * Onboarding Configuration
 * Central configuration for all onboarding content, steps, and tasks
 */

// ============================================
// WIZARD CONFIGURATION
// ============================================

export const TOTAL_WIZARD_STEPS = 5;

export const WIZARD_STEPS = {
  WELCOME: 0,
  WORDPRESS: 1,
  KEYWORD: 2,
  GENERATE: 3,
  COMPLETE: 4,
};

export const WIZARD_STEP_CONFIG = [
  {
    id: WIZARD_STEPS.WELCOME,
    title: 'Welcome',
    description: 'Welcome to Perdia Education',
  },
  {
    id: WIZARD_STEPS.WORDPRESS,
    title: 'WordPress',
    description: 'Connect your WordPress site',
  },
  {
    id: WIZARD_STEPS.KEYWORD,
    title: 'Keywords',
    description: 'Add your first keyword',
  },
  {
    id: WIZARD_STEPS.GENERATE,
    title: 'Generate',
    description: 'Create your first article',
  },
  {
    id: WIZARD_STEPS.COMPLETE,
    title: 'Complete',
    description: "You're all set!",
  },
];

// ============================================
// STEP CONTENT
// ============================================

export const WELCOME_CONTENT = {
  badge: 'AI-Powered SEO Platform',
  title: 'Welcome to Perdia Education',
  subtitle: 'Your AI-powered content engine for 3X organic traffic growth',
  description:
    'Perdia automates SEO content creation with 9 specialized AI agents, helping you scale from 6-8 articles/day to 100+ articles/week.',
  features: [
    {
      icon: Bot,
      title: '9 Specialized AI Agents',
      description: 'Each agent is an expert in different content types',
    },
    {
      icon: Zap,
      title: 'Automated Workflow',
      description: 'From keyword research to WordPress publishing',
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Monitor your SEO success with Google Search Console',
    },
    {
      icon: Target,
      title: 'Strategic Content',
      description: 'AI-driven keyword targeting and optimization',
    },
  ],
  stats: [
    { label: 'Target', value: '3X', description: 'Traffic Growth' },
    { label: 'Goal', value: '100+', description: 'Articles/Week' },
    { label: 'AI Agents', value: '9', description: 'Specialized Experts' },
  ],
  cta: "Let's Get Started",
  skipText: 'Skip tutorial',
};

export const WORDPRESS_CONTENT = {
  badge: 'Step 1 of 3',
  title: 'Connect Your WordPress Site',
  subtitle: 'Link your WordPress site to enable automated publishing',
  description:
    'Connect your WordPress site so Perdia can publish approved content directly. You can also skip this step and publish manually later.',
  benefits: [
    'One-click publishing from approval queue',
    'Automatic post formatting and SEO optimization',
    'Track published articles with WordPress post IDs',
  ],
  skipText: "I'll connect later",
  continueText: 'Continue',
};

export const KEYWORD_CONTENT = {
  badge: 'Step 2 of 3',
  title: 'Add Your First Keyword',
  subtitle: 'Keywords drive your content generation strategy',
  description:
    'Add a target keyword that you want to rank for. This will be used to generate your first SEO article.',
  tips: [
    'Use specific, long-tail keywords for better targeting',
    'Include search volume if you have data from keyword research',
    'Categorize keywords to organize your content strategy',
  ],
  exampleKeyword: {
    keyword: 'best online master\'s programs',
    search_volume: 2400,
    category: 'degree-programs',
  },
  useExampleText: 'Use example keyword',
  addManualText: 'Add my own keyword',
};

export const GENERATE_CONTENT = {
  badge: 'Step 3 of 3',
  title: 'Generate Your First Article',
  subtitle: "Watch Perdia's AI create SEO-optimized content",
  description:
    'Perdia will use the SEO Content Writer agent to generate a comprehensive, 1500-2500 word article optimized for your target keyword.',
  agent_info: {
    name: 'SEO Content Writer',
    icon: FileText,
    capabilities: [
      'Comprehensive 1500-2500 word articles',
      'SEO optimization with target keyword integration',
      'Proper heading structure (H1, H2, H3)',
      'Internal linking suggestions',
      'Meta descriptions and title tags',
    ],
  },
  tips: [
    'Content generation typically takes 30-60 seconds',
    'The AI analyzes your keyword and creates strategic content',
    'You can edit and refine the content before publishing',
  ],
  generateButtonText: 'Generate Article',
  generatingText: 'Generating your article...',
  loadingTips: [
    'The AI is analyzing your target keyword...',
    'Researching related topics and questions...',
    'Creating an SEO-optimized content structure...',
    'Writing comprehensive, engaging content...',
    'Adding meta descriptions and formatting...',
  ],
};

export const COMPLETE_CONTENT = {
  title: 'You\'re All Set!',
  subtitle: 'Congratulations on completing the quick start',
  description:
    'You\'ve successfully set up Perdia and generated your first AI article. Here\'s what you accomplished:',
  accomplishments: [
    {
      icon: CheckCircle2,
      title: 'Quick Start Complete',
      description: 'You completed the onboarding wizard',
      completed: true,
    },
    {
      icon: Globe,
      title: 'WordPress Connected',
      description: 'Your WordPress site is ready for publishing',
      conditional: true,
      key: 'wordpress_connected',
    },
    {
      icon: Key,
      title: 'Keyword Added',
      description: 'Your first target keyword is tracked',
      conditional: true,
      key: 'keyword_added',
    },
    {
      icon: FileText,
      title: 'Article Generated',
      description: 'Your first AI-generated article is ready',
      conditional: true,
      key: 'article_generated',
    },
  ],
  next_steps: {
    title: 'What\'s Next?',
    items: [
      {
        icon: FileText,
        title: 'Review Your Article',
        description: 'Edit and approve your generated content',
        action: 'Go to Approval Queue',
        route: '/approvals',
      },
      {
        icon: Key,
        title: 'Add More Keywords',
        description: 'Build your keyword targeting strategy',
        action: 'Keyword Manager',
        route: '/keywords',
      },
      {
        icon: Bot,
        title: 'Explore AI Agents',
        description: 'Discover 8 more specialized AI agents',
        action: 'View AI Agents',
        route: '/ai-agents',
      },
      {
        icon: Settings,
        title: 'Configure Automation',
        description: 'Set up automated content generation',
        action: 'Automation Settings',
        route: '/automation',
      },
    ],
  },
  discovery_prompt: {
    title: 'Continue Learning',
    description: 'Complete discovery tasks to master all of Perdia\'s features',
  },
  cta: 'Go to Dashboard',
  skipCta: 'Explore on my own',
};

// ============================================
// DISCOVERY CHECKLIST CONFIGURATION
// ============================================

export const DISCOVERY_TASKS = [
  {
    key: 'quick_start',
    title: 'Complete Quick Start',
    description: 'Finish the onboarding wizard',
    icon: Rocket,
    route: null,
    auto_complete: true, // Completed automatically when wizard finishes
  },
  {
    key: 'view_performance',
    title: 'View Performance Dashboard',
    description: 'Check your SEO metrics and Google Search Console data',
    icon: BarChart3,
    route: '/performance',
  },
  {
    key: 'ai_conversation',
    title: 'Chat with an AI Agent',
    description: 'Have a multi-turn conversation with an AI agent',
    icon: MessageSquare,
    route: '/ai-agents',
  },
  {
    key: 'add_keywords',
    title: 'Add 5 Keywords',
    description: 'Build your keyword tracking list',
    icon: Key,
    route: '/keywords',
    progress_check: (count) => count >= 5,
  },
  {
    key: 'generate_content',
    title: 'Generate 3 Content Pieces',
    description: 'Try different content types and AI agents',
    icon: FileText,
    route: '/ai-agents',
    progress_check: (count) => count >= 3,
  },
  {
    key: 'approve_publish',
    title: 'Approve & Publish Content',
    description: 'Review and publish an article to WordPress',
    icon: CheckCircle2,
    route: '/approvals',
  },
  {
    key: 'configure_automation',
    title: 'Configure Automation',
    description: 'Set your content generation preferences',
    icon: Settings,
    route: '/automation',
  },
  {
    key: 'schedule_content',
    title: 'Schedule Content',
    description: 'Plan your content calendar',
    icon: Calendar,
    route: '/calendar',
  },
  {
    key: 'invite_team',
    title: 'Invite a Team Member',
    description: 'Collaborate with your team in chat',
    icon: Users,
    route: '/chat',
  },
  {
    key: 'take_tour',
    title: 'Take a Feature Tour',
    description: 'Deep dive into AI agents, keywords, or workflow',
    icon: BookOpen,
    route: null, // Opens tour selector
  },
];

export const DISCOVERY_CHECKLIST_CONFIG = {
  title: 'Discover Perdia',
  subtitle: 'Complete tasks to unlock the full platform potential',
  collapse_text: 'Hide checklist',
  expand_text: 'Show checklist',
  progress_label: 'Progress',
  milestone_messages: {
    50: {
      title: 'Halfway There!',
      description: 'You\'re mastering the platform',
      emoji: '🎉',
    },
    100: {
      title: 'Platform Master!',
      description: 'You\'ve unlocked everything Perdia has to offer',
      emoji: '🚀',
    },
  },
};

// ============================================
// TOUR CONFIGURATION
// ============================================

export const AVAILABLE_TOURS = [
  {
    key: 'ai_agents',
    title: 'AI Agents Tour',
    description: 'Learn how to use 9 specialized AI agents',
    icon: Bot,
    duration: '5 min',
    stops: 6,
  },
  {
    key: 'keyword_manager',
    title: 'Keyword Manager Tour',
    description: 'Master keyword research and tracking',
    icon: Key,
    duration: '4 min',
    stops: 7,
  },
  {
    key: 'content_workflow',
    title: 'Content Workflow Tour',
    description: 'Understand the draft → approve → publish flow',
    icon: FileText,
    duration: '6 min',
    stops: 8,
  },
  {
    key: 'automation',
    title: 'Automation Tour',
    description: 'Configure automated content generation',
    icon: Settings,
    duration: '3 min',
    stops: 5,
  },
  {
    key: 'performance',
    title: 'Performance Tour',
    description: 'Track SEO success with Google Search Console',
    icon: BarChart3,
    duration: '4 min',
    stops: 6,
  },
];

export const TOUR_SELECTOR_CONFIG = {
  title: 'Feature Tours',
  description: 'Choose a guided tour to learn more about specific features',
  cta: 'Start Tour',
  completed_badge: 'Completed',
};

// ============================================
// HELP MENU CONFIGURATION
// ============================================

export const HELP_MENU_CONFIG = {
  trigger_label: 'Help',
  items: [
    {
      key: 'restart_onboarding',
      label: 'Restart Onboarding',
      description: 'Start the tutorial from the beginning',
      icon: Rocket,
      action: 'restart_onboarding',
    },
    {
      key: 'feature_tours',
      label: 'Feature Tours',
      description: 'Learn about specific features',
      icon: BookOpen,
      action: 'open_tours',
      submenu: true,
    },
    {
      key: 'documentation',
      label: 'Documentation',
      description: 'Read the full platform guide',
      icon: BookOpen,
      action: 'open_docs',
      external: true,
      url: '/docs', // Update with actual docs URL
    },
  ],
};

// ============================================
// ANIMATION CONFIGURATIONS
// ============================================

export const ANIMATIONS = {
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
  slideLeft: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  slideRight: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  },
  scaleIn: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: 'spring', damping: 15, stiffness: 300 },
  },
  checkmark: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: [0.8, 1.2, 1], opacity: 1 },
    transition: { duration: 0.5, times: [0, 0.6, 1] },
  },
  progressBar: {
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  confetti: {
    numberOfPieces: 200,
    recycle: false,
    gravity: 0.3,
  },
};

// ============================================
// COLORS & STYLING
// ============================================

export const ONBOARDING_COLORS = {
  primary: 'from-blue-600 to-blue-700',
  success: 'from-green-600 to-green-700',
  progress: 'from-blue-500 to-purple-500',
  accent: 'from-purple-600 to-pink-600',
};
