import React, { useState, useEffect } from 'react';
import { Loader2, Brain, Search, Sparkles, FileText, Smartphone, Target, BookOpen, FileDown, Share2, MessageSquare } from 'lucide-react';

// Agent-specific progress messages that explain what's happening
const AGENT_PROGRESS_MESSAGES = {
  seo_content_writer: [
    { icon: Search, text: 'Analyzing target keywords and search intent...', duration: 3000 },
    { icon: FileText, text: 'Structuring article outline with H2/H3 headings...', duration: 3000 },
    { icon: Brain, text: 'Writing SEO-optimized long-form content...', duration: 4000 },
    { icon: Sparkles, text: 'Integrating keywords naturally throughout content...', duration: 3000 },
    { icon: FileText, text: 'Adding FAQ section and internal linking opportunities...', duration: 3000 },
  ],
  content_optimizer: [
    { icon: Search, text: 'Analyzing existing content structure and keywords...', duration: 3000 },
    { icon: Sparkles, text: 'Identifying optimization opportunities...', duration: 3000 },
    { icon: Brain, text: 'Evaluating heading hierarchy and readability...', duration: 3000 },
    { icon: FileText, text: 'Generating specific improvement recommendations...', duration: 3000 },
  ],
  keyword_researcher: [
    { icon: Search, text: 'Discovering related keyword opportunities...', duration: 3000 },
    { icon: Brain, text: 'Analyzing search intent and difficulty scores...', duration: 3000 },
    { icon: Sparkles, text: 'Clustering keywords into strategic topic groups...', duration: 3500 },
    { icon: FileText, text: 'Preparing keyword recommendations with metrics...', duration: 3000 },
  ],
  general_content_assistant: [
    { icon: Brain, text: 'Processing your request...', duration: 2500 },
    { icon: MessageSquare, text: 'Analyzing content requirements...', duration: 2500 },
    { icon: Sparkles, text: 'Crafting helpful response...', duration: 3000 },
  ],
  emma_promoter: [
    { icon: Smartphone, text: 'Analyzing EMMA\'s key features and benefits...', duration: 3000 },
    { icon: Brain, text: 'Identifying target audience pain points...', duration: 3000 },
    { icon: Sparkles, text: 'Crafting compelling promotional messaging...', duration: 3500 },
    { icon: FileText, text: 'Adding social proof and calls-to-action...', duration: 3000 },
  ],
  enrollment_strategist: [
    { icon: Target, text: 'Analyzing enrollment funnel strategies...', duration: 3000 },
    { icon: Brain, text: 'Researching best practices and data insights...', duration: 3500 },
    { icon: Sparkles, text: 'Developing actionable recommendations...', duration: 3000 },
    { icon: FileText, text: 'Structuring comprehensive strategy guide...', duration: 3000 },
  ],
  history_storyteller: [
    { icon: BookOpen, text: 'Gathering key milestones and narrative elements...', duration: 3000 },
    { icon: Brain, text: 'Crafting emotional narrative arc...', duration: 3500 },
    { icon: Sparkles, text: 'Weaving in human elements and anecdotes...', duration: 3500 },
    { icon: FileText, text: 'Polishing engaging storytelling language...', duration: 3000 },
  ],
  resource_expander: [
    { icon: Brain, text: 'Planning comprehensive resource structure...', duration: 3000 },
    { icon: Search, text: 'Researching educational content depth...', duration: 3500 },
    { icon: FileDown, text: 'Creating high-value educational content...', duration: 4000 },
    { icon: Sparkles, text: 'Adding actionable takeaways and examples...', duration: 3000 },
  ],
  social_engagement_booster: [
    { icon: Share2, text: 'Analyzing platform-specific best practices...', duration: 3000 },
    { icon: Brain, text: 'Crafting attention-grabbing hooks...', duration: 3000 },
    { icon: Sparkles, text: 'Optimizing for engagement and reach...', duration: 3500 },
    { icon: FileText, text: 'Adding hashtags and interaction prompts...', duration: 3000 },
  ],
};

// Default messages for unknown agents
const DEFAULT_PROGRESS_MESSAGES = [
  { icon: Brain, text: 'Processing your request...', duration: 2500 },
  { icon: Sparkles, text: 'Analyzing requirements...', duration: 2500 },
  { icon: FileText, text: 'Generating response...', duration: 3000 },
];

export default function AgentThinkingIndicator({ agent, agentDisplayName }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const agentName = agent?.name || 'unknown';
  const messages = AGENT_PROGRESS_MESSAGES[agentName] || DEFAULT_PROGRESS_MESSAGES;
  const currentMessage = messages[currentMessageIndex];
  const IconComponent = currentMessage.icon;

  useEffect(() => {
    // Cycle through messages based on their duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300); // Fade out duration
    }, currentMessage.duration);

    return () => clearTimeout(timer);
  }, [currentMessageIndex, currentMessage.duration, messages.length]);

  return (
    <div className="mb-3">
      {/* Main indicator card */}
      <div className="relative overflow-hidden p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />

        <div className="relative flex items-center gap-4">
          {/* Animated icon */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30 animate-pulse" />
              <div className="relative bg-white rounded-full p-3 shadow-md">
                <IconComponent className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Progress text with fade transition */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-blue-900">
                {agentDisplayName || 'AI Agent'} is working
              </h3>
              {/* Typing dots animation */}
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            {/* Progress message with fade animation */}
            <p
              className={`text-sm text-blue-700 transition-opacity duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {currentMessage.text}
            </p>
          </div>

          {/* Spinning loader */}
          <div className="flex-shrink-0">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="mt-2 w-full bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full h-2 overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%] rounded-full" />
      </div>

      {/* Step indicator */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {messages.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentMessageIndex
                ? 'w-8 bg-blue-600'
                : index < currentMessageIndex
                ? 'w-1.5 bg-blue-400'
                : 'w-1.5 bg-blue-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
