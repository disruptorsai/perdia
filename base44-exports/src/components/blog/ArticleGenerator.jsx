
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PenSquare, Save } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { BlogPost } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";

export default function ArticleGenerator({ client, selectedTitle, keywords, onArticleSaved }) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const calculateWordCount = (htmlString) => {
    if (!htmlString) return 0;
    // Strip html tags, then match words
    const text = htmlString.replace(/<[^>]*>?/gm, ' ');
    const words = text.match(/\b\w+\b/g);
    return words ? words.length : 0;
  };

  useEffect(() => {
    const count = calculateWordCount(content);
    setWordCount(count);
  }, [content]);

  useEffect(() => {
    // Clear content and word count when title changes
    setContent('');
    setWordCount(0);
  }, [selectedTitle]);

  const handleGenerateArticle = async () => {
    if (!selectedTitle) return;

    setIsGenerating(true);
    setContent('Generating your comprehensive article with FAQs, please wait...');

    try {
      let prompt;
      if (client.ai_provider === 'openai' && client.openai_assistant_id) {
        prompt = `
          You are an expert SEO content writer using the OpenAI assistant with ID: ${client.openai_assistant_id}.
          Write a comprehensive, high-quality blog post based on the following details.

          Blog Post Title: "${selectedTitle}"
          Primary Keywords to include: ${keywords}
          Target Length: MINIMUM 1500 words, MAXIMUM 1800 words
          Client's Writing Directives: ${client.ai_writing_directives || 'Write in a clear, professional, and engaging tone for a general audience.'}

          CRITICAL WORD COUNT REQUIREMENT:
          - The article MUST be at least 1500 words long
          - Count only the actual content words, not HTML tags
          - If you're under 1500 words, add more detailed explanations, examples, case studies, or expanded sections
          - Aim for 1600-1700 words to ensure you meet the minimum requirement
          
          MANDATORY STRUCTURE REQUIREMENTS:
          - Compelling introduction (150-200 words)
          - At least 6-8 main content sections with H2 subheadings (200-250 words each)
          - Each section should include specific examples, actionable tips, or detailed explanations
          - FAQ section with 5 comprehensive questions and answers (50-100 words per answer)
          - Strong conclusion with clear call-to-action (100-150 words)

          CONTENT DEPTH REQUIREMENTS:
          - Naturally incorporate the primary keywords throughout the content
          - Include specific examples, case studies, statistics, or real-world applications
          - Provide step-by-step instructions where applicable
          - Add industry insights and expert perspectives
          - Include actionable takeaways in each section
          - Write in an engaging, informative style that provides substantial value

          MANDATORY FAQ SECTION:
          - Add a "Frequently Asked Questions" section before the conclusion
          - Include exactly 5 relevant FAQs with detailed answers (50-100 words each)
          - Format each FAQ with H3 tags for questions and paragraph tags for answers
          - Make sure FAQs are directly related to the article topic and keywords
          - Structure FAQs to target common search queries and provide valuable information
          
          QUALITY ASSURANCE:
          - Ensure the content is original, well-researched, and optimized for SEO
          - Use varied sentence structures and engaging language throughout
          - Include transition sentences between sections for better flow
          - Double-check that the final word count is AT LEAST 1500 words
          
          The final output should be the full article content in HTML format. Do not include the title in the body as it will be added separately.
        `;
      } else {
         prompt = `
          You are an expert SEO content writer. Write a comprehensive, high-quality blog post based on the following details.

          Blog Post Title: "${selectedTitle}"
          Primary Keywords to include: ${keywords}
          Target Length: MINIMUM 1500 words, MAXIMUM 1800 words
          Client's Writing Directives: ${client.ai_writing_directives || 'Write in a clear, professional, and engaging tone for a general audience.'}

          CRITICAL WORD COUNT REQUIREMENT:
          - The article MUST be at least 1500 words long
          - Count only the actual content words, not HTML tags
          - If you're under 1500 words, add more detailed explanations, examples, case studies, or expanded sections
          - Aim for 1600-1700 words to ensure you meet the minimum requirement
          
          MANDATORY STRUCTURE REQUIREMENTS:
          - Compelling introduction (150-200 words)
          - At least 6-8 main content sections with H2 subheadings (200-250 words each)
          - Each section should include specific examples, actionable tips, or detailed explanations
          - FAQ section with 5 comprehensive questions and answers (50-100 words per answer)
          - Strong conclusion with clear call-to-action (100-150 words)

          CONTENT DEPTH REQUIREMENTS:
          - Naturally incorporate the primary keywords throughout the content
          - Include specific examples, case studies, statistics, or real-world applications
          - Provide step-by-step instructions where applicable
          - Add industry insights and expert perspectives
          - Include actionable takeaways in each section
          - Write in an engaging, informative style that provides substantial value

          MANDATORY FAQ SECTION:
          - Add a "Frequently Asked Questions" section before the conclusion
          - Include exactly 5 relevant FAQs with detailed answers (50-100 words each)
          - Format each FAQ with H3 tags for questions and paragraph tags for answers
          - Make sure FAQs are directly related to the article topic and keywords
          - Structure FAQs to target common search queries and provide valuable information
          
          QUALITY ASSURANCE:
          - Ensure the content is original, well-researched, and optimized for SEO
          - Use varied sentence structures and engaging language throughout
          - Include transition sentences between sections for better flow
          - Double-check that the final word count is AT LEAST 1500 words

          The final output should be the full article content in HTML format. Do not include the title in the body as it will be added separately.
        `;
      }

      const articleHtml = await InvokeLLM({ prompt });
      setContent(articleHtml);
    } catch (error) {
      console.error("Error generating article:", error);
      setContent(`<p>Error: Could not generate the article. Please try again.</p><p>${error.message}</p>`);
      toast({
        title: "Generation Failed",
        description: "Could not generate the article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content || !selectedTitle) {
      toast({
        title: "Cannot Save",
        description: "You must have a title and content to save a draft.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await BlogPost.create({
        client_id: client.id,
        title: selectedTitle,
        keywords: keywords,
        content: content,
        status: 'Draft',
      });
      toast({
        title: "Draft Saved!",
        description: `Your comprehensive article with FAQs "${selectedTitle}" has been saved.`,
      });
      onArticleSaved();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedTitle) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center text-center p-12">
          <PenSquare className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Generate or Select a Title</h3>
          <p className="text-slate-500">Choose a title from the generated list above to begin writing your comprehensive 1500-1800 word article with FAQs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <PenSquare className="w-5 h-5 text-emerald-600" />
                  Step 2: Write & Edit Article
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">
                  Article Title: <span className="font-bold text-slate-900">{selectedTitle}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Target: 1500-1800 words with 5 FAQs for comprehensive SEO coverage
                </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Button 
                    onClick={handleGenerateArticle} 
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                 >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Generate Article + FAQs
                </Button>
                <Button 
                    onClick={handleSaveDraft} 
                    disabled={isSaving || isGenerating || !content} 
                    variant="outline"
                    className="flex-1 sm:flex-none"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Draft
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg border relative">
            {/* Add a style block to specifically target ReactQuill's inner classes */}
            <style>
            {`
              .ql-container {
                height: 600px; /* Increased the height */
                overflow-y: auto; /* Ensure content scrolls within the container */
                font-size: 16px;
              }
            `}
            </style>
            
            <div className="absolute top-[45px] right-3 text-sm text-slate-500 font-medium z-10 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                {wordCount} words
            </div>
            
            <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={{
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'blockquote'],
                        ['clean']
                    ]
                }}
            />
        </div>
      </CardContent>
    </Card>
  );
}
