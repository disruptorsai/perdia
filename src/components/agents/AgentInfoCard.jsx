import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Search,
  MessageSquare,
  Smartphone,
  Target,
  BookOpen,
  FileDown,
  Share2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Icon mapping for agents
const iconMap = {
  'FileText': FileText,
  'Sparkles': Sparkles,
  'Search': Search,
  'MessageSquare': MessageSquare,
  'Smartphone': Smartphone,
  'Target': Target,
  'BookOpen': BookOpen,
  'FileDown': FileDown,
  'Share2': Share2,
};

// Color mapping for agents
const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
  pink: 'bg-pink-50 text-pink-600 border-pink-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
};

// Enhanced agent metadata with usage examples
const agentEnhancedInfo = {
  'seo_content_writer': {
    whatItDoes: 'Creates comprehensive, SEO-optimized long-form articles (1500-3000 words) with proper structure, keyword integration, and internal linking opportunities.',
    bestFor: [
      'Educational blog posts and articles',
      'Comprehensive guides and how-to content',
      'SEO-optimized website content',
      'Content targeting specific keywords'
    ],
    exampleUses: [
      'Write a 2000-word guide about "Best Online MBA Programs 2025"',
      'Create an article comparing different online degree options',
      'Generate comprehensive content about certification programs'
    ],
    tips: [
      'Provide target keywords for better optimization',
      'Specify desired article length (1500-3000 words works best)',
      'Mention any specific topics or FAQs to include'
    ]
  },
  'content_optimizer': {
    whatItDoes: 'Analyzes existing content and provides specific, actionable recommendations for improving SEO performance, readability, and user engagement.',
    bestFor: [
      'Improving underperforming content',
      'SEO audits and optimization',
      'Readability improvements',
      'Content gap analysis'
    ],
    exampleUses: [
      'Analyze this article and suggest SEO improvements',
      'Review this page for readability issues',
      'Find opportunities to add internal links in this content'
    ],
    tips: [
      'Paste your existing content for analysis',
      'Specify what aspects you want to improve (SEO, readability, engagement)',
      'Ask for specific before/after examples'
    ]
  },
  'keyword_researcher': {
    whatItDoes: 'Discovers keyword opportunities, analyzes search intent, and clusters related keywords into strategic topic groups for content planning.',
    bestFor: [
      'Finding new keyword opportunities',
      'Analyzing search intent',
      'Grouping keywords into topic clusters',
      'Content strategy planning'
    ],
    exampleUses: [
      'Find long-tail keywords related to "online education"',
      'Cluster these keywords into topic groups: [list of keywords]',
      'Analyze search intent for "best online courses"'
    ],
    tips: [
      'Provide a seed keyword or topic area',
      'Specify your target audience or industry vertical',
      'Ask for search difficulty estimates'
    ]
  },
  'general_content_assistant': {
    whatItDoes: 'Versatile assistant for content creation, editing, brainstorming, and formatting across different content types. Fast responses for quick tasks.',
    bestFor: [
      'Quick content edits and revisions',
      'Brainstorming ideas',
      'Formatting and restructuring text',
      'General content questions'
    ],
    exampleUses: [
      'Rewrite this paragraph to be more engaging',
      'Give me 10 blog post ideas about online learning',
      'Format this content into bullet points'
    ],
    tips: [
      'Great for quick tasks and iterations',
      'Use this for general content questions',
      'Fastest agent - ideal for brainstorming sessions'
    ]
  },
  'emma_promoter': {
    whatItDoes: 'Creates promotional content highlighting the benefits and features of EMMA, the mobile enrollment app for educational institutions.',
    bestFor: [
      'EMMA promotional materials',
      'Feature announcements',
      'Marketing copy for enrollment apps',
      'Sales collateral'
    ],
    exampleUses: [
      'Write a landing page for EMMA targeting students',
      'Create social posts promoting EMMA\'s mobile features',
      'Draft an email campaign about EMMA\'s benefits'
    ],
    tips: [
      'Specify your target audience (students, parents, administrators)',
      'Mention specific features you want to highlight',
      'Indicate the format (email, landing page, social post)'
    ]
  },
  'enrollment_strategist': {
    whatItDoes: 'Develops comprehensive enrollment strategy guides, best practices, and optimization techniques for educational institutions.',
    bestFor: [
      'Enrollment strategy documentation',
      'Best practice guides',
      'Data-driven enrollment tactics',
      'Institutional strategy content'
    ],
    exampleUses: [
      'Create a guide on improving yield rates for universities',
      'Develop a multi-channel enrollment marketing strategy',
      'Write about student retention best practices'
    ],
    tips: [
      'Specify the institutional context (community college, university, etc.)',
      'Mention any specific enrollment challenges',
      'Ask for data-driven recommendations'
    ]
  },
  'history_storyteller': {
    whatItDoes: 'Crafts compelling narratives about company history, founder stories, and organizational milestones that connect emotionally with audiences.',
    bestFor: [
      'Company history pages',
      'Founder story content',
      'About us pages',
      'Brand storytelling'
    ],
    exampleUses: [
      'Write our company founding story highlighting our mission',
      'Create a narrative about our key milestones',
      'Craft an emotional story about our impact on students'
    ],
    tips: [
      'Provide key facts, dates, and names',
      'Share the emotional core of your story',
      'Mention specific achievements or milestones to highlight'
    ]
  },
  'resource_expander': {
    whatItDoes: 'Creates comprehensive lead magnets, white papers, guides, and educational resources (3000+ words) that provide deep value to readers.',
    bestFor: [
      'Ultimate guides and ebooks',
      'Lead magnets and downloadables',
      'White papers and research',
      'Comprehensive comparison guides'
    ],
    exampleUses: [
      'Create a comprehensive guide: "Complete Guide to Online Master\'s Degrees"',
      'Develop a white paper about ROI of online education',
      'Write a detailed comparison guide for different degree types'
    ],
    tips: [
      'Specify the desired length (typically 3000+ words)',
      'Provide key topics or sections to cover',
      'Mention if you want worksheets or checklists included'
    ]
  },
  'social_engagement_booster': {
    whatItDoes: 'Creates engaging social media content optimized for different platforms (LinkedIn, Twitter, Facebook, Instagram, TikTok) to boost engagement and reach.',
    bestFor: [
      'Social media posts and campaigns',
      'Platform-specific content',
      'Engagement optimization',
      'Social media strategy'
    ],
    exampleUses: [
      'Create 5 LinkedIn posts about online education trends',
      'Write an engaging Twitter thread about degree benefits',
      'Develop Instagram captions for our new program launch'
    ],
    tips: [
      'Specify the platform (LinkedIn, Twitter, Facebook, etc.)',
      'Mention your target audience',
      'Ask for hashtag suggestions and visual concepts'
    ]
  },
};

