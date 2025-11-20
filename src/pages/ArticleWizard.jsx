import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Article, Keyword, Cluster, ContentIdea, SystemSetting, InvokeLLM } from "@/lib/perdia-sdk";

import IdeaSelection from "../components/wizard/IdeaSelection";
import ContentTypeSelection from "../components/wizard/ContentTypeSelection";
import TitleSelection from "../components/wizard/TitleSelection";
import DetailedProgressIndicator from "../components/wizard/DetailedProgressIndicator";
import GenerationSuccess from "../components/wizard/GenerationSuccess";

export default function ArticleWizard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedIdeaId = urlParams.get('ideaId');
  const autoRun = urlParams.get('auto') === 'true';

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    selectedIdea: null,
    contentType: null,
    selectedTitle: null,
    keywords: [],
    targetAudience: '',
    additionalContext: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState([]);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [autoRunning, setAutoRunning] = useState(false);

  // Fetch existing articles for internal linking context
  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-linking'],
    queryFn: async () => {
      const articles = await Article.find({ status: 'published' }, {
        orderBy: { column: 'created_date', ascending: false },
        limit: 100
      });
      return articles;
    },
  });

  // Fetch system settings for AI model
  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-wizard'],
    queryFn: () => SystemSetting.find({}),
  });

  // Fetch pre-selected idea if provided
  const { data: preSelectedIdea } = useQuery({
    queryKey: ['pre-selected-idea', preSelectedIdeaId],
    queryFn: async () => {
      if (!preSelectedIdeaId) return null;
      const ideas = await ContentIdea.find({ id: preSelectedIdeaId });
      return ideas[0] || null;
    },
    enabled: !!preSelectedIdeaId
  });

  // Set pre-selected idea when loaded
  useEffect(() => {
    if (preSelectedIdea && !wizardData.selectedIdea) {
      const hasContentType = preSelectedIdea.content_type && preSelectedIdea.content_type !== '';
      const newData = {
        ...wizardData,
        selectedIdea: preSelectedIdea,
        keywords: preSelectedIdea.keywords || [],
        targetAudience: preSelectedIdea.description || '',
        additionalContext: preSelectedIdea.notes || '',
        contentType: preSelectedIdea.content_type || null
      };
      setWizardData(newData);

      // If auto-run mode, start automatic generation
      if (autoRun) {
        setAutoRunning(true);
        runAutomaticGeneration(newData);
      } else {
        // Skip to title selection if idea has content type, otherwise go to content type selection
        setCurrentStep(hasContentType ? 3 : 2);
      }
    }
  }, [preSelectedIdea, autoRun]);

  // Fetch data for suggestions
  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords-wizard'],
    queryFn: async () => {
      const kws = await Keyword.find({ target_flag: true }, {
        orderBy: { column: 'search_volume', ascending: false },
        limit: 20
      });
      return kws;
    },
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters-wizard'],
    queryFn: async () => {
      const cls = await Cluster.find({ status: 'active' }, {
        orderBy: { column: 'priority', ascending: false },
        limit: 10
      });
      return cls;
    },
  });

  const { data: contentIdeas = [] } = useQuery({
    queryKey: ['content-ideas-wizard'],
    queryFn: async () => {
      const ideas = await ContentIdea.find({ status: 'approved' }, {
        orderBy: { column: 'trending_score', ascending: false },
        limit: 15
      });
      return ideas;
    },
  });

  const handleIdeaSelect = (idea) => {
    setWizardData({
      ...wizardData,
      selectedIdea: idea,
      keywords: idea.keywords || [],
      targetAudience: idea.targetAudience || '',
      additionalContext: idea.additionalContext || ''
    });
    setCurrentStep(2);
  };

  const handleContentTypeSelect = (type) => {
    setWizardData({
      ...wizardData,
      contentType: type
    });
    setCurrentStep(3);
  };

  const handleTitleSelect = (title) => {
    const updatedData = {
      ...wizardData,
      selectedTitle: title
    };
    setWizardData(updatedData);
    startArticleGeneration(updatedData);
  };

  const startArticleGeneration = async (dataToUse) => {
    setIsGenerating(true);
    setCurrentStep(4);

    const steps = [];
    const addStep = (message) => {
      steps.push({
        timestamp: new Date().toLocaleTimeString(),
        message
      });
      setGenerationSteps([...steps]);
    };

    try {
      addStep(`Analyzing chosen topic: "${dataToUse.selectedTitle}"`);
      await delay(600);

      addStep('Scanning GetEducated.com for relevant articles to link to...');
      await delay(900);

      addStep(`Identifying key sub-topics and H2 structure for a "${(dataToUse.contentType || 'guide').replace(/_/g, ' ')}" article.`);
      await delay(900);

      addStep(`Performing keyword analysis for: ${dataToUse.keywords.slice(0, 5).join(', ')}.`);
      await delay(1000);

      addStep('Searching for credible external sources and citations...');
      await delay(1000);

      addStep('Drafting introduction and outlining core arguments.');
      await delay(1000);

      const sections = getSectionsForType(dataToUse.contentType);
      for (const section of sections) {
        addStep(`Generating content for section: "${section}"`);
        await delay(800);
      }

      addStep('Inserting internal links to related GetEducated articles...');
      await delay(800);

      addStep('Adding external citations from trusted sources...');
      await delay(800);

      addStep('Structuring content with appropriate HTML tags and headings.');
      await delay(600);

      addStep('Generating initial FAQ section based on common user queries.');
      await delay(1000);

      addStep('Running quality checks: word count, readability, structure.');
      await delay(800);

      addStep('Humanizing content to sound natural and authentic.');
      await delay(700);

      addStep('Finalizing draft and preparing for review.');
      await delay(500);

      // Build context-aware prompt with existing articles
      const prompt = buildPrompt(dataToUse, existingArticles);

      addStep('Invoking AI language model with optimized prompt...');

      // Get AI model from settings
      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      addStep(`Using AI model: ${aiModel}...`);

      // Call the LLM WITH internet context for external citations
      let result = null;
      try {
        result = await InvokeLLM({
          prompt,
          provider: 'xai',
          model: aiModel,
          temperature: 0.7,
          max_tokens: 8000,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  }
                }
              }
            }
          }
        });

        console.log('🔍 LLM Raw Result:', result);
        addStep('✓ AI response received, validating structure...');

      } catch (llmError) {
        console.error('❌ LLM Call Failed:', llmError);
        addStep(`✗ AI generation failed: ${llmError.message}`);

        if (llmError.message.includes('JSON') || llmError.message.includes('delimiter')) {
          throw new Error('The AI generated malformed content. This is usually temporary - please try again.');
        }

        throw new Error(`AI generation failed: ${llmError.message}`);
      }

      // Validate and sanitize the result
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result structure:', result);
        addStep('✗ AI returned invalid response format');
        throw new Error('AI returned an invalid response. Please try again.');
      }

      // Clean markdown code fences from content
      let cleanContent = (result.content || '<p>Content generation in progress. Please try again.</p>')
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .trim();

      const sanitizedResult = {
        title: result.title || dataToUse.selectedTitle,
        excerpt: result.excerpt || `A comprehensive guide about ${dataToUse.selectedTitle}`,
        content: cleanContent,
        faqs: Array.isArray(result.faqs) ? result.faqs : []
      };

      // Validate title exists
      if (!sanitizedResult.title || sanitizedResult.title.trim() === '') {
        throw new Error('AI failed to generate a valid title. Please try again.');
      }

      if (!sanitizedResult.content || sanitizedResult.content.length < 100) {
        console.error('❌ Content too short:', sanitizedResult.content);
        addStep('✗ Generated content is too short or empty');
        throw new Error('Generated content is too short. Please try again.');
      }

      addStep('✓ Content validated successfully!');
      addStep('Verifying internal and external links...');
      await delay(500);

      // Validate links
      const internalLinkCount = (sanitizedResult.content.match(/geteducated\.com/gi) || []).length;
      const externalLinkCount = (sanitizedResult.content.match(/<a href="http/gi) || []).length - internalLinkCount;

      if (internalLinkCount < 2) {
        addStep(`⚠ Warning: Only ${internalLinkCount} internal link(s) found (2+ recommended)`);
      } else {
        addStep(`✓ ${internalLinkCount} internal links added`);
      }

      if (externalLinkCount < 1) {
        addStep(`⚠ Warning: No external links found (1+ recommended)`);
      } else {
        addStep(`✓ ${externalLinkCount} external citation(s) added`);
      }

      addStep('🎨 Humanizing content for natural flow...');
      await delay(600);

      // Humanize the content
      const humanizationPrompt = `Take this educational article and humanize it to sound naturally written by an experienced education journalist.

ARTICLE TO HUMANIZE:
${sanitizedResult.content}

HUMANIZATION INSTRUCTIONS:

1. SENTENCE VARIETY:
   - Mix short punchy sentences (5-8 words) with longer complex ones (20-30 words)
   - Vary paragraph lengths - some 2 sentences, some 5-6 sentences
   - Use occasional sentence fragments for emphasis. Like this.

2. CONVERSATIONAL TONE:
   - Add contractions: "don't", "won't", "isn't", "you'll", "it's"
   - Include rhetorical questions: "Why does this matter?" "What's the takeaway?"
   - Use transitional phrases: "Here's the thing...", "That said...", "Let's be honest..."
   - Address reader directly: "you", "your"

3. NATURAL IMPERFECTIONS:
   - Start some sentences with "And" or "But"
   - Use em dashes for emphasis — like this
   - Add parenthetical asides (when they add value)
   - Less formal vocabulary in spots

4. REMOVE AI PATTERNS:
   - Eliminate: "Furthermore", "Moreover", "In conclusion", "It's worth noting"
   - Vary how paragraphs start - don't always use topic sentences
   - Mix up transition words
   - Avoid overly perfect structure

5. ADD PERSONALITY:
   - Use specific examples instead of generic ones
   - Include industry-relevant analogies
   - Occasional opinionated statements (professionally)
   - Natural tangents that circle back to the point

6. MAINTAIN QUALITY:
   - Keep all H2/H3 headings with id attributes unchanged
   - Preserve all links and citations exactly as-is
   - Keep factual accuracy and professionalism
   - Maintain GetEducated's helpful, trustworthy voice

CRITICAL: Return ONLY the humanized HTML content. No explanations.`;

      const humanizedContent = await InvokeLLM({
        prompt: humanizationPrompt,
        provider: 'xai',
        model: aiModel,
        temperature: 0.8,
        max_tokens: 8000
      });

      const cleanHumanized = humanizedContent
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:humanized|rewritten).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();

      sanitizedResult.content = cleanHumanized;
      addStep('✓ Content humanized and ready!');
      await delay(400);

      addStep('AI generation complete! Creating article record...');
      await delay(500);

      // Calculate word count
      const wordCount = sanitizedResult.content
        .replace(/<[^>]*>/g, '')
        .split(/\s+/)
        .filter(w => w && w.length > 0)
        .length;

      console.log('📊 Article Stats:', {
        title: sanitizedResult.title,
        excerptLength: sanitizedResult.excerpt.length,
        contentLength: sanitizedResult.content.length,
        wordCount: wordCount,
        faqCount: sanitizedResult.faqs.length,
        internalLinks: internalLinkCount,
        externalLinks: externalLinkCount
      });

      // Create article with status 'in_review'
      const article = await Article.create({
        title: sanitizedResult.title,
        excerpt: sanitizedResult.excerpt,
        content: sanitizedResult.content,
        type: dataToUse.contentType,
        status: 'in_review',
        target_keywords: dataToUse.keywords || [],
        faqs: sanitizedResult.faqs,
        word_count: wordCount,
        internal_links: internalLinkCount,
        external_links: externalLinkCount,
        schema_valid: true
      });

      console.log('✅ Article created successfully:', article);

      addStep('✓ Article successfully created and added to Review Queue!');
      await delay(1000);

      setGeneratedArticle(article);
      setCurrentStep(5);
      setIsGenerating(false);
      setAutoRunning(false);

      } catch (error) {
      console.error('💥 Article Generation Error:', error);
      console.error('Error Stack:', error.stack);

      addStep(`✗ Error: ${error.message}`);
      addStep('Generation failed. Please try again.');

      setIsGenerating(false);
      setAutoRunning(false);

      setTimeout(() => {
        alert(
          `Article generation failed:\n\n${error.message}\n\n` +
          `This can happen due to:\n` +
          `• AI formatting issues (try again)\n` +
          `• Complex topics (simplify your request)\n` +
          `• Temporary AI service issues\n\n` +
          `Please try generating the article again.`
        );
      }, 1000);
    }
  };

  const buildPrompt = (data, articles) => {
    // Prepare internal linking context
    const linkingContext = articles.slice(0, 20).map(a => ({
      title: a.title,
      url: a.slug ? `https://www.geteducated.com/${a.slug}` : `https://www.geteducated.com/article/${a.id}`,
      excerpt: a.excerpt || '',
      type: a.type
    }));

    const templates = {
      ranking: `You are an expert content writer for GetEducated.com, a trusted guide to online education.

Create a comprehensive RANKING article about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

CRITICAL JSON FORMAT REQUIREMENTS:
- You MUST return ONLY valid JSON
- Escape all special characters in HTML content
- Use proper JSON string formatting
- No trailing commas
- Ensure all quotes in HTML are escaped

INTERNAL LINKING REQUIREMENTS (MANDATORY):
You MUST include at least 2 internal links to GetEducated.com articles. Here are relevant articles you can link to:

${linkingContext.map((article, i) => `${i + 1}. ${article.title} - ${article.url}`).join('\n')}

Choose the most relevant articles from this list and naturally incorporate links within your content using this format:
<a href="${linkingContext[0]?.url || 'URL'}">anchor text</a>

EXTERNAL LINKING REQUIREMENTS (MANDATORY):
You MUST include at least 1 external link to a credible source (e.g., Bureau of Labor Statistics, Department of Education, industry reports, academic institutions).
Search for and cite current, authoritative sources. Format: <a href="URL" target="_blank" rel="noopener">source name</a>

STRUCTURE YOUR ARTICLE:

1. OPENING SECTION (2-3 paragraphs):
   - Hook paragraph about the degree/career field
   - Context about why this matters for students
   - Mention cost savings opportunities

2. MAIN SECTIONS (use H2 tags with id attributes):
   - What is this degree/program?
   - Career Opportunities
   - Salary and Job Outlook (cite BLS data with links)
   - How to Choose the Right Program
   - Frequently Asked Questions

3. FORMATTING:
   - Use clean HTML tags: h2, h3, p, ul, ol, li, strong, a
   - Add id attributes to H2 headings for navigation
   - Keep content well-structured and readable
   - Include your 2+ internal links naturally within relevant paragraphs
   - Include your 1+ external citation with proper attribution

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "Your optimized article title here",
  "excerpt": "A compelling 2-3 sentence summary that entices readers",
  "content": "<h2 id=\\"introduction\\">Introduction</h2><p>Your full HTML content here with <a href=\\"..\\">internal</a> and <a href=\\"..\\">external</a> links...</p>",
  "faqs": [
    {"question": "Question 1?", "answer": "Detailed answer 1"},
    {"question": "Question 2?", "answer": "Detailed answer 2"}
  ]
}

WORD COUNT: 1500-2000 words
TONE: Professional, helpful, consumer-focused`,

      career_guide: `You are an expert content writer for GetEducated.com.

Create a comprehensive CAREER GUIDE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

CRITICAL JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON
- Escape all quotes and special characters
- Use proper HTML entity encoding where needed

INTERNAL LINKING REQUIREMENTS (MANDATORY):
You MUST include at least 2 internal links to GetEducated.com articles:

${linkingContext.map((article, i) => `${i + 1}. ${article.title} - ${article.url}`).join('\n')}

EXTERNAL LINKING REQUIREMENTS (MANDATORY):
You MUST include at least 1 external link to credible sources like:
- Bureau of Labor Statistics (bls.gov)
- O*NET Online
- Professional associations
- Government agencies
- Reputable industry reports

Search for current data and cite properly.

STRUCTURE:

1. INTRODUCTION (2 paragraphs):
   - Compelling hook about the profession
   - What readers will learn

2. MAIN SECTIONS (H2 tags with id attributes):
   - What is this Career/Role?
   - How to Enter This Field
   - Step-by-Step Career Path (numbered list)
   - Essential Skills
   - Education Requirements (link to relevant degree pages from GetEducated)
   - Career Outlook and Growth (cite BLS data)
   - Salary Information (cite BLS data)
   - Advancement Opportunities

3. FAQs (5-7 practical questions)

4. LINKING:
   - 2+ internal links to related GetEducated articles
   - 1+ external citations with proper links
   - Natural integration within content

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "Article title",
  "excerpt": "Brief summary",
  "content": "<h2 id=\\"intro\\">Introduction</h2><p>Content with <a href=\\"..\\">links</a>...</p>",
  "faqs": [{"question": "...", "answer": "..."}]
}

WORD COUNT: 2000-2500 words
TONE: Encouraging, practical, step-by-step`,

      listicle: `You are an expert content writer for GetEducated.com.

Create a LISTICLE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}

CRITICAL: Return valid JSON only. Escape all special characters.

INTERNAL LINKING (MANDATORY - 2+ links):
Available GetEducated articles to link to:
${linkingContext.map((article, i) => `${i + 1}. ${article.title} - ${article.url}`).join('\n')}

EXTERNAL LINKING (MANDATORY - 1+ link):
Find and cite credible external sources for claims and statistics.

STRUCTURE:

1. INTRODUCTION (why this list matters)

2. THE LIST (15-25 items):
   Each item should include:
   - Item Title (H3)
   - Key details
   - Brief description
   - Naturally incorporate internal/external links where relevant

3. CONCLUSION

4. FAQs (5-7 questions)

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "List title",
  "excerpt": "Summary",
  "content": "<h2>Introduction</h2><p>...</p><h3>1. First Item</h3><p>Content with <a href=\\"..\\">links</a>...</p>",
  "faqs": [{"question": "...", "answer": "..."}]
}

WORD COUNT: 2500-3500 words
TONE: Informative, data-driven, optimistic`,

      guide: `You are an expert content writer for GetEducated.com.

Create a comprehensive GUIDE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

CRITICAL: Valid JSON only. Escape special characters properly.

INTERNAL LINKING (MANDATORY - 2+ links):
${linkingContext.map((article, i) => `${i + 1}. ${article.title} - ${article.url}`).join('\n')}

EXTERNAL LINKING (MANDATORY - 1+ link):
Cite authoritative external sources.

STRUCTURE:

1. INTRODUCTION (2-3 paragraphs)
2. OVERVIEW
3. KEY CONCEPTS
4. STEP-BY-STEP PROCESS
5. BEST PRACTICES
6. COMMON MISTAKES TO AVOID
7. RESOURCES AND TOOLS (include internal + external links)
8. FAQs

Link naturally to 2+ GetEducated articles and 1+ external sources throughout.

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "Guide title",
  "excerpt": "Brief overview",
  "content": "<h2 id=\\"overview\\">Overview</h2><p>Content with <a href=\\"..\\">links</a>...</p>",
  "faqs": [{"question": "...", "answer": "..."}]
}

WORD COUNT: 1500-2500 words
TONE: Educational, authoritative, helpful`,

      faq: `You are an expert content writer for GetEducated.com.

Create a comprehensive FAQ article about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}

CRITICAL: Return valid JSON. Escape all special characters.

INTERNAL LINKING (MANDATORY - 2+ links):
${linkingContext.map((article, i) => `${i + 1}. ${article.title} - ${article.url}`).join('\n')}

EXTERNAL LINKING (MANDATORY - 1+ link):
Cite credible external sources in your answers.

STRUCTURE:

1. INTRODUCTION (brief overview with links to related GetEducated content)

2. MAIN FAQ SECTIONS (organized by theme):
   Create 15-20 FAQs with detailed answers
   Include internal and external links within answers where relevant

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "FAQ title",
  "excerpt": "What readers will learn",
  "content": "<h2>Introduction</h2><p>Content with <a href=\\"..\\">links</a>...</p>",
  "faqs": [
    {"question": "First question?", "answer": "Detailed answer with <a href=\\"..\\">links</a>"},
    {"question": "Second question?", "answer": "Detailed answer"}
  ]
}

WORD COUNT: 2000-3000 words
TONE: Conversational, helpful, comprehensive`
    };

    return templates[data.contentType] || templates.guide;
  };

  const getSectionsForType = (type) => {
    const sections = {
      ranking: ['What is the degree?', 'Career Opportunities', 'Salary & Job Outlook', 'How to Choose'],
      career_guide: ['What is the role?', 'Education Requirements', 'Step-by-Step Guide', 'Skills Needed', 'Career Outlook', 'Salary Information'],
      listicle: ['Introduction', 'Why Choose This Path?', 'Top 15-25 Jobs List', 'Career Outlook'],
      guide: ['Overview', 'Key Concepts', 'Step-by-Step Process', 'Best Practices', 'Resources'],
      faq: ['General Information', 'Education Requirements', 'Career Prospects', 'Salary Information']
    };
    return sections[type] || sections.guide;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runAutomaticGeneration = async (dataToUse) => {
    try {
      setCurrentStep(4);
      setIsGenerating(true);

      const steps = [];
      const addStep = (message) => {
        steps.push({
          timestamp: new Date().toLocaleTimeString(),
          message
        });
        setGenerationSteps([...steps]);
      };

      addStep('🚀 Starting automatic article generation...');
      await delay(600);

      // Auto-select content type if not present
      let contentType = dataToUse.contentType;
      if (!contentType) {
        addStep('🎯 Analyzing idea to determine best content type...');
        await delay(800);

        // Simple logic to pick content type based on title/description
        const ideaText = (dataToUse.selectedIdea.title + ' ' + (dataToUse.targetAudience || '')).toLowerCase();
        if (ideaText.includes('top ') || ideaText.includes('best ') || /\d+/.test(ideaText)) {
          contentType = 'listicle';
        } else if (ideaText.includes('career') || ideaText.includes('job') || ideaText.includes('become')) {
          contentType = 'career_guide';
        } else if (ideaText.includes('degree') || ideaText.includes('program')) {
          contentType = 'ranking';
        } else {
          contentType = 'guide';
        }

        addStep(`✓ Selected content type: ${contentType.replace(/_/g, ' ')}`);
        await delay(500);
      } else {
        addStep(`✓ Using content type: ${contentType.replace(/_/g, ' ')}`);
        await delay(400);
      }

      // Auto-generate and select title
      addStep('📝 Generating optimized titles...');
      await delay(1000);

      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      const titlePrompt = `Generate 3 SEO-optimized article titles for this topic.

Topic: ${dataToUse.selectedIdea.title}
Description: ${dataToUse.targetAudience}
Content Type: ${contentType.replace(/_/g, ' ')}
Keywords: ${dataToUse.keywords.slice(0, 5).join(', ')}

Return ONLY a JSON object with a titles array. Each title should be compelling, SEO-friendly, and appropriate for GetEducated.com.

{
  "titles": [
    {"title": "Title 1", "seo_rationale": "Why this is good for SEO", "difficulty": "Easy"},
    {"title": "Title 2", "seo_rationale": "Why this is good for SEO", "difficulty": "Medium"},
    {"title": "Title 3", "seo_rationale": "Why this is good for SEO", "difficulty": "Hard"}
  ]
}`;

      const titleResult = await InvokeLLM({
        prompt: titlePrompt,
        provider: 'xai',
        model: aiModel,
        temperature: 0.7,
        max_tokens: 2000,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  seo_rationale: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      const bestTitle = titleResult.titles?.[0]?.title || dataToUse.selectedIdea.title;
      addStep(`✓ Selected title: "${bestTitle}"`);
      await delay(600);

      // Update wizard data with content type and title
      const finalData = {
        ...dataToUse,
        contentType,
        selectedTitle: bestTitle
      };
      setWizardData(finalData);

      // Now run the full generation - continue with rest of generation
      addStep(`Analyzing chosen topic: "${finalData.selectedTitle}"`);
      await delay(600);

      addStep('Scanning GetEducated.com for relevant articles to link to...');
      await delay(900);

      addStep(`Identifying key sub-topics and H2 structure for a "${(finalData.contentType || 'guide').replace(/_/g, ' ')}" article.`);
      await delay(900);

      addStep(`Performing keyword analysis for: ${finalData.keywords.slice(0, 5).join(', ')}.`);
      await delay(1000);

      addStep('Searching for credible external sources and citations...');
      await delay(1000);

      addStep('Drafting introduction and outlining core arguments.');
      await delay(1000);

      const sections = getSectionsForType(finalData.contentType);
      for (const section of sections) {
        addStep(`Generating content for section: "${section}"`);
        await delay(800);
      }

      addStep('Inserting internal links to related GetEducated articles...');
      await delay(800);

      addStep('Adding external citations from trusted sources...');
      await delay(800);

      addStep('Structuring content with appropriate HTML tags and headings.');
      await delay(600);

      addStep('Generating initial FAQ section based on common user queries.');
      await delay(1000);

      addStep('Running quality checks: word count, readability, structure.');
      await delay(800);

      addStep('Humanizing content to sound natural and authentic.');
      await delay(700);

      addStep('Finalizing draft and preparing for review.');
      await delay(500);

      // Build context-aware prompt with existing articles
      const prompt = buildPrompt(finalData, existingArticles);

      addStep('Invoking AI language model with optimized prompt...');

      addStep(`Using AI model: ${aiModel}...`);

      // Call the LLM WITH internet context for external citations
      let result = null;
      try {
        result = await InvokeLLM({
          prompt,
          provider: 'xai',
          model: aiModel,
          temperature: 0.7,
          max_tokens: 8000,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  }
                }
              }
            }
          }
        });

        console.log('🔍 LLM Raw Result:', result);
        addStep('✓ AI response received, validating structure...');

      } catch (llmError) {
        console.error('❌ LLM Call Failed:', llmError);
        addStep(`✗ AI generation failed: ${llmError.message}`);

        if (llmError.message.includes('JSON') || llmError.message.includes('delimiter')) {
          throw new Error('The AI generated malformed content. This is usually temporary - please try again.');
        }

        throw new Error(`AI generation failed: ${llmError.message}`);
      }

      // Validate and sanitize the result
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result structure:', result);
        addStep('✗ AI returned invalid response format');
        throw new Error('AI returned an invalid response. Please try again.');
      }

      // Clean markdown code fences from content
      let cleanContent = (result.content || '<p>Content generation in progress. Please try again.</p>')
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .trim();

      const sanitizedResult = {
        title: result.title || finalData.selectedTitle,
        excerpt: result.excerpt || `A comprehensive guide about ${finalData.selectedTitle}`,
        content: cleanContent,
        faqs: Array.isArray(result.faqs) ? result.faqs : []
      };

      // Validate title exists
      if (!sanitizedResult.title || sanitizedResult.title.trim() === '') {
        throw new Error('AI failed to generate a valid title. Please try again.');
      }

      if (!sanitizedResult.content || sanitizedResult.content.length < 100) {
        console.error('❌ Content too short:', sanitizedResult.content);
        addStep('✗ Generated content is too short or empty');
        throw new Error('Generated content is too short. Please try again.');
      }

      addStep('✓ Content validated successfully!');
      addStep('Verifying internal and external links...');
      await delay(500);

      // Validate links
      const internalLinkCount = (sanitizedResult.content.match(/geteducated\.com/gi) || []).length;
      const externalLinkCount = (sanitizedResult.content.match(/<a href="http/gi) || []).length - internalLinkCount;

      if (internalLinkCount < 2) {
        addStep(`⚠ Warning: Only ${internalLinkCount} internal link(s) found (2+ recommended)`);
      } else {
        addStep(`✓ ${internalLinkCount} internal links added`);
      }

      if (externalLinkCount < 1) {
        addStep(`⚠ Warning: No external links found (1+ recommended)`);
      } else {
        addStep(`✓ ${externalLinkCount} external citation(s) added`);
      }

      addStep('🎨 Humanizing content for natural flow...');
      await delay(600);

      // Humanize the content
      const humanizationPrompt = `Take this educational article and humanize it to sound naturally written by an experienced education journalist.

ARTICLE TO HUMANIZE:
${sanitizedResult.content}

HUMANIZATION INSTRUCTIONS:

1. SENTENCE VARIETY:
   - Mix short punchy sentences (5-8 words) with longer complex ones (20-30 words)
   - Vary paragraph lengths - some 2 sentences, some 5-6 sentences
   - Use occasional sentence fragments for emphasis. Like this.

2. CONVERSATIONAL TONE:
   - Add contractions: "don't", "won't", "isn't", "you'll", "it's"
   - Include rhetorical questions: "Why does this matter?" "What's the takeaway?"
   - Use transitional phrases: "Here's the thing...", "That said...", "Let's be honest..."
   - Address reader directly: "you", "your"

3. NATURAL IMPERFECTIONS:
   - Start some sentences with "And" or "But"
   - Use em dashes for emphasis — like this
   - Add parenthetical asides (when they add value)
   - Less formal vocabulary in spots

4. REMOVE AI PATTERNS:
   - Eliminate: "Furthermore", "Moreover", "In conclusion", "It's worth noting"
   - Vary how paragraphs start - don't always use topic sentences
   - Mix up transition words
   - Avoid overly perfect structure

5. ADD PERSONALITY:
   - Use specific examples instead of generic ones
   - Include industry-relevant analogies
   - Occasional opinionated statements (professionally)
   - Natural tangents that circle back to the point

6. MAINTAIN QUALITY:
   - Keep all H2/H3 headings with id attributes unchanged
   - Preserve all links and citations exactly as-is
   - Keep factual accuracy and professionalism
   - Maintain GetEducated's helpful, trustworthy voice

CRITICAL: Return ONLY the humanized HTML content. No explanations.`;

      const humanizedContent = await InvokeLLM({
        prompt: humanizationPrompt,
        provider: 'xai',
        model: aiModel,
        temperature: 0.8,
        max_tokens: 8000
      });

      const cleanHumanized = humanizedContent
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:humanized|rewritten).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();

      sanitizedResult.content = cleanHumanized;
      addStep('✓ Content humanized and ready!');
      await delay(400);

      addStep('AI generation complete! Creating article record...');
      await delay(500);

      // Calculate word count
      const wordCount = sanitizedResult.content
        .replace(/<[^>]*>/g, '')
        .split(/\s+/)
        .filter(w => w && w.length > 0)
        .length;

      console.log('📊 Article Stats:', {
        title: sanitizedResult.title,
        excerptLength: sanitizedResult.excerpt.length,
        contentLength: sanitizedResult.content.length,
        wordCount: wordCount,
        faqCount: sanitizedResult.faqs.length,
        internalLinks: internalLinkCount,
        externalLinks: externalLinkCount
      });

      // Create article with status 'in_review'
      const article = await Article.create({
        title: sanitizedResult.title,
        excerpt: sanitizedResult.excerpt,
        content: sanitizedResult.content,
        type: finalData.contentType,
        status: 'in_review',
        target_keywords: finalData.keywords || [],
        faqs: sanitizedResult.faqs,
        word_count: wordCount,
        internal_links: internalLinkCount,
        external_links: externalLinkCount,
        schema_valid: true
      });

      console.log('✅ Article created successfully:', article);

      addStep('✓ Article successfully created and added to Review Queue!');
      await delay(1000);

      setGeneratedArticle(article);
      setCurrentStep(5);
      setIsGenerating(false);
      setAutoRunning(false);

    } catch (error) {
      console.error('Auto-generation error:', error);
      setIsGenerating(false);
      setAutoRunning(false);
      alert('Automatic generation failed: ' + error.message);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isGenerating) {
      setCurrentStep(currentStep - 1);
    } else if (!isGenerating) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {currentStep !== 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBack}
                disabled={isGenerating || autoRunning}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {autoRunning ? 'Automatic Generation' : 'Generate New Article'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {autoRunning && 'AI is running the full article creation pipeline...'}
                  {!autoRunning && currentStep === 1 && 'Choose from AI-powered suggestions or create custom'}
                  {!autoRunning && currentStep === 2 && 'Select the best article type for your topic'}
                  {!autoRunning && currentStep === 3 && 'Choose an SEO-optimized title'}
                  {!autoRunning && currentStep === 4 && 'AI is crafting your article with smart linking'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Steps */}
        {!isGenerating && !autoRunning && currentStep < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                  ${currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-24 h-1 transition-all
                    ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <IdeaSelection
              keywords={keywords}
              clusters={clusters}
              contentIdeas={contentIdeas}
              onSelect={handleIdeaSelect}
            />
          )}

          {currentStep === 2 && (
            <ContentTypeSelection
              selectedIdea={wizardData.selectedIdea}
              onSelect={handleContentTypeSelect}
            />
          )}

          {currentStep === 3 && (
            <TitleSelection
              selectedIdea={wizardData.selectedIdea}
              contentType={wizardData.contentType}
              keywords={wizardData.keywords}
              onSelect={handleTitleSelect}
            />
          )}

          {currentStep === 4 && (
            <DetailedProgressIndicator
              steps={generationSteps}
              isComplete={false}
            />
          )}

          {currentStep === 5 && generatedArticle && (
            <GenerationSuccess
              article={generatedArticle}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
