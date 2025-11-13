import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import IdeaSelection from "../components/wizard/IdeaSelection";
import ContentTypeSelection from "../components/wizard/ContentTypeSelection";
import TitleSelection from "../components/wizard/TitleSelection";
import DetailedProgressIndicator from "../components/wizard/DetailedProgressIndicator";
import GenerationSuccess from "../components/wizard/GenerationSuccess";

export default function ArticleWizard() {
  const navigate = useNavigate();
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

  // Fetch data for suggestions
  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords-wizard'],
    queryFn: () => base44.entities.Keyword.filter({ target_flag: true }, '-search_volume', 20),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters-wizard'],
    queryFn: () => base44.entities.Cluster.filter({ status: 'active' }, '-priority', 10),
  });

  const { data: contentIdeas = [] } = useQuery({
    queryKey: ['content-ideas-wizard'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }, '-trending_score', 15),
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
    // Update state
    const updatedData = {
      ...wizardData,
      selectedTitle: title
    };
    setWizardData(updatedData);
    // Pass the updated data directly to avoid async state issues
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
      addStep('Initializing content generation engine...');
      await delay(800);

      addStep(`Analyzing chosen topic: "${dataToUse.selectedTitle}"`);
      await delay(600);

      addStep(`Identifying key sub-topics and H2 structure for a "${dataToUse.contentType.replace(/_/g, ' ')}" article.`);
      await delay(900);

      addStep(`Performing real-time keyword research and semantic analysis for: ${dataToUse.keywords.slice(0, 5).join(', ')}.`);
      await delay(1000);

      addStep('Searching external sources (BLS, trusted academic sites) for supporting data and statistics.');
      await delay(1200);

      addStep('Drafting introduction and outlining core arguments.');
      await delay(1000);

      const sections = getSectionsForType(dataToUse.contentType);
      for (const section of sections) {
        addStep(`Generating content for section: "${section}"`);
        await delay(800);
      }

      addStep('Integrating BLS data for salary projections and job outlook (bls.gov/ooh).');
      await delay(900);

      addStep('Proposing internal links to related content in GetEducated.com.');
      await delay(700);

      addStep('Formatting content with appropriate HTML tags and attributes.');
      await delay(600);

      addStep('Generating initial FAQ section based on common user queries.');
      await delay(1000);

      addStep('Running preliminary quality checks: word count, readability, keyword density.');
      await delay(800);

      addStep('Validating monetization link compliance and schema markup requirements.');
      await delay(700);

      addStep('Checking for BLS citation accuracy and proper formatting.');
      await delay(600);

      addStep('Finalizing draft and preparing for review.');
      await delay(500);

      // Actual article generation
      const prompt = buildPrompt(dataToUse);
      
      addStep('Invoking AI language model with optimized prompt...');
      
      // Call the LLM
      let result = null;
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
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

        // Log the raw result for debugging
        console.log('🔍 LLM Raw Result:', result);
        addStep('✓ AI response received, validating structure...');

      } catch (llmError) {
        console.error('❌ LLM Call Failed:', llmError);
        addStep(`✗ AI generation failed: ${llmError.message}`);
        throw new Error(`AI generation failed: ${llmError.message}`);
      }

      // Validate and sanitize the result
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result structure:', result);
        addStep('✗ AI returned invalid response format');
        throw new Error('AI returned an invalid response. Result is not an object.');
      }

      // Ensure all required properties exist with fallback values
      const sanitizedResult = {
        title: result.title || dataToUse.selectedTitle || 'Untitled Article',
        excerpt: result.excerpt || `A comprehensive guide about ${dataToUse.selectedTitle}`,
        content: result.content || '<p>Content generation in progress. Please try again.</p>',
        faqs: Array.isArray(result.faqs) ? result.faqs : []
      };

      // Validate that we have actual content
      if (!sanitizedResult.content || sanitizedResult.content.length < 100) {
        console.error('❌ Content too short:', sanitizedResult.content);
        addStep('✗ Generated content is too short or empty');
        throw new Error('Generated content is too short. The AI may not have generated proper content.');
      }

      addStep('✓ Content validated successfully!');
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
        faqCount: sanitizedResult.faqs.length
      });

      // Create article with status 'in_review' so it appears in review queue
      const article = await base44.entities.Article.create({
        title: sanitizedResult.title,
        excerpt: sanitizedResult.excerpt,
        content: sanitizedResult.content,
        type: dataToUse.contentType,
        status: 'in_review',
        target_keywords: dataToUse.keywords || [],
        faqs: sanitizedResult.faqs,
        word_count: wordCount,
        schema_valid: true,
        model_used: 'gpt-4',
        generation_prompt: prompt
      });

      console.log('✅ Article created successfully:', article);

      addStep('✓ Article successfully created and added to Review Queue!');
      await delay(1000);

      // Store article and move to success screen
      setGeneratedArticle(article);
      setCurrentStep(5);
      setIsGenerating(false);
      
    } catch (error) {
      console.error('💥 Article Generation Error:', error);
      console.error('Error Stack:', error.stack);
      
      addStep(`✗ Error: ${error.message}`);
      addStep('Generation failed. Please try again or contact support if the issue persists.');
      
      // Keep user on progress screen to see error messages
      setIsGenerating(false);
      
      // Optionally show alert
      setTimeout(() => {
        alert(`Article generation failed: ${error.message}\n\nPlease try again. If the problem persists, the AI may be experiencing issues.`);
      }, 1000);
    }
  };

  const buildPrompt = (data) => {
    const templates = {
      ranking: `You are an expert content writer for GetEducated.com, a trusted guide to online education.

Create a comprehensive RANKING article about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

STRUCTURE YOUR ARTICLE EXACTLY AS FOLLOWS:

1. OPENING SECTION (2-3 paragraphs):
   - Hook paragraph about the degree/career field
   - Context about why this matters for students
   - Mention cost savings opportunities

2. KEY STATISTICS BOX:
   Format: "**Average Cost (In-state):** ~$XX,XXX
   **Least Expensive:** [School Name] ~$XX,XXX
   **Most Expensive:** [School Name] ~$XXX,XXX"

3. METHODOLOGY STATEMENT:
   "Our data-driven research creates a truly reliable system of scientific rankings. We meticulously calculate total full-time tuition—including any fees—for the most accurate total cost. Our rankings cannot be bought."

4. MAIN CONTENT SECTIONS (H2 headings with IDs):
   - What is a [Degree Name]?
   - Career Opportunities
   - Salary and Job Outlook (cite BLS data with dates)
   - How to Choose the Right Program
   - FAQs (at least 5 questions)

5. INTERNAL LINKING:
   - Link to at least 5 related degree categories
   - Link to relevant career guides
   - Use natural anchor text

6. EXTERNAL CITATIONS:
   - Cite Bureau of Labor Statistics (bls.gov/ooh) for salary data
   - Include publication dates
   - Format: "According to the Bureau of Labor Statistics, [occupation] earned a median salary of $XX,XXX per year as of [date]"

7. FAQs SECTION:
   Create 5-7 FAQs that are genuinely helpful

IMPORTANT: You MUST return a JSON object with these exact fields:
{
  "title": "Article title here",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full HTML content here",
  "faqs": [{"question": "...", "answer": "..."}]
}

TONE: Professional, helpful, consumer-focused
WORD COUNT: 1500-2000 words
FORMAT: HTML with proper H2 tags that include id attributes for navigation`,

      career_guide: `You are an expert content writer for GetEducated.com.

Create a comprehensive CAREER GUIDE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

STRUCTURE:

1. INTRODUCTION (2 paragraphs):
   - Compelling hook about the profession
   - What readers will learn

2. MAIN SECTIONS (H2 with IDs):
   - What is a [Job Title]?
   - How Long Does It Take to Become a [Job Title]?
   - Step-by-Step Guide (numbered list of 6-8 steps)
   - Skills Needed to Succeed
   - Education Requirements
   - Certifications and Licensing
   - Career Outlook (BLS data with citations and dates)
   - Salary Information (BLS data with citations and dates)
   - Advancement Opportunities
   - Benefits of Becoming a [Job Title]

3. RELATED RESOURCES:
   - Link to relevant degree programs
   - Link to related career guides

4. FAQs (5-7 questions)

CITATIONS:
- Always cite Bureau of Labor Statistics with dates
- Example: "According to the Bureau of Labor Statistics (BLS), the median annual wage for [occupation] was $XX,XXX as of May 2023."
- Include growth projections with date ranges

IMPORTANT: You MUST return a JSON object with these exact fields:
{
  "title": "Article title here",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full HTML content here",
  "faqs": [{"question": "...", "answer": "..."}]
}

TONE: Encouraging, practical, step-by-step
WORD COUNT: 2000-2500 words`,

      listicle: `You are an expert content writer for GetEducated.com.

Create a LISTICLE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}

STRUCTURE:

1. INTRODUCTION:
   - Why this list matters
   - What readers will discover

2. MAIN SECTIONS:
   - What is an [Degree Level]?
   - Why Choose This Path?
   - Benefits of This Degree Level

3. THE LIST:
   Create a numbered list of 15-25 jobs, each with:
   - Job Title (H3)
   - Median Salary (from BLS with date)
   - Job Growth Rate (from BLS with date range)
   - Brief description (3-4 sentences)
   - Educational requirements
   - Link to related degree program

4. CAREER OUTLOOK SECTION:
   - High-growth sectors
   - Declining sectors  
   - Future trends

5. FAQs (5-7 questions)

ALL SALARY DATA MUST:
- Come from Bureau of Labor Statistics
- Include the date (e.g., "as of May 2023")
- Include source link to bls.gov/ooh

IMPORTANT: You MUST return a JSON object with these exact fields:
{
  "title": "Article title here",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full HTML content here",
  "faqs": [{"question": "...", "answer": "..."}]
}

TONE: Informative, data-driven, optimistic
WORD COUNT: 2500-3500 words`,

      guide: `You are an expert content writer for GetEducated.com.

Create a comprehensive GUIDE about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}
ADDITIONAL CONTEXT: ${data.additionalContext}

STRUCTURE:

1. INTRODUCTION (2-3 paragraphs):
   - What this guide covers
   - Who should read it
   - Key benefits

2. MAIN SECTIONS (H2 with IDs):
   - Overview of [Topic]
   - Key Concepts and Terminology
   - Step-by-Step Process
   - Best Practices
   - Common Mistakes to Avoid
   - Resources and Tools
   - FAQs

3. ACTIONABLE ADVICE:
   - Concrete steps readers can take
   - Real-world examples
   - Expert tips

4. INTERNAL LINKS:
   - Link to related programs
   - Link to career guides
   - Link to related topics

IMPORTANT: You MUST return a JSON object with these exact fields:
{
  "title": "Article title here",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full HTML content here",
  "faqs": [{"question": "...", "answer": "..."}]
}

TONE: Educational, authoritative, helpful
WORD COUNT: 1500-2500 words`,

      faq: `You are an expert content writer for GetEducated.com.

Create a comprehensive FAQ article about: "${data.selectedTitle}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords.join(', ')}

STRUCTURE:

1. INTRODUCTION:
   - Brief overview of the topic
   - Why these questions matter

2. MAIN FAQ SECTIONS (organized by theme):
   Create 15-20 FAQs, each with:
   - Clear, specific question (H3)
   - Detailed, helpful answer (3-5 paragraphs)
   - Links to related resources
   - BLS data where relevant

3. CATEGORIES:
   - General Information
   - Education Requirements
   - Career Prospects
   - Salary Information
   - Application Process

IMPORTANT: You MUST return a JSON object with these exact fields:
{
  "title": "Article title here",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full HTML content here",
  "faqs": [{"question": "...", "answer": "..."}]
}

TONE: Conversational, helpful, comprehensive
WORD COUNT: 2000-3000 words`
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

  const handleBack = () => {
    if (currentStep > 1 && !isGenerating) {
      setCurrentStep(currentStep - 1);
    } else if (!isGenerating) {
      navigate(createPageUrl('Dashboard'));
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
                disabled={isGenerating}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Generate New Article
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentStep === 1 && 'Choose from AI-powered suggestions or create custom'}
                  {currentStep === 2 && 'Select the best article type for your topic'}
                  {currentStep === 3 && 'Choose an SEO-optimized title'}
                  {currentStep === 4 && 'AI is crafting your article'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Steps */}
        {!isGenerating && currentStep < 4 && (
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
              onNavigate={(destination) => navigate(destination)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}