export default function AgentInfoCard({ agent, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!agent) return null;

  const Icon = iconMap[agent.icon] || MessageSquare;
  const colorClass = colorMap[agent.color] || colorMap.gray;
  const enhancedInfo = agentEnhancedInfo[agent.name] || {};

  if (compact) {
    return (
      <Card className="overflow-hidden border-slate-200 bg-white">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={cn("p-2 rounded-lg border", colorClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 mb-1">{agent.display_name}</h4>
              <p className="text-sm text-slate-600 line-clamp-2">{agent.description}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-slate-600 hover:text-slate-900 h-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Learn More
              </>
            )}
          </Button>

          {isExpanded && enhancedInfo.whatItDoes && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* What it does */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h5 className="font-semibold text-sm text-slate-900">What it does</h5>
                </div>
                <p className="text-sm text-slate-600 pl-6">{enhancedInfo.whatItDoes}</p>
              </div>

              {/* Best for */}
              {enhancedInfo.bestFor && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <h5 className="font-semibold text-sm text-slate-900">Best for</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {enhancedInfo.bestFor.map((item, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Example uses */}
              {enhancedInfo.exampleUses && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h5 className="font-semibold text-sm text-slate-900">Example uses</h5>
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {enhancedInfo.exampleUses.map((item, index) => (
                      <li key={index} className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                        "{item}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {enhancedInfo.tips && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h5 className="font-semibold text-sm text-slate-900">Tips for best results</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {enhancedInfo.tips.map((item, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm text-slate-900 mb-2">Capabilities</h5>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {agent.capabilities.map((cap, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cap.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Model info */}
              <div className="pt-3 border-t">
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Model:</span> {agent.default_model?.includes('haiku') ? 'Fast (Haiku)' : 'Advanced (Sonnet)'} •
                  <span className="ml-1 font-medium">Temperature:</span> {agent.temperature}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Non-compact version (for potential full-page view)
  return (
    <Card className="overflow-hidden border-slate-200">
      <div className={cn("p-6 border-b", colorClass)}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{agent.display_name}</h3>
            <p className="text-slate-700">{agent.description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 bg-white">
        {/* Content sections similar to compact version */}
        {enhancedInfo.whatItDoes && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-lg text-slate-900">What it does</h4>
            </div>
            <p className="text-slate-600">{enhancedInfo.whatItDoes}</p>
          </div>
        )}

        {/* Similar sections for bestFor, exampleUses, tips, capabilities */}
      </div>
    </Card>
  );
}
