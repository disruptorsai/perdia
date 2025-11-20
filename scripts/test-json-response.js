/**
 * Test JSON Schema Response from invoke-llm Edge Function
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testJSONResponse() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TESTING JSON SCHEMA RESPONSE FIX                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  console.log('📋 Testing JSON schema response...\n');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/invoke-llm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'claude',
        model: 'claude-haiku-4-5-20251001',
        prompt: 'Generate 3 article title ideas about online education',
        response_json_schema: {
          type: 'object',
          properties: {
            titles: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Edge Function error: ${error.message || error.error}`);
    }

    const data = await response.json();
    console.log('✅ Response received:');
    console.log(JSON.stringify(data, null, 2));

    // Try to parse the content as JSON
    console.log('\n📊 Testing JSON parsing...');
    let parsedContent;

    try {
      parsedContent = JSON.parse(data.content);
      console.log('✅ JSON parsing succeeded!\n');
      console.log('Parsed content:');
      console.log(JSON.stringify(parsedContent, null, 2));

      // Validate structure
      if (parsedContent.titles && Array.isArray(parsedContent.titles)) {
        console.log(`\n✅ Schema validation passed! Found ${parsedContent.titles.length} titles:`);
        parsedContent.titles.forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
        console.log('\n🎉 TEST PASSED - JSON response fix is working!\n');
        return true;
      } else {
        console.log('\n❌ Schema validation failed - missing "titles" array');
        return false;
      }
    } catch (parseError) {
      console.log('❌ JSON parsing failed!');
      console.log('Error:', parseError.message);
      console.log('Raw content:', data.content);
      console.log('\n⚠️  TEST FAILED - Response is not valid JSON\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    return false;
  }
}

testJSONResponse()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
