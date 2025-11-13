/**
 * TEST PERPLEXITY QUESTIONS FORMAT
 * ==================================
 * Tests what format Perplexity returns for the findTopQuestions prompt
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testQuestionsFormat() {
  console.log('\n🧪 TESTING PERPLEXITY QUESTIONS FORMAT');
  console.log('=======================================\n');

  const prompt = `
Based on current online discussions, forums, and educational content about "online education", suggest 5 questions that would make excellent blog article topics.

For each question:
- Make it specific and actionable
- Include related keywords naturally
- Assess relevance to searchers (high/medium/low)
- Rate content priority (1-5, where 5 = most important)

Focus on questions that:
- Address real student/learner concerns
- Have educational value
- Would benefit from comprehensive answers

Return your response as a JSON object with this EXACT structure:
{
  "questions": [
    {
      "question": "What is the difference between college and university?",
      "keywords": ["college", "university", "higher education"],
      "relevance": "high",
      "priority": 5
    }
  ]
}

IMPORTANT: Return ONLY the JSON object wrapped in a code block. Do not include explanations before or after.
  `.trim();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invoke-perplexity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'sonar-pro',
        temperature: 0.3,
        maxTokens: 4000,
      }),
    });

    console.log('Status:', response.status);

    const data = await response.json();

    console.log('\n📄 FULL RESPONSE:');
    console.log('================');
    console.log('Content Type:', typeof data.content);
    console.log('Content Length:', data.content?.length || 0);
    console.log('\n🔍 RAW CONTENT:');
    console.log('================');
    console.log(data.content);
    console.log('\n📊 METADATA:');
    console.log('================');
    console.log('Model:', data.model);
    console.log('Usage:', data.usage);
    console.log('Citations:', data.citations?.length || 0);

    // Try to parse as JSON
    console.log('\n🧪 PARSING ATTEMPT:');
    console.log('===================');
    try {
      // Try parsing the whole thing
      const parsed = JSON.parse(data.content);
      console.log('✅ Direct JSON.parse() worked!');
      console.log('Questions found:', parsed.questions?.length || 0);
    } catch (e) {
      console.log('❌ Direct JSON.parse() failed:', e.message);

      // Try extracting JSON from markdown code blocks
      const jsonMatch = data.content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        console.log('\n✅ Found JSON in markdown code block');
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          console.log('Questions found:', parsed.questions?.length || 0);
        } catch (e2) {
          console.log('❌ Failed to parse extracted JSON:', e2.message);
        }
      } else {
        console.log('❌ No markdown code block found');

        // Try finding JSON object pattern
        const objMatch = data.content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (objMatch) {
          console.log('\n✅ Found JSON object pattern');
          try {
            const parsed = JSON.parse(objMatch[0]);
            console.log('Questions found:', parsed.questions?.length || 0);
          } catch (e3) {
            console.log('❌ Failed to parse extracted object:', e3.message);
          }
        } else {
          console.log('❌ No JSON object pattern found');
        }
      }
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

testQuestionsFormat();
