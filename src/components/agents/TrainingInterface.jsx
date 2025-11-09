
import React, { useState, useEffect } from 'react';
import { Client } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookOpen, Save, Loader2, AlertCircle } from 'lucide-react';

export default function TrainingInterface({ agent }) {
  const [client, setClient] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [directives, setDirectives] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
        setIsLoading(true);
        try {
            let clientData = await Client.list("name", 1);
            
            if (clientData.length === 0) {
              const defaultClient = await Client.create({
                name: "Perdia Education",
                hourly_rate: 0,
                currency: "USD",
                color: "#2563eb",
                status: "active"
              });
              clientData = [defaultClient];
            }
            
            const loadedClient = clientData[0];
            setClient(loadedClient);
            setKeywords(loadedClient.focus_keywords || '');
            setDirectives(loadedClient.ai_writing_directives || '');

        } catch (error) {
            console.error("Failed to load client settings", error);
            toast.error("Could not load training data.");
        } finally {
            setIsLoading(false);
        }
    }
    loadClientData();
  }, []);

  const handleSaveTrainingData = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      await Client.update(client.id, {
        focus_keywords: keywords,
        ai_writing_directives: directives,
      });
      toast.success("Training data saved successfully! The agent will now use this information for all content generation.", {
        duration: 4000
      });
    } catch (error) {
      console.error("Error saving training data:", error);
      toast.error("Failed to save training data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const agentDisplayName = agent?.display_name || agent?.name?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'AI Agent';
  
  if (isLoading) {
    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                <CardTitle>Loading Training Data...</CardTitle>
            </CardHeader>
            <CardContent><Loader2 className="w-8 h-8 animate-spin" /></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Training Data for Perdia Education
          </CardTitle>
          <CardDescription>
            Configure the training data that the <strong>{agentDisplayName}</strong> will use following the 10/27/2025 keyword strategy, monetization alignment, and humanization requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keywords" className="font-semibold">Keyword Strategy & Segmentation</Label>
            <p className="text-sm text-slate-500">Enter keywords segmented by: <strong>Currently Ranked</strong> (6K+, focus page 2) vs <strong>New Keywords</strong> (clusters from head terms). AI will select 1 head + 3-5 long-tail per piece, prioritizing volume, ranking position, and monetization fit.</p>
            <Textarea
              id="keywords"
              placeholder="Currently Ranked (Page 2 Focus):
online MBA programs, affordable online MBA for working adults, best online MBA programs 2025, is an online MBA worth it

New Keyword Clusters:
[Head: online nursing degrees]
- online BSN programs for working nurses
- accelerated online nursing degree
- how long does online nursing degree take
- best accredited online nursing schools

[Head: online teaching certification]
- online teaching certificate programs
- alternative teaching certification online
- can you get teaching license online
- fastest online teaching certification

Monetization: Filter for database-aligned degrees only (MBA, Nursing, Teaching, etc). Avoid: mortuary school, niche certs."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={8}
              className="bg-white font-mono text-sm"
            />
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">📊 Segmentation Strategy (10/27/2025):</p>
              <p>70% NEW content from keyword clusters | 30% OPTIMIZE currently ranked (page 2 priority)</p>
              <p className="mt-1">Prioritize: Volume × Ranking Position × Monetization Fit</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="directives" className="font-semibold">AI Writing Directives & Humanization Guidelines</Label>
            <p className="text-sm text-slate-500">Comprehensive instructions including brand voice, humanization techniques, WordPress shortcode requirements, and monetization parameters.</p>
            <Textarea
              id="directives"
              placeholder="🚨 CRITICAL: HUMANIZATION FIRST (Google Spam Update Response)

WRITING STYLE - SOUND AUTHENTICALLY HUMAN:

1. VARY SENTENCE STRUCTURE (avoid repetitive patterns):
   - Mix short punchy sentences with longer flowing ones
   - Example: 'Online MBAs offer flexibility. They're typically more affordable too—and you can study from anywhere.' (NOT: 'Online MBAs are flexible. Online MBAs are affordable. Online MBAs are convenient.')

2. USE NATURAL TRANSITIONS (don't start every paragraph the same):
   - Vary with: 'Here's the thing...', 'Now...', 'But wait...', 'The reality is...', 'What's interesting...'

3. ADD PERSONALITY & OPINION (include measured perspectives):
   - 'In our experience reviewing 500+ programs...'
   - 'What surprises most people is...'
   - 'The truth schools won't tell you...'

4. USE CONTRACTIONS NATURALLY:
   - Use: you'll, it's, they're, won't, can't, we've
   - NOT: you will, it is, they are (unless emphasizing)

5. BREAK GRAMMAR RULES OCCASIONALLY (humans aren't perfect):
   - Start sentences with 'And' or 'But' sometimes
   - Use fragments for emphasis: 'Worth every penny.'
   - End with prepositions when natural

6. INCLUDE SPECIFIC EXAMPLES (not generic):
   - NOT: 'Many students succeed'
   - YES: 'Take Maria, a working nurse who completed her BSN online while raising two kids'

7. USE ACTIVE VOICE (passive sounds robotic):
   - NOT: 'The program was completed by students in 18 months'
   - YES: 'Students completed the program in 18 months'

8. ADD RHETORICAL QUESTIONS:
   - 'Wondering if an online MBA is worth it?'
   - 'Sound too good to be true?'

9. VARY PARAGRAPH LENGTH (not uniform):
   - Mix single-sentence paragraphs with longer 5-6 sentence ones

10. AVOID AI CLICHÉS (detection triggers):
    - Don't overuse: delve into, navigate, landscape, realm, robust, leverage
    - Don't start: 'In today's digital age', 'In the ever-evolving world of'

---

FOR ADMINISTRATORS (B2B - EMMA™):
Professional about EMMA™ enrollment platform. ROI focus, performance-based pricing, AI-guided enrollment journey. Conversational but authoritative.

FOR STUDENTS (B2C - DEGREE GUIDANCE):
Helpful advisor tone. Unbiased comparisons, cite accreditation, emphasize value/ROI. Like talking to a knowledgeable friend, not reading corporate content.

WORDPRESS SHORTCODE INTEGRATION:
- Single text block, proper spacing
- Insert after program recommendations
- [degree_category=5 display_count=4] after 'Top MBA Programs'
- Reference spreadsheet for category numbers

MONETIZATION:
- Database degrees only (MBA, Nursing, Teaching, CS, Business, Healthcare)
- FILTER OUT: mortuary school, ultra-niche certifications
- Target enrollment intent, quality over volume

KEYWORD STRATEGY:
- Currently Ranked: Page 2 (11-20) quick wins
- New: Clusters (1 head + 5-10 long-tail/questions)
- Question-based for AI search (ChatGPT, Perplexity)

INTERNAL LINKING:
- 3-5 schema page links per article
- Natural anchor text (not keyword-stuffed)
- Hub-spoke topical clusters

CONTENT STRUCTURE:
- 800-1500 words, single-block WordPress
- Varied H2/H3 (not formulaic)
- FAQ: 5-7 natural questions
- CTA: EMMA™ demo OR download resource

E-E-A-T SIGNALS:
- 'After reviewing X programs...'
- Specific data with realistic citations
- Show expertise through insights
- Balanced perspectives

HERITAGE & BRAND:
- Perdia Education (evolved from GetEducated, 1989)
- 40M+ students served
- EMMA™ patent-pending AI enrollment
- Performance-based, no long-term contracts

PRODUCTION:
- Testing: 2-3/week, human review
- Scaling: 6-8/day, 70% new / 30% optimize
- Autonomous: Full rotation with quality monitoring

TONE: Professional, conversational, helpful. Trusted advisor, not corporate brochure. Human with personality, not robot perfection."
              value={directives}
              onChange={(e) => setDirectives(e.target.value)}
              rows={24}
              className="bg-white font-mono text-xs"
            />
          </div>

          {(keywords || directives) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-800 mb-2">✅ Preview: How this training data will be used</h4>
              <div className="text-sm text-emerald-700 space-y-2">
                <p><strong>Keyword Segmentation:</strong> 70% new clusters / 30% optimize currently ranked (page 2 priority)</p>
                <p><strong>Monetization Filter:</strong> Database-aligned degrees only; auto-filter low-conversion topics</p>
                <p><strong>WordPress Format:</strong> Single-block with embedded shortcodes after relevant sections</p>
                <p><strong>Internal Linking:</strong> 3-5 schema page links per article for topical authority</p>
                <p><strong>Dual Audience:</strong> B2B (EMMA™ to admins) + B2C (degree guidance to students)</p>
                <p><strong>SEO Strategy:</strong> Question-based long-tail for AI search + featured snippets</p>
                <p><strong>Quality Focus:</strong> User value and enrollment intent over raw traffic volume</p>
                <p><strong>Production Target:</strong> 2-3/week (testing) → 6-8/day (scaling)</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveTrainingData} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Training Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Current Agent: {agentDisplayName}</CardTitle>
          <CardDescription>
            This agent specializes in {agent?.description?.toLowerCase() || 'content creation'}. It will use the training data above plus the 10/27/2025 keyword strategy for monetization-aligned content generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 border rounded-md text-sm text-slate-700">
            <p className="font-medium mb-2">Agent Core Instructions:</p>
            <p>{agent?.description || "This agent helps create high-quality content tailored to your specific business needs."}</p>
            <p className="mt-3 text-xs text-slate-500">
              <strong>Note:</strong> The agent will automatically combine these core instructions with your Perdia-specific training data, keyword segmentation strategy, and WordPress shortcode requirements for targeted content generation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900">🎯 Quick Reference: 10/27/2025 Strategy + Humanization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-blue-800">Keyword Segmentation:</p>
            <p className="text-slate-700">• <strong>Currently Ranked:</strong> 6K+ keywords, focus page 2 (positions 11-20) for quick wins</p>
            <p className="text-slate-700">• <strong>New Keywords:</strong> Build clusters from head terms (1 head + 5-10 long-tail/questions)</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Content Rotation:</p>
            <p className="text-slate-700">• 70% NEW content from keyword clusters | 30% OPTIMIZE existing pages</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Monetization Priority:</p>
            <p className="text-slate-700">• Include: Database-aligned degrees (MBA, Nursing, Teaching, etc.)</p>
            <p className="text-slate-700">• Exclude: Low-conversion topics (e.g., mortuary school, ultra-niche)</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">WordPress Shortcodes:</p>
            <p className="text-slate-700 font-mono text-xs">• [degree_category=NUM display_count=NUM]</p>
            <p className="text-slate-700 font-mono text-xs">• [subcategory=NUM level=NUM]</p>
            <p className="text-slate-700">• Insert contextually after program recommendations in single-block format</p>
          </div>
          <div>
            <p className="font-semibold text-red-800">🚨 Humanization (NEW - Google Spam Response):</p>
            <p className="text-slate-700">• Vary sentence lengths, use contractions, add personality</p>
            <p className="text-slate-700">• Specific examples with names/numbers, rhetorical questions</p>
            <p className="text-slate-700">• Avoid AI clichés: "delve into", "landscape", "robust"</p>
            <p className="text-slate-700">• Sound like helpful human expert, not corporate AI</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Production Targets:</p>
            <p className="text-slate-700">• Testing: 2-3 articles/week with human review</p>
            <p className="text-slate-700">• Scaling: 6-8 articles/day, auto-insert shortcodes</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            🚨 Google Quality & Spam Update Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-semibold text-red-800">Critical Requirements for All Content:</p>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-blue-700">📏 Content Length (REQUIRED):</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li><strong>Target: 900-1200 words</strong> (~8,000 characters)</li>
              <li>Do NOT exceed 1200 words (keep focused)</li>
              <li>Do NOT fall below 900 words (insufficient depth)</li>
            </ul>
          </div>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-purple-700">❓ FAQ Requirements (CRITICAL for AI Overviews):</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li><strong>7-10 questions per article</strong> (increased from 5-7)</li>
              <li>Use ACTUAL search queries people type</li>
              <li>Format: Question as H3, Answer as paragraph (150-250 words)</li>
              <li>Front-load answers (direct response first)</li>
              <li>Optimize for AI search: ChatGPT, Perplexity, Google AI Overviews</li>
              <li>Question types: How, What, Is/Are, Can, Cost, Comparison, Practical</li>
            </ul>
          </div>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-red-700">🛡️ E-E-A-T Compliance (Google Quality Standards):</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li><strong>NO fabricated case studies or student examples</strong></li>
              <li><strong>NO made-up names, outcomes, or testimonials</strong></li>
              <li>Use ONLY factual, verifiable information</li>
              <li>Cite real sources (NCES, accreditation bodies, .gov/.edu sites)</li>
              <li>Reference Perdia's 35+ years experience, 40M+ students served</li>
              <li>Present balanced perspectives (pros AND cons)</li>
              <li>Be transparent about affiliations and comparisons</li>
            </ul>
          </div>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-green-700">✅ What TO Include:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li>Real accreditation bodies: HLC, ACBSP, CCNE, ABET</li>
              <li>Verified statistics: "According to NCES data..."</li>
              <li>General factual statements: "Most accredited programs require..."</li>
              <li>Cited sources and data</li>
              <li>Balanced, transparent comparisons</li>
            </ul>
          </div>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-red-700">❌ What NOT to Include:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li>"Maria, a working nurse, completed..." (fabricated examples)</li>
              <li>Made-up timelines or specific outcomes</li>
              <li>Fake testimonials or quotes</li>
              <li>Unverified statistics</li>
              <li>Overblown claims or guarantees</li>
            </ul>
          </div>

          <div className="bg-white/60 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-orange-700">🤖 Humanization (AI Detection Prevention):</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li>Varied sentence lengths (mix 5-30 word sentences)</li>
              <li>Contractions & conversational tone (you'll, it's, won't)</li>
              <li>Rhetorical questions & active voice</li>
              <li>Occasional grammar "imperfections" (fragments, starting with And/But)</li>
              <li>Fact-based insights ("In our 35 years reviewing programs...")</li>
              <li>Varied paragraph lengths (1-6 sentences, not uniform)</li>
              <li>Avoid AI clichés: "delve into", "landscape", "robust"</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Remember:</strong> All content must be factual, human-sounding, 900-1200 words, with 7-10 FAQ questions optimized for AI search. No fabricated examples allowed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